import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PlaywrightCoverageAdapter } from "../../src/adapters/browser/playwright-coverage-adapter";
import { NodeFileSystem } from "../../src/adapters/fs/node-file-system";

describe("experience coverage validation", () => {
  const adapter = new PlaywrightCoverageAdapter(new NodeFileSystem());

  it("fails when an experience flow has TODO Playwright mapping", async () => {
    const result = await adapter.validateExperienceCoverage({
      projectRoot: process.cwd(),
      featureId: "feature",
      experienceMarkdown: `# Experience

### FLOW-001: Primary

- Playwright: TODO
`
    });

    expect(result.passed).toBe(false);
    expect(result.missingFlows).toEqual(["FLOW-001"]);
  });

  it("passes when every flow has a concrete Playwright reference", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-playwright-map-"));
    await writeFile(path.join(root, "primary.spec.ts"), `import { expect, test } from "@playwright/test";

test('primary flow', async ({ page }) => {
  await page.goto('/primary');
  await expect(page.getByText('Primary visible')).toBeVisible();
});

test('error flow', async ({ page }) => {
  await page.goto('/error');
  await expect(page.getByText('Error visible')).toBeVisible();
});
`);
    const result = await adapter.validateExperienceCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: `# Experience

### FLOW-001: Primary

- Playwright: primary.spec.ts::primary flow
- Route or Screen: /primary
- Database Mutations: None
- Expected Visible Outcome: Primary visible

### FLOW-002: Error

- Playwright: primary.spec.ts::error flow
- Route or Screen: /error
- Database Mutations: None
- Expected Visible Outcome: Error visible
`
    });

    expect(result.passed).toBe(true);
    expect(result.missingFlows).toEqual([]);
    await rm(root, { recursive: true, force: true });
  });

  it("requires mapped Playwright tests to cover edge and error states", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-playwright-edge-"));
    await writeFile(path.join(root, "primary.spec.ts"), `import { expect, test } from "@playwright/test";

test('primary flow', async ({ page }) => {
  await page.goto('/primary');
  await expect(page.getByText('Primary visible')).toBeVisible();
});
`);
    const result = await adapter.validateExperienceCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: `# Experience

### FLOW-001: Primary

- Playwright: primary.spec.ts::primary flow
- Route or Screen: /primary
- Edge Cases:
  - Validation error
- Database Mutations: None
- Expected Visible Outcome: Primary visible
`
    });

    expect(result.passed).toBe(false);
    expect(result.missingFlows).toEqual(["FLOW-001 (edge/error state evidence 'Validation error' not found in primary.spec.ts)"]);
    await rm(root, { recursive: true, force: true });
  });

  it("passes executed coverage from Playwright JSON reporter output containing mapped titles", async () => {
    const result = await adapter.validateExecutedExperienceCoverage({
      projectRoot: process.cwd(),
      featureId: "feature",
      packageScripts: { "test:e2e": "playwright test --reporter=json" },
      commands: [{
        command: "npm run test:e2e",
        exitCode: 0,
        stdout: JSON.stringify({
          suites: [{
            specs: [{
              title: "primary.spec.ts",
              tests: [{
                title: "primary flow",
                status: "expected",
                results: [{ status: "passed" }]
              }]
            }]
          }]
        }),
        stderr: ""
      }],
      experienceMarkdown: `# Experience

### FLOW-001: Primary

- Playwright: tests/e2e/primary.spec.ts::primary flow
`
    });

    expect(result.passed).toBe(true);
    expect(result.missingFlows).toEqual([]);
  });

  it("fails executed coverage when mapped title is absent from successful Playwright evidence", async () => {
    const result = await adapter.validateExecutedExperienceCoverage({
      projectRoot: process.cwd(),
      featureId: "feature",
      packageScripts: { "test:e2e": "playwright test" },
      commands: [{
        command: "npm run test:e2e",
        exitCode: 0,
        stdout: "playwright test ok",
        stderr: ""
      }],
      experienceMarkdown: `# Experience

### FLOW-001: Primary

- Playwright: tests/e2e/primary.spec.ts::primary flow
`
    });

    expect(result.passed).toBe(false);
    expect(result.missingFlows).toEqual(["FLOW-001::primary flow"]);
  });

  it("fails inventory coverage when a discovered route is missing from experience flows", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-ui-inventory-"));
    await mkdir(path.join(root, "src", "routes"), { recursive: true });
    await writeFile(path.join(root, "src", "routes", "settings.tsx"), "export function Settings() { return <form><button>Save</button></form>; }\n");
    const result = await adapter.validateInventoryCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: `# Experience

### FLOW-001: Dashboard

- Route or Screen: /dashboard
- Happy Path: Developer opens dashboard
- Playwright: tests/e2e/dashboard.spec.ts::opens dashboard
`
    });

    expect(result.passed).toBe(false);
    expect(result.missingWorkflows).toEqual(expect.arrayContaining(["route:/settings", "form-submit:/settings"]));
    await rm(root, { recursive: true, force: true });
  });

  it("allows discovered UI inventory with explicit out-of-scope rationale", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-ui-inventory-"));
    await mkdir(path.join(root, "src", "routes"), { recursive: true });
    await writeFile(path.join(root, "src", "routes", "settings.tsx"), "export function Settings() { return <form><button>Save</button></form>; }\n");
    const result = await adapter.validateInventoryCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: `# Experience

## Out Of Scope Workflows

- /settings is out of scope for this feature.
`
    });

    expect(result.passed).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("merges command-discovered UI inventory into coverage checks", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-ui-command-inventory-"));
    await mkdir(path.join(root, ".sdd"), { recursive: true });
    await mkdir(path.join(root, "scripts"), { recursive: true });
    await writeFile(path.join(root, ".sdd", "ui-inventory.json"), JSON.stringify({ commandTemplate: "node scripts/inventory.js" }));
    await writeFile(path.join(root, "scripts", "inventory.js"), `console.log(JSON.stringify({ routes: ["/admin/reports"] }));\n`);

    const result = await adapter.validateInventoryCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: `# Experience

### FLOW-001: Dashboard

- Route or Screen: /dashboard
- Happy Path: Developer opens dashboard
- Playwright: tests/e2e/dashboard.spec.ts::opens dashboard
`
    });

    expect(result.passed).toBe(false);
    expect(result.missingWorkflows).toContain("route:/admin/reports");
    await rm(root, { recursive: true, force: true });
  });

  it("blocks inventory coverage when configured UI inventory command fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-ui-command-inventory-"));
    await mkdir(path.join(root, ".sdd"), { recursive: true });
    await writeFile(path.join(root, ".sdd", "ui-inventory.json"), JSON.stringify({ commandTemplate: "node -e \"console.error('inventory failed'); process.exit(3)\"" }));

    const result = await adapter.validateInventoryCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: "# Experience\n"
    });

    expect(result.passed).toBe(false);
    expect(result.evidence).toContain("UI inventory command failed");
    await rm(root, { recursive: true, force: true });
  });

  it("blocks inventory coverage when configured UI inventory command emits malformed JSON", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-ui-command-inventory-"));
    await mkdir(path.join(root, ".sdd"), { recursive: true });
    await writeFile(path.join(root, ".sdd", "ui-inventory.json"), JSON.stringify({ commandTemplate: "node -e \"console.log('not-json')\"" }));

    const result = await adapter.validateInventoryCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: "# Experience\n"
    });

    expect(result.passed).toBe(false);
    expect(result.evidence).toContain("must be JSON");
    await rm(root, { recursive: true, force: true });
  });

  it("fails inventory coverage when a component form workflow is missing from experience flows", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-ui-component-inventory-"));
    await mkdir(path.join(root, "src", "components"), { recursive: true });
    await writeFile(path.join(root, "src", "components", "FeedbackForm.tsx"), "export function FeedbackForm() { return <form action=\"/feedback\"><button type=\"submit\">Send</button></form>; }\n");
    const result = await adapter.validateInventoryCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: `# Experience

### FLOW-001: Dashboard

- Route or Screen: /dashboard
- Happy Path: Developer opens dashboard
- Playwright: tests/e2e/dashboard.spec.ts::opens dashboard
`
    });

    expect(result.passed).toBe(false);
    expect(result.missingWorkflows).toEqual(expect.arrayContaining(["component-form:src/components/FeedbackForm.tsx"]));
    await rm(root, { recursive: true, force: true });
  });

  it("allows component inventory with explicit component out-of-scope rationale", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-ui-component-inventory-"));
    await mkdir(path.join(root, "src", "components"), { recursive: true });
    await writeFile(path.join(root, "src", "components", "FeedbackForm.tsx"), "export function FeedbackForm() { return <form action=\"/feedback\"><button type=\"submit\">Send</button></form>; }\n");
    const result = await adapter.validateInventoryCoverage({
      projectRoot: root,
      featureId: "feature",
      experienceMarkdown: `# Experience

## Out Of Scope Workflows

- src/components/FeedbackForm.tsx is out of scope for this feature.
`
    });

    expect(result.passed).toBe(true);
    await rm(root, { recursive: true, force: true });
  });
});
