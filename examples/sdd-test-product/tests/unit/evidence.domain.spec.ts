import { describe, expect, it } from "vitest";

type EvidenceDomain = typeof import("../../src/domain/evidence");

async function loadDomain(): Promise<EvidenceDomain> {
  return import("../../src/domain/evidence");
}

describe("Evidence domain contract", () => {
  it("requires title, category, and status before evidence can be persisted", async () => {
    const { validateEvidenceInput } = await loadDomain();

    const result = validateEvidenceInput({
      title: "   ",
      category: "",
      status: ""
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        title: "Title is required",
        category: "Category is required",
        status: "Status is required"
      }
    });
  });

  it("rejects unsupported category and status values before persistence", async () => {
    const { validateEvidenceInput } = await loadDomain();

    const untrustedInput = {
      title: "Out-of-contract evidence",
      category: "security-review",
      status: "pending"
    } as Parameters<typeof validateEvidenceInput>[0];

    const result = validateEvidenceInput(untrustedInput);

    expect(result).toEqual({
      ok: false,
      errors: {
        category: "Category must be one of unit, integration, database, playwright, telemetry",
        status: "Status must be passing or failing"
      }
    });
  });

  it("accepts all required evidence categories and preserves duplicate titles as separate records", async () => {
    const { createEvidenceRecord, REQUIRED_EVIDENCE_CATEGORIES } = await loadDomain();

    expect(REQUIRED_EVIDENCE_CATEGORIES).toEqual([
      "unit",
      "integration",
      "database",
      "playwright",
      "telemetry"
    ]);

    const first = createEvidenceRecord(
      { title: "Vitest red contract", category: "unit", status: "failing" },
      {
        createId: () => "evd-001",
        now: () => new Date("2026-05-26T03:00:00.000Z")
      }
    );
    const second = createEvidenceRecord(
      { title: "Vitest red contract", category: "unit", status: "failing" },
      {
        createId: () => "evd-002",
        now: () => new Date("2026-05-26T03:00:01.000Z")
      }
    );

    expect(first).toMatchObject({
      id: "evd-001",
      title: "Vitest red contract",
      category: "unit",
      status: "failing",
      createdAt: "2026-05-26T03:00:00.000Z"
    });
    expect(second).toMatchObject({
      id: "evd-002",
      title: "Vitest red contract",
      category: "unit",
      status: "failing",
      createdAt: "2026-05-26T03:00:01.000Z"
    });
    expect(first.id).not.toBe(second.id);
  });

  it("summarizes represented and missing evidence categories for reviewer inspection", async () => {
    const { summarizeEvidenceCategories } = await loadDomain();

    const summary = summarizeEvidenceCategories([
      {
        id: "evd-unit",
        title: "Unit coverage",
        category: "unit",
        status: "passing",
        createdAt: "2026-05-26T03:00:00.000Z"
      },
      {
        id: "evd-db",
        title: "SQLite copy coverage",
        category: "database",
        status: "passing",
        createdAt: "2026-05-26T03:01:00.000Z"
      }
    ]);

    expect(summary).toEqual([
      { category: "unit", represented: true, latestStatus: "passing", count: 1 },
      { category: "integration", represented: false, latestStatus: "missing", count: 0 },
      { category: "database", represented: true, latestStatus: "passing", count: 1 },
      { category: "playwright", represented: false, latestStatus: "missing", count: 0 },
      { category: "telemetry", represented: false, latestStatus: "missing", count: 0 }
    ]);
  });
});
