import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

type EvidenceCategory = "unit" | "integration" | "database" | "playwright" | "telemetry";
type EvidenceStatus = "passing" | "failing";

type SeedEvidenceRecord = {
  id: string;
  title: string;
  category: EvidenceCategory;
  status: EvidenceStatus;
  createdAt: string;
};

const requiredCategories: EvidenceCategory[] = [
  "unit",
  "integration",
  "database",
  "playwright",
  "telemetry"
];
const expectedTestDatabaseRoot =
  ".sdd/evidence/2026-05-26-workflow-evidence-dashboard/group-1-tests-first/test-db";

async function resetEvidence(
  request: APIRequestContext,
  records: SeedEvidenceRecord[] = []
): Promise<{ databasePath: string; recordCount: number }> {
  const response = await request.post("/api/test-controls/evidence/reset", {
    data: { records }
  });
  expect(response.ok(), await response.text()).toBe(true);

  const body = (await response.json()) as { databasePath: string; recordCount: number };
  expect(body.databasePath).toContain(expectedTestDatabaseRoot);
  expect(body.databasePath).not.toContain("data/app.sqlite");
  expect(body.recordCount).toBe(records.length);
  return body;
}

async function setPersistenceFailure(
  request: APIRequestContext,
  enabled: boolean
): Promise<void> {
  const response = await request.post("/api/test-controls/persistence-failure", {
    data: { enabled }
  });
  expect(response.ok(), await response.text()).toBe(true);
}

async function evidenceState(request: APIRequestContext): Promise<{
  databasePath: string;
  records: SeedEvidenceRecord[];
}> {
  const response = await request.get("/api/test-controls/evidence");
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as { databasePath: string; records: SeedEvidenceRecord[] };
  expect(body.databasePath).toContain(expectedTestDatabaseRoot);
  return body;
}

async function telemetryNames(request: APIRequestContext): Promise<string[]> {
  const response = await request.get("/api/test-controls/telemetry");
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as { events: Array<{ name: string }> };
  return body.events.map((event) => event.name);
}

async function fillEvidenceForm(
  page: Page,
  values: { title: string; category: EvidenceCategory; status: EvidenceStatus }
): Promise<void> {
  await page.getByRole("textbox", { name: /title/i }).fill(values.title);
  await page.getByLabel(/category/i).selectOption(values.category);
  await page.getByLabel(/status/i).selectOption(values.status);
}

async function submitEvidence(page: Page): Promise<void> {
  await page.getByRole("button", { name: /save evidence/i }).click();
}

test.describe("Workflow Evidence Dashboard", () => {
  test("operator creates evidence", async ({ page, request }) => {
    await resetEvidence(request);

    await page.goto("/evidence");

    await expect(page.getByRole("heading", { name: /workflow evidence/i })).toBeVisible();
    await expect(page.getByText(/no evidence has been recorded yet/i)).toBeVisible();

    await fillEvidenceForm(page, {
      title: "Vitest red phase evidence",
      category: "unit",
      status: "failing"
    });
    await submitEvidence(page);

    await expect(page.getByRole("alert")).toContainText(/evidence saved/i);
    await expect(page.getByRole("row", { name: /vitest red phase evidence/i })).toContainText(
      /unit/i
    );
    await expect(page.getByRole("row", { name: /vitest red phase evidence/i })).toContainText(
      /failing/i
    );
    await expect(page.getByRole("row", { name: /vitest red phase evidence/i })).toContainText(
      /\d{4}-\d{2}-\d{2}T/
    );

    await fillEvidenceForm(page, {
      title: "Vitest red phase evidence",
      category: "unit",
      status: "failing"
    });
    await submitEvidence(page);

    const state = await evidenceState(request);
    expect(state.records).toHaveLength(2);
    expect(state.records.map((record) => record.title)).toEqual([
      "Vitest red phase evidence",
      "Vitest red phase evidence"
    ]);
    expect(new Set(state.records.map((record) => record.id)).size).toBe(2);
    expect(state.records.every((record) => record.createdAt)).toBe(true);
    await expect(page.getByRole("row", { name: /vitest red phase evidence/i })).toHaveCount(2);
    await expect.poll(() => telemetryNames(request)).toEqual(
      expect.arrayContaining([
        "evidence_create_started",
        "validation_checked",
        "evidence_create_succeeded"
      ])
    );
  });

  test("operator sees validation errors", async ({ page, request }) => {
    await resetEvidence(request);

    await page.goto("/evidence");
    await page.getByRole("textbox", { name: /title/i }).fill("Title stays after blocked submit");
    await submitEvidence(page);

    await expect(page.getByText(/category is required/i)).toBeVisible();
    await expect(page.getByText(/status is required/i)).toBeVisible();
    await expect(page.getByRole("textbox", { name: /title/i })).toHaveValue(
      "Title stays after blocked submit"
    );
    await expect(page.getByRole("alert")).not.toContainText(/evidence saved/i);
    expect((await evidenceState(request)).records).toEqual([]);

    await page.getByRole("textbox", { name: /title/i }).fill("");
    await submitEvidence(page);

    await expect(page.getByText(/title is required/i)).toBeVisible();
    expect((await evidenceState(request)).records).toEqual([]);
    await expect.poll(() => telemetryNames(request)).toEqual(
      expect.arrayContaining(["validation_checked", "evidence_create_failed"])
    );
  });

  test("reviewer inspects evidence categories", async ({ page, request }) => {
    const allCategoryRecords = requiredCategories.map((category, index) => ({
      id: `evd-review-${category}`,
      title: `${category} coverage evidence`,
      category,
      status: "passing" as const,
      createdAt: `2026-05-26T03:2${index}:00.000Z`
    }));
    await resetEvidence(request, allCategoryRecords);

    await page.goto("/evidence");

    for (const category of requiredCategories) {
      await expect(page.getByRole("row", { name: new RegExp(`${category} coverage`, "i") })).toBeVisible();
      await expect(
        page.getByTestId(`category-summary-${category}`)
      ).toContainText(/represented/i);
      await expect(page.getByTestId(`category-summary-${category}`)).toContainText(/passing/i);
    }

    await resetEvidence(
      request,
      allCategoryRecords.filter((record) => record.category !== "telemetry")
    );
    await page.reload();

    await expect(page.getByTestId("category-summary-telemetry")).toContainText(/missing/i);
    expect((await evidenceState(request)).records.map((record) => record.category)).not.toContain(
      "telemetry"
    );
  });

  test("persistence failure is visible", async ({ page, request }) => {
    await resetEvidence(request);
    await setPersistenceFailure(request, true);

    await page.goto("/evidence");
    await fillEvidenceForm(page, {
      title: "Write failure should not save",
      category: "database",
      status: "failing"
    });
    await submitEvidence(page);

    await expect(page.getByRole("alert")).toContainText(/unable to save evidence/i);
    await expect(page.getByRole("alert")).not.toContainText(/evidence saved/i);
    await expect(page.getByRole("row", { name: /write failure should not save/i })).toHaveCount(0);
    expect((await evidenceState(request)).records).toEqual([]);
    await expect.poll(() => telemetryNames(request)).toEqual(
      expect.arrayContaining(["database_write_failed", "evidence_create_failed"])
    );

    await setPersistenceFailure(request, false);
    await submitEvidence(page);

    await expect(page.getByRole("alert")).toContainText(/evidence saved/i);
    await expect(page.getByRole("row", { name: /write failure should not save/i })).toBeVisible();
    expect((await evidenceState(request)).records).toHaveLength(1);
  });
});
