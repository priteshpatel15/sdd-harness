import { afterEach, beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import { chmod } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { promisify } from "node:util";
import { createTempProject, TempProject } from "../helpers/temp-project";
import { runCli } from "../../src/interfaces/cli/main";
import { PROMPT_TEMPLATES } from "../../src/domain/prompt-catalog";
import { PromptId } from "../../src/domain/models";
import { createInitialWorkflowState } from "../../src/domain/workflow";

const execFileAsync = promisify(execFile);
const requireFromTest = createRequire(__filename);
const sqlJsPackage = requireFromTest.resolve("sql.js");

describe("sdd grouped CLI workflow", () => {
  let project: TempProject;
  let stdout: string[];
  let stderr: string[];

  beforeEach(async () => {
    project = await createTempProject();
    stdout = [];
    stderr = [];
  });

  afterEach(async () => {
    await project.cleanup();
  });

  function featureCreateArgs(questionFile: string): string[] {
    return [
      "feature", "create",
      "--project", project.root,
      "--questions", questionFile,
      "--waiver-reason", "Test fixture does not need a git branch.",
      "--approved-by", "Architect"
    ];
  }

  it("runs greenfield intake through feature completion gates", async () => {
    await expectCli([
      "jtbd", "intake",
      "--project", project.root,
      "--product", "SpecPilot",
      "--audience", "Developers",
      "--problem", "AI agents drift from strict specs",
      "--job", "Automate spec-driven development",
      "--stakeholder", "Mary(engineering)=Needs hard gates"
    ], 0);

    await writeQuestions("constitution-questions.json", "constitution", {
      mission: "SpecPilot helps developers keep AI-built software aligned with specifications. Success means every change has evidence.",
      targetAudience: "Developers using AI coding agents",
      techStack: "TypeScript, Clean Architecture, Vitest, Playwright, TDD",
      roadmap: "Feature spec automation"
    });

    await expectCli(["constitution", "create", "--project", project.root, "--questions", "constitution-questions.json"], 0);
    await expectCli(["constitution", "validate", "--project", project.root], 0);
    await expectCli(["constitution", "approve", "--project", project.root, "--reviewer", "Architect"], 0);

    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Create feature specs from roadmap",
      decisions: "Use markdown docs and .sdd metadata",
      context: "Hard gates prevent implementation before approval",
      experience: "No UI-facing experience; no experience.md required."
    });

    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;

    await writeSemanticQuestions("semantics-questions.json");
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--compat-tdd",
      "--waiver-reason", "Fixture uses pre-existing test evidence instead of command-backed TDD.",
      "--approved-by", "Architect"
    ], 0);
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-2-implementation",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-2-implementation`,
      "--test-evidence", "tests/feature.test.ts::group-2-implementation::VAL-001",
      "--compat-tdd",
      "--waiver-reason", "Fixture uses pre-existing test evidence instead of command-backed TDD.",
      "--approved-by", "Architect"
    ], 0);
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-3-validation",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-3-validation`,
      "--waiver-reason", "Final validation command evidence covers this group",
      "--approved-by", "Architect"
    ], 0);

    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await writeSemanticVerifier();
    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "review-decisions", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["changelog", "update", "--project", project.root], 0);
    await expectCli(["feature", "complete", "--project", project.root, "--feature", featureId, "--roadmap-evidence", "specs/roadmap.md"], 0);

    await expect(project.read(path.join(".sdd", "implementation-packets", `${featureId}.md`))).resolves.toContain("Hard Gates");
    await expect(project.read(".sdd/workflow-state.json")).resolves.toContain("run-changelog-skill");
    await expect(project.read(".sdd/validation-summaries.jsonl")).resolves.toContain(featureId);
    await expect(project.read("specs/roadmap.md")).resolves.toContain("- [x] Define acceptance criteria");
  });

  it("runs a strict UI/database feature from branch evidence through final completion", async () => {
    await initGit();
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: UI Data Workflow\n\n**Goal:** Ship the feedback workflow\n\n- [ ] Ship feedback workflow\n");
    await project.write("src/pages/feedback.tsx", `export function FeedbackPage() {
  return <form action="/feedback" method="post"><button>Submit feedback</button></form>;
}
`);
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a browser feedback workflow that writes to a database",
      decisions: "Require branch evidence, Playwright coverage, mutation verification, deep review, and semantic verification",
      context: "The /feedback route persists records in an isolated sqlite copy",
      experience: `## Experience Flows

### FLOW-001: Submit feedback

- Role: Signed-in customer
- Route or Screen: /feedback
- Happy Path: User submits feedback through the browser form
- Edge Cases:
  - Validation error
- Data Setup: Seed signed-in customer
- Database Mutations: Insert feedback row in the test database
- Expected Visible Outcome: Confirmation appears
- Playwright: tests/e2e/feedback.spec.ts::submits feedback form`
    });
    await expectCli(["workflow", "branch", "--project", project.root, "--purpose", "feature", "--name", "UI Data Workflow", "--allow-dirty"], 0);
    await expectCli(["feature", "create", "--project", project.root, "--name", "UI Data Workflow", "--questions", "feature-questions.json"], 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;

    await project.write("playwright.config.ts", "export default {};\n");
    await writeSemanticQuestions("semantics-questions.json", {
      scenarios: "Submit feedback through FLOW-001: open /feedback -> submit feedback -> assert confirmation",
      data: "Insert feedback row in the test database"
    });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);

    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('strict task evidence group-1-tests-first group-2-implementation group-3-validation VAL-001', () => { expect(true).toBe(true); });\n");
    for (const taskGroup of ["group-1-tests-first", "group-2-implementation", "group-3-validation"]) {
      await recordTddPhase(featureId, taskGroup, "red", `tests/feature.test.ts::${taskGroup}::VAL-001`, "node -e \"setTimeout(() => process.exit(1), 5)\"");
      await recordTddPhase(featureId, taskGroup, "green", `tests/feature.test.ts::${taskGroup}::VAL-001`, "node -e \"setTimeout(() => process.exit(0), 5)\"");
      await recordTddPhase(featureId, taskGroup, "refactor", `tests/feature.test.ts::${taskGroup}::VAL-001`, "node -e \"setTimeout(() => process.exit(0), 5)\"");
      await expectCli([
        "feature", "complete-task-group",
        "--project", project.root,
        "--feature", featureId,
        "--task-group", taskGroup,
        "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::${taskGroup}`,
        "--test-evidence", `tests/feature.test.ts::${taskGroup}::VAL-001`,
        "--strict-tdd"
      ], 0);
    }

    await project.write("tests/e2e/feedback.spec.ts", `import { expect, test } from '@playwright/test';

test('submits feedback form', async ({ page }) => {
  await page.goto('/feedback');
  await expect(page.getByText('Confirmation appears')).toBeVisible();
  await expect(page.getByText('Validation error')).toBeVisible();
  // Insert feedback row in the test database
});
`);
    await project.write("app.sqlite", "database");
    await project.write("scripts/e2e.js", "const fs = require('fs'); const db = process.env.DATABASE_URL; if (!db) process.exit(1); fs.appendFileSync(db, '\\nfeedback row'); console.log('e2e ok');\n");
    await project.write("scripts/assert-db.js", `const fs = require("fs");
const expected = JSON.parse(fs.readFileSync(process.env.SDD_EXPECTED_MUTATIONS_FILE, "utf8"));
const db = fs.readFileSync(process.env.SDD_TEST_DATABASE, "utf8");
if (!expected.mutations.some((item) => item.includes("Insert feedback row"))) process.exit(2);
if (!db.includes("feedback row")) process.exit(3);
console.log("mutation verified");
`);
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await project.write(path.join("node_modules", ".bin", "playwright"), `#!/usr/bin/env node
console.log(JSON.stringify({ suites: [{ specs: [{ title: "submits feedback form", tests: [{ status: "passed" }] }] }] }));
`);
    await chmod(path.join(project.root, "node_modules", ".bin", "playwright"), 0o755);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "node scripts/e2e.js && playwright test --reporter=json" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite", "--strict-playwright"], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await writeSemanticVerifier();
    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "review-decisions", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["changelog", "update", "--project", project.root], 0);
    await expectCli(["feature", "complete", "--project", project.root, "--feature", featureId, "--roadmap-evidence", "specs/roadmap.md"], 0);

    await expect(project.read(".sdd/branch-actions.jsonl")).resolves.toContain("feature/ui-data-workflow");
    await expect(project.read(".sdd/tdd-evidence.jsonl")).resolves.toContain("\"phase\":\"refactor\"");
    await expect(project.read(".sdd/validation-summaries.jsonl")).resolves.toContain("database-mutation-verifier");
    await expect(project.read("specs/roadmap.md")).resolves.toContain("- [x] Ship feedback workflow");
  });

  it("fails feature spec creation without persisted grouped question evidence", async () => {
    await expectCli(["feature", "create", "--project", project.root, "--scope", "Only scope"], 2);
    expect(stderr.join("\n")).toContain("Missing required option --questions");
  });

  it("blocks feature spec creation without matching branch evidence", async () => {
    await initGit();
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Branch Gate\n\n**Goal:** Branch gate\n\n- [ ] Build branch-gated feature\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build branch-gated feature",
      decisions: "Require workflow branch evidence",
      context: "Spec work must happen on the matching branch",
      experience: "No UI-facing experience; no experience.md required."
    });

    await expectCli(["feature", "create", "--project", project.root, "--questions", "feature-questions.json"], 2);
    expect(stderr.join("\n")).toContain("requires branch evidence");
  });

  it("blocks feature spec creation on the wrong current branch", async () => {
    await initGit();
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Branch Gate\n\n**Goal:** Branch gate\n\n- [ ] Build branch-gated feature\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build branch-gated feature",
      decisions: "Require workflow branch evidence",
      context: "Spec work must happen on the matching branch",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(["workflow", "branch", "--project", project.root, "--purpose", "feature", "--name", "Branch Gate", "--allow-dirty"], 0);
    await execFileAsync("git", ["switch", "-c", "feature/wrong-branch"], { cwd: project.root });

    await expectCli(["feature", "create", "--project", project.root, "--questions", "feature-questions.json"], 2);
    expect(stderr.join("\n")).toContain("Current branch");
  });

  it("blocks workflow branch creation with a dirty tree unless explicitly allowed", async () => {
    await initGit();
    await project.write("README.md", "dirty\n");

    await expectCli(["workflow", "branch", "--project", project.root, "--purpose", "feature", "--name", "Dirty Branch"], 2);
    expect(stderr.join("\n")).toContain("uncommitted changes");
  });

  it("allows feature spec creation with matching branch evidence", async () => {
    await initGit();
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Branch Gate\n\n**Goal:** Branch gate\n\n- [ ] Build branch-gated feature\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build branch-gated feature",
      decisions: "Require workflow branch evidence",
      context: "Spec work must happen on the matching branch",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(["workflow", "branch", "--project", project.root, "--purpose", "feature", "--name", "Branch Gate", "--allow-dirty"], 0);

    await expectCli(["feature", "create", "--project", project.root, "--questions", "feature-questions.json"], 0);
    await expect(project.read(".sdd/branch-actions.jsonl")).resolves.toContain("feature/branch-gate");
  });

  it("captures grouped question evidence through the harness", async () => {
    await expectCli([
      "questions", "capture",
      "--project", project.root,
      "--workflow", "feature-spec",
      "--output", "feature-questions.json",
      "--answer", "scope=Create feature specs from roadmap",
      "--answer", "decisions=Use markdown docs and .sdd metadata",
      "--answer", "context=Hard gates prevent implementation before approval",
      "--answer", "experience=No UI-facing experience; no experience.md required."
    ], 0);

    const evidence = JSON.parse(await project.read("feature-questions.json")) as {
      workflow: string;
      promptId: string;
      promptHash: string;
      answers: Record<string, string>;
    };
    expect(evidence.workflow).toBe("feature-spec");
    expect(evidence.promptId).toBe("feature.create");
    expect(evidence.promptHash).toBe(hashPromptTemplate("feature.create"));
    expect(evidence.answers.scope).toContain("Create feature specs");

    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Feature Specs\n\n**Goal:** Feature specs\n\n- [ ] Create feature specs from roadmap\n");
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
  });

  it("captures grouped question evidence through a configured command adapter", async () => {
    await project.write(".sdd/user-question-adapter.json", JSON.stringify({
      commandTemplate: "node scripts/question-adapter.js --workflow {workflow} --prompt {promptFile} --output {outputFile}",
      timeoutMs: 600000
    }));
    await project.write("scripts/question-adapter.js", `const fs = require("fs");
const output = process.argv[process.argv.indexOf("--output") + 1];
fs.writeFileSync(output, JSON.stringify({ answers: {
  scope: "Create feature specs from roadmap",
  decisions: "Use markdown docs and .sdd metadata",
  context: "Hard gates prevent implementation before approval",
  experience: "No UI-facing experience; no experience.md required."
} }));
`);

    await expectCli([
      "questions", "capture",
      "--project", project.root,
      "--workflow", "feature-spec",
      "--output", "feature-questions.json"
    ], 0);

    const evidence = JSON.parse(await project.read("feature-questions.json")) as {
      source: string;
      workflow: string;
      promptId: string;
      promptHash: string;
      answers: Record<string, string>;
    };
    expect(evidence.source).toBe("agent");
    expect(evidence.workflow).toBe("feature-spec");
    expect(evidence.promptId).toBe("feature.create");
    expect(evidence.promptHash).toBe(hashPromptTemplate("feature.create"));
    expect(evidence.answers.scope).toContain("Create feature specs");
  });

  it("fails configured question capture when the adapter omits a required answer", async () => {
    await project.write(".sdd/user-question-adapter.json", JSON.stringify({
      commandTemplate: "node scripts/question-adapter.js --workflow {workflow} --prompt {promptFile} --output {outputFile}",
      timeoutMs: 600000
    }));
    await project.write("scripts/question-adapter.js", `const fs = require("fs");
const output = process.argv[process.argv.indexOf("--output") + 1];
fs.writeFileSync(output, JSON.stringify({ answers: {
  scope: "Create feature specs from roadmap",
  decisions: "Use markdown docs and .sdd metadata",
  context: "Hard gates prevent implementation before approval"
} }));
`);

    await expectCli([
      "questions", "capture",
      "--project", project.root,
      "--workflow", "feature-spec",
      "--output", "feature-questions.json"
    ], 3);
    expect(stderr.join("\n")).toContain("experience");
  });

  it("blocks feature spec creation when experience question evidence is missing", async () => {
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build next feature",
      decisions: "Keep it small",
      context: "Implementation must wait for approval"
    });

    await expectCli(featureCreateArgs("feature-questions.json"), 2);
    expect(stderr.join("\n")).toContain("feature-spec.questions.experience");
  });

  it("blocks UI feature spec creation when experience flows are incomplete", async () => {
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a browser settings screen",
      decisions: "Use Playwright",
      context: "The page updates preferences",
      experience: "The user opens settings and saves changes."
    });

    await expectCli(featureCreateArgs("feature-questions.json"), 2);
    expect(stderr.join("\n")).toContain("feature.experience.flows");
  });

  it("requires approval before implementation", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Next\n\n- [ ] Build next feature\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build next feature",
      decisions: "Keep it small",
      context: "Implementation must wait for approval",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSemanticQuestions("semantics-questions.json");
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);

    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("must be approved");
  });

  it("blocks draft feature validation and does not unlock implementation", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Draft\n\n- [ ] Build draft feature\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build CLI export",
      decisions: "Use metadata",
      context: "Internal command only",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 2);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("Current status: draft");
  });

  it("requires at least one validation command", async () => {
    await expectCli(["feature", "run-validation", "--project", project.root], 3);
    expect(stderr.join("\n")).toContain("validation requires at least one command");
  });

  it("does not allow packet-only implementation to reach validation", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("Current status: approved");
  });

  it("rejects fake task evidence paths", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);

    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md`,
      "--test-evidence", "tests/missing.test.ts",
      "--compat-tdd",
      "--waiver-reason", "Fixture is testing file existence before command-backed TDD.",
      "--approved-by", "Architect"
    ], 2);
    expect(stderr.join("\n")).toContain("must reference existing file paths");
  });

  it("rejects unknown task group evidence", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('unknown VAL-001', () => { expect(true).toBe(true); });\n");

    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-404-missing",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-404-missing`,
      "--test-evidence", "tests/feature.test.ts::group-404-missing::VAL-001"
    ], 2);
    expect(stderr.join("\n")).toContain("does not exist in the approved plan");
  });

  it("requires command-backed red and green test evidence for task completion by default", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");

    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001"
    ], 2);
    expect(stderr.join("\n")).toContain("command-backed red and green");

    await recordTddPhase(featureId, "group-1-tests-first", "red", "tests/feature.test.ts::group-1-tests-first::VAL-001", "node -e \"setTimeout(() => process.exit(1), 5)\"");
    await recordTddPhase(featureId, "group-1-tests-first", "green", "tests/feature.test.ts::group-1-tests-first::VAL-001", "node -e \"setTimeout(() => process.exit(0), 5)\"");
    await recordTddPhase(featureId, "group-1-tests-first", "refactor", "tests/feature.test.ts::group-1-tests-first::VAL-001", "node -e \"setTimeout(() => process.exit(0), 5)\"");
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--compat-tdd",
      "--waiver-reason", "Fixture uses pre-existing test evidence instead of command-backed TDD.",
      "--approved-by", "Architect"
    ], 0);
    await expect(project.read(".sdd/tdd-evidence.jsonl")).resolves.toContain("\"phase\":\"red\"");
    await expect(project.read(".sdd/tdd-evidence.jsonl")).resolves.toContain("\"phase\":\"green\"");
    await expect(project.read(".sdd/tdd-evidence.jsonl")).resolves.toContain("\"result\":\"failed-as-expected\"");
    await expect(project.read(".sdd/tdd-evidence.jsonl")).resolves.toContain("\"result\":\"passed\"");
  });

  it("allows explicit compatibility TDD completion only with waiver evidence", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");

    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--compat-tdd"
    ], 2);
    expect(stderr.join("\n")).toContain("--compat-tdd requires --waiver-reason");

    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--compat-tdd",
      "--waiver-reason", "Legacy fixture has inline test evidence only.",
      "--approved-by", "Architect"
    ], 0);
    await expect(project.read(".sdd/waivers.jsonl")).resolves.toContain("task-group.strict-tdd");
  });

  it("rejects unexpected command results while recording strict TDD evidence", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");

    await expectCli([
      "feature", "record-tdd",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--phase", "red",
      "--evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--command", "node -e \"process.exit(0)\""
    ], 2);
    expect(stderr.join("\n")).toContain("must fail");

    await expectCli([
      "feature", "record-tdd",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--phase", "green",
      "--evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--command", "node -e \"process.exit(1)\""
    ], 2);
    expect(stderr.join("\n")).toContain("must pass");
  });

  it("rejects strict TDD completion when green evidence predates red evidence", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");

    await recordTddPhase(featureId, "group-1-tests-first", "green", "tests/feature.test.ts::group-1-tests-first::VAL-001", "node -e \"setTimeout(() => process.exit(0), 5)\"");
    await recordTddPhase(featureId, "group-1-tests-first", "red", "tests/feature.test.ts::group-1-tests-first::VAL-001", "node -e \"setTimeout(() => process.exit(1), 5)\"");
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001"
    ], 2);
    expect(stderr.join("\n")).toContain("same test file");
  });

  it("rejects strict TDD completion when final test evidence is not the recorded red/green test file", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/strict.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('different file group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");

    await recordTddPhase(featureId, "group-1-tests-first", "red", "tests/strict.test.ts::group-1-tests-first::VAL-001", "node -e \"process.exit(1)\"");
    await recordTddPhase(featureId, "group-1-tests-first", "green", "tests/strict.test.ts::group-1-tests-first::VAL-001", "node -e \"process.exit(0)\"");
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001"
    ], 2);
    expect(stderr.join("\n")).toContain("same test file recorded in the matching red/green TDD pair");
  });

  it("rejects TDD evidence without task-group and validation mappings", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");

    await expectCli([
      "feature", "record-tdd",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--phase", "red",
      "--evidence", "tests/feature.test.ts::group-2-implementation",
      "--command", "node -e \"process.exit(1)\""
    ], 2);
    expect(stderr.join("\n")).toContain("must map to task group");
  });

  it("rejects mismatched question evidence provenance", async () => {
    await project.write("bad-questions.json", JSON.stringify({
      id: "bad",
      workflow: "constitution",
      promptId: "constitution.create",
      promptHash: hashPromptTemplate("constitution.create"),
      source: "test",
      createdAt: "2026-05-23T00:00:00.000Z",
      answers: {
        scope: "Build",
        decisions: "Use metadata",
        context: "Internal",
        experience: "No UI-facing experience; no experience.md required."
      }
    }));

    await expectCli(featureCreateArgs("bad-questions.json"), 2);
    expect(stderr.join("\n")).toContain("workflow mismatch");
  });

  it("blocks implementation when approved spec files change", async () => {
    const featureId = await createApprovedNonUiFeature();
    await project.write(path.join("specs", featureId, "requirements.md"), "# Requirements\n\nChanged after approval\n");

    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("changed after approval");
  });

  it("records validation command evidence", async () => {
    await project.write("package.json", JSON.stringify({
      scripts: {
        test: "node -e \"console.log('test ok')\""
      }
    }));

    await expectCli(["feature", "run-validation", "--project", project.root], 0);
    await expect(project.read(".sdd/evidence.jsonl")).resolves.toContain("npm test passed");
    await expect(project.read(".sdd/validation-summaries.jsonl")).resolves.toContain("npm test");
  });

  it("records started and terminal telemetry for validation commands", async () => {
    await project.write("package.json", JSON.stringify({
      scripts: {
        test: "node -e \"console.log('test ok')\""
      }
    }));

    await expectCli(["feature", "run-validation", "--project", project.root], 0);
    await expectCli(["feature", "run-validation", "--project", project.root, "--command", "node -e \"process.exit(1)\""], 3);

    const traces = (await project.read(".sdd/telemetry.jsonl"))
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { command: string; status: string; gates?: unknown[]; evidence?: unknown[] });
    expect(traces.some((trace) => trace.command === "feature run-validation" && trace.status === "started")).toBe(true);
    expect(traces.some((trace) => trace.command === "feature run-validation" && trace.status === "succeeded" && (trace.evidence ?? []).length > 0)).toBe(true);
    expect(traces.some((trace) => trace.command === "feature run-validation" && trace.status === "failed" && (trace.gates ?? []).length > 0)).toBe(true);
  });

  it("reports missing workflow tooling through doctor", async () => {
    await expectCli(["workflow", "doctor", "--project", project.root], 2);
    expect(stdout.join("\n")).toContain("MISSING test script");
    expect(stdout.join("\n")).toContain("MISSING Playwright dependency");
  });

  it("reports missing Playwright validation command for a plain Node test:e2e script", async () => {
    await project.write("package.json", JSON.stringify({
      scripts: {
        typecheck: "tsc --noEmit",
        test: "vitest run",
        "test:e2e": "node scripts/e2e.js",
        build: "tsc -p tsconfig.build.json"
      },
      devDependencies: {
        "@playwright/test": "^1.60.0"
      }
    }));

    await expectCli(["workflow", "doctor", "--project", project.root], 2);
    expect(stdout.join("\n")).toContain("MISSING Playwright validation command");
  });

  it("fails workflow doctor strict mode when strict adapter config is missing", async () => {
    await project.write("package.json", JSON.stringify({
      scripts: {
        typecheck: "tsc --noEmit",
        test: "vitest run",
        "test:e2e": "playwright test",
        build: "tsc -p tsconfig.build.json"
      },
      devDependencies: {
        "@playwright/test": "^1.60.0"
      }
    }));
    await project.write(".sdd/review-agents.json", JSON.stringify({ commandTemplate: "node scripts/review-agent.js", requiredLenses: ["architecture"] }));
    await project.write(".sdd/semantic-verifiers.json", JSON.stringify({ commandTemplate: "node scripts/semantic-verifier.js" }));
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));

    await expectCli(["workflow", "doctor", "--project", project.root, "--strict"], 2);
    expect(stdout.join("\n")).toContain("MISSING user-question adapter");
  });

  it("passes workflow doctor strict mode when strict adapter config is present", async () => {
    await project.write("package.json", JSON.stringify({
      scripts: {
        typecheck: "tsc --noEmit",
        test: "vitest run",
        "test:e2e": "playwright test",
        build: "tsc -p tsconfig.build.json"
      },
      devDependencies: {
        "@playwright/test": "^1.60.0"
      }
    }));
    await project.write(".sdd/review-agents.json", JSON.stringify({ commandTemplate: "node scripts/review-agent.js", requiredLenses: ["architecture"] }));
    await project.write(".sdd/semantic-verifiers.json", JSON.stringify({ commandTemplate: "node scripts/semantic-verifier.js" }));
    await project.write(".sdd/user-question-adapter.json", JSON.stringify({ commandTemplate: "node scripts/question-adapter.js --workflow {workflow} --prompt {promptFile} --output {outputFile}" }));
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await project.write(".sdd/docs-lookup.json", JSON.stringify({ docs: [{ title: "Local docs", url: "https://example.test/docs", summary: "Configured docs lookup" }] }));
    await project.write(".sdd/issue-tracker.json", JSON.stringify({ items: [{ id: "ISSUE-1", title: "Configured issue tracker", status: "open" }] }));

    await expectCli(["workflow", "doctor", "--project", project.root, "--strict"], 0);
    expect(stdout.join("\n")).toContain("OK user-question adapter");
    expect(stdout.join("\n")).toContain("OK database mutation verifier");
    expect(stdout.join("\n")).toContain("OK docs lookup adapter");
    expect(stdout.join("\n")).toContain("OK issue tracker adapter");
    expect(stdout.join("\n")).toContain("OK architecture policy");
  });

  it("fails workflow doctor strict mode for malformed optional adapter config", async () => {
    await project.write("package.json", JSON.stringify({
      scripts: {
        typecheck: "tsc --noEmit",
        test: "vitest run",
        "test:e2e": "playwright test",
        build: "tsc -p tsconfig.build.json"
      },
      devDependencies: {
        "@playwright/test": "^1.60.0"
      }
    }));
    await project.write(".sdd/review-agents.json", JSON.stringify({ commandTemplate: "node scripts/review-agent.js", requiredLenses: ["architecture"] }));
    await project.write(".sdd/semantic-verifiers.json", JSON.stringify({ commandTemplate: "node scripts/semantic-verifier.js" }));
    await project.write(".sdd/user-question-adapter.json", JSON.stringify({ commandTemplate: "node scripts/question-adapter.js --workflow {workflow} --prompt {promptFile} --output {outputFile}" }));
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await project.write(".sdd/docs-lookup.json", JSON.stringify({ docs: "bad" }));
    await project.write(".sdd/issue-tracker.json", JSON.stringify({ items: "bad" }));

    await expectCli(["workflow", "doctor", "--project", project.root, "--strict"], 2);
    expect(stdout.join("\n")).toContain("Fix .sdd/docs-lookup.json");
    expect(stdout.join("\n")).toContain("Fix .sdd/issue-tracker.json");
  });

  it("fails workflow doctor strict mode for architecture boundary violations", async () => {
    await project.write("package.json", JSON.stringify({
      scripts: {
        typecheck: "tsc --noEmit",
        test: "vitest run",
        "test:e2e": "playwright test",
        build: "tsc -p tsconfig.build.json"
      },
      devDependencies: {
        "@playwright/test": "^1.60.0"
      }
    }));
    await project.write(".sdd/review-agents.json", JSON.stringify({ commandTemplate: "node scripts/review-agent.js", requiredLenses: ["architecture"] }));
    await project.write(".sdd/semantic-verifiers.json", JSON.stringify({ commandTemplate: "node scripts/semantic-verifier.js" }));
    await project.write(".sdd/user-question-adapter.json", JSON.stringify({ commandTemplate: "node scripts/question-adapter.js --workflow {workflow} --prompt {promptFile} --output {outputFile}" }));
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await project.write(".sdd/docs-lookup.json", JSON.stringify({ docs: [{ title: "Local docs", url: "https://example.test/docs", summary: "Configured docs lookup" }] }));
    await project.write(".sdd/issue-tracker.json", JSON.stringify({ items: [{ id: "ISSUE-1", title: "Configured issue tracker", status: "open" }] }));
    await project.write("src/application/bad.ts", "import { Repo } from '../adapters/repo';\nexport const value = Repo;\n");

    await expectCli(["workflow", "doctor", "--project", project.root, "--strict"], 2);
    expect(stdout.join("\n")).toContain("MISSING architecture policy");
  });

  it("blocks deep review when command-backed subagents are not configured unless waived", async () => {
    await expectCli(["feature", "deep-review", "--project", project.root], 2);
    expect(stderr.join("\n")).toContain("deep review found blocking review issues");

    await expectCli(["feature", "deep-review", "--project", project.root, "--waiver-reason", "Local agent unavailable", "--approved-by", "Architect"], 0);
    await expect(project.read(".sdd/workflow-state.json")).resolves.toContain("Local agent unavailable");
  });

  it("blocks completion when semantic verification is missing", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--compat-tdd",
      "--waiver-reason", "Fixture uses pre-existing test evidence instead of command-backed TDD.",
      "--approved-by", "Architect"
    ], 0);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "review-decisions", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["changelog", "update", "--project", project.root], 0);

    await expectCli(["feature", "complete", "--project", project.root, "--feature", featureId, "--roadmap-evidence", "specs/roadmap.md"], 2);
    expect(stderr.join("\n")).toContain("semantic verification");
  });

  it("blocks completion when planned task groups are not all complete or waived", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await writeSemanticVerifier();
    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "review-decisions", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["changelog", "update", "--project", project.root], 0);

    await expectCli(["feature", "complete", "--project", project.root, "--feature", featureId, "--roadmap-evidence", "specs/roadmap.md"], 2);
    expect(stderr.join("\n")).toContain("completed or waived task groups");
  });

  it("does not let feature-level waivers bypass planned task groups", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await writeSemanticVerifier();
    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "review-decisions", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["changelog", "update", "--project", project.root], 0);

    await expectCli([
      "feature", "complete",
      "--project", project.root,
      "--feature", featureId,
      "--roadmap-evidence", "specs/roadmap.md",
      "--waiver-reason", "Waive remaining completion gates",
      "--approved-by", "Architect"
    ], 2);
    expect(stderr.join("\n")).toContain("cannot waive planned task groups at the feature level");
  });

  it("blocks semantic verification when a cited blocking finding is returned", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--compat-tdd",
      "--waiver-reason", "Fixture uses pre-existing test evidence instead of command-backed TDD.",
      "--approved-by", "Architect"
    ], 0);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await writeSemanticVerifier(true);

    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("semantic verification failed");
  });

  it("blocks completion when a blocking review finding lacks a decision", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeBlockingReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId, "--waiver-reason", "Review finding accepted for follow-up", "--approved-by", "Architect"], 0);
    await writeSemanticVerifier();
    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["changelog", "update", "--project", project.root], 0);

    await expectCli(["feature", "complete", "--project", project.root, "--feature", featureId, "--roadmap-evidence", "specs/roadmap.md"], 2);
    expect(stderr.join("\n")).toContain("review decision for architecture-block");
  });

  it("blocks completion when an accepted blocking review finding has no follow-up evidence", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeBlockingReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId, "--waiver-reason", "Review finding accepted for follow-up", "--approved-by", "Architect"], 0);
    await writeSemanticVerifier();
    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "review-decisions", "--project", project.root, "--feature", featureId, "--decision", "architecture-block|accepted|Will fix before merge"], 0);
    await expectCli(["changelog", "update", "--project", project.root], 0);

    await expectCli(["feature", "complete", "--project", project.root, "--feature", featureId, "--roadmap-evidence", "specs/roadmap.md"], 2);
    expect(stderr.join("\n")).toContain("follow-up evidence for accepted blocking review finding architecture-block");
  });

  it("blocks completion when approved spec files changed after validation", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeAllTaskGroups(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await writeSemanticVerifier();
    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "review-decisions", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["changelog", "update", "--project", project.root], 0);
    await project.write(path.join("specs", featureId, "requirements.md"), "# Requirements\n\nChanged after approval\n");

    await expectCli(["feature", "complete", "--project", project.root, "--feature", featureId, "--roadmap-evidence", "specs/roadmap.md"], 2);
    expect(stderr.join("\n")).toContain("changed after approval");
  });

  it("blocks UI validation when mapped Playwright test lacks expected outcome proof", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: UI\n\n- [ ] Build UI page\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a browser page",
      decisions: "Use Playwright coverage",
      context: "The route shows a dashboard screen",
      experience: `## Experience Flows

### FLOW-001: Open dashboard

- Role: Developer
- Route or Screen: /dashboard
- Happy Path: Developer opens the dashboard
- Edge Cases:
  - Empty state is visible
- Data Setup: Empty project
- Database Mutations: None
- Expected Visible Outcome: Dashboard loaded
- Playwright: tests/e2e/dashboard.spec.ts::opens dashboard`
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSemanticQuestions("semantics-questions.json", { scenarios: "Open dashboard through FLOW-001: navigate to dashboard -> assert dashboard loaded -> record Playwright evidence" });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/e2e/dashboard.spec.ts", "test('opens dashboard', async ({ page }) => { await page.goto('/dashboard'); });\n");
    await completeFirstTaskGroup(featureId);
    await writeFakePlaywrightBin();
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 3);
    expect(stderr.join("\n")).toContain("expected visible outcome evidence");
  });

  it("blocks UI validation when test:e2e does not invoke Playwright", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: UI\n\n- [ ] Build UI page\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a browser page",
      decisions: "Use Playwright coverage",
      context: "The route shows a dashboard screen",
      experience: `## Experience Flows

### FLOW-001: Open dashboard

- Role: Developer
- Route or Screen: /dashboard
- Happy Path: Developer opens the dashboard
- Edge Cases:
  - Empty state is visible
- Data Setup: Empty project
- Database Mutations: None
- Expected Visible Outcome: Dashboard loaded
- Playwright: tests/e2e/dashboard.spec.ts::opens dashboard`
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSemanticQuestions("semantics-questions.json", { scenarios: "Open dashboard through FLOW-001: navigate to dashboard -> assert dashboard loaded -> record Playwright evidence" });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/e2e/dashboard.spec.ts", `import { expect, test } from '@playwright/test';

test('opens dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Dashboard loaded')).toBeVisible();
  await expect(page.getByText('Empty state is visible')).toBeVisible();
});
`);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "node -e \"console.log('plain node')\"" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 3);
    expect(stderr.join("\n")).toContain("real Playwright command");
  });

  it("blocks UI validation when Playwright command output omits the mapped test title", async () => {
    const featureId = await createApprovedUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/e2e/dashboard.spec.ts", `import { expect, test } from '@playwright/test';

test('opens dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Dashboard loaded')).toBeVisible();
  await expect(page.getByText('Empty state is visible')).toBeVisible();
});
`);
    await completeFirstTaskGroup(featureId);
    await writeFakePlaywrightBin([]);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 3);
    expect(stderr.join("\n")).toContain("FLOW-001::opens dashboard");
  });

  it("passes UI validation when Playwright JSON reporter output includes the mapped passed test title", async () => {
    const featureId = await createApprovedUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/e2e/dashboard.spec.ts", `import { expect, test } from '@playwright/test';

test('opens dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Dashboard loaded')).toBeVisible();
  await expect(page.getByText('Empty state is visible')).toBeVisible();
});
`);
    await completeFirstTaskGroup(featureId);
    await writeFakePlaywrightBin(["opens dashboard"]);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await expect(project.read(".sdd/validation-summaries.jsonl")).resolves.toContain("npm run test:e2e");
  });

  it("rejects title-only Playwright evidence by default", async () => {
    const featureId = await createApprovedUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("tests/e2e/dashboard.spec.ts", `import { expect, test } from '@playwright/test';

test('opens dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Dashboard loaded')).toBeVisible();
  await expect(page.getByText('Empty state is visible')).toBeVisible();
});
`);
    await writeFakePlaywrightTitleOnlyBin(["opens dashboard"]);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 3);
    expect(stderr.join("\n")).toContain("JSON reporter");
  });

  it("allows title-only Playwright evidence only with compatibility mode", async () => {
    const featureId = await createApprovedUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("tests/e2e/dashboard.spec.ts", `import { expect, test } from '@playwright/test';

test('opens dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Dashboard loaded')).toBeVisible();
  await expect(page.getByText('Empty state is visible')).toBeVisible();
});
`);
    await writeFakePlaywrightTitleOnlyBin(["opens dashboard"]);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--compat-playwright"], 0);
  });

  it("blocks data-changing UI validation without a test database copy", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: UI\n\n- [ ] Build UI form\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a browser form that writes to a database",
      decisions: "Use Playwright coverage",
      context: "The route persists records in sqlite",
      experience: `## Experience Flows

### FLOW-001: Submit browser form

- Role: Signed-in customer
- Route or Screen: /feedback
- Happy Path: User submits feedback through the browser form
- Edge Cases:
  - Validation error
- Data Setup: Seed signed-in customer
- Database Mutations: Insert feedback row in the test database
- Expected Visible Outcome: Confirmation appears
- Playwright: tests/e2e/feedback.spec.ts::submits feedback form`
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await project.write("playwright.config.ts", "export default {};\n");
    await expect(project.read(path.join("specs", featureId, "experience.md"))).resolves.toContain("FLOW-001");

    await writeSemanticQuestions("semantics-questions.json", {
      scenarios: "Submit browser form through FLOW-001: open feedback route -> submit feedback -> assert confirmation",
      data: "Insert feedback row in the test database"
    });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/e2e/feedback.spec.ts", `import { expect, test } from '@playwright/test';

test('submits feedback form', async ({ page }) => {
  await page.goto('/feedback');
  const databaseUrl = process.env.DATABASE_URL;
  await expect(page.getByText('Confirmation appears')).toBeVisible();
  await expect(page.getByText('Validation error')).toBeVisible();
  expect(databaseUrl).toBeTruthy();
  // Insert feedback row in the test database
});
`);
    await completeFirstTaskGroup(featureId);
    await project.write("scripts/e2e.js", "const fs = require('fs'); const db = process.env.DATABASE_URL; if (!db) process.exit(1); fs.appendFileSync(db, '\\nmutated'); console.log('e2e ok');\n");
    await writeFakePlaywrightBin();
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "node scripts/e2e.js && playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 3);
    expect(stderr.join("\n")).toContain("--test-database");

    await project.write("app.sqlite", "database");
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 3);
    expect(stderr.join("\n")).toContain("database-mutation-verifier");

    await project.write("scripts/assert-db.js", `const fs = require("fs");
const expected = JSON.parse(fs.readFileSync(process.env.SDD_EXPECTED_MUTATIONS_FILE, "utf8"));
const db = fs.readFileSync(process.env.SDD_TEST_DATABASE, "utf8");
if (!expected.mutations.some((item) => item.includes("Insert feedback row"))) process.exit(2);
if (!db.includes("mutated")) process.exit(3);
console.log("mutation verified");
`);
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await expect(project.read("app.sqlite")).resolves.toBe("database");
    await expect(project.read(path.join(".sdd", "test-db", "app.sqlite.copy"))).resolves.toContain("mutated");
    await expect(project.read(path.join(".sdd", "reviews", featureId, "experience-and-playwright.json"))).resolves.toContain("experience-and-playwright");
  });

  it("fails data-changing UI validation when the original database is mutated", async () => {
    const featureId = await createApprovedUiDataFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("tests/e2e/feedback.spec.ts", `import { expect, test } from '@playwright/test';

test('submits feedback form', async ({ page }) => {
  await page.goto('/feedback');
  await expect(page.getByText('Confirmation appears')).toBeVisible();
  await expect(page.getByText('Validation error')).toBeVisible();
  // Insert feedback row in the test database
});
`);
    await project.write("app.sqlite", "database");
    await project.write("scripts/e2e.js", "const fs = require('fs'); const db = process.env.DATABASE_URL; if (!db) process.exit(1); fs.appendFileSync(db, '\\nmutated-copy'); fs.appendFileSync('app.sqlite', '\\nmutated-original'); console.log('e2e ok');\n");
    await writeFakePlaywrightBin(["submits feedback form"]);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "node scripts/e2e.js && playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 3);
    expect(stderr.join("\n")).toContain("original database changed");
  });

  it("requires isolated database validation for non-UI data mutations", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Data\n\n**Goal:** Build import command\n\n- [ ] Build import command\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a CLI import command that writes customer records to a sqlite database",
      decisions: "Use isolated database validation for mutation proof",
      context: "The command persists imported rows without a browser UI",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSemanticQuestions("semantics-questions.json", {
      scenarios: "Import customers: run CLI import -> persist customer row -> verify imported row",
      data: "Insert imported customer record in the test database"
    });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("scripts/import.js", "const fs = require('fs'); const db = process.env.DATABASE_URL; if (!db) process.exit(1); fs.appendFileSync(db, '\\nimported customer'); console.log('import ok');\n");
    await project.write("scripts/assert-db.js", `const fs = require("fs");
const expected = JSON.parse(fs.readFileSync(process.env.SDD_EXPECTED_MUTATIONS_FILE, "utf8"));
const db = fs.readFileSync(process.env.SDD_TEST_DATABASE, "utf8");
if (!expected.mutations.some((item) => item.includes("Insert imported customer"))) process.exit(2);
if (!db.includes("imported customer")) process.exit(3);
console.log("mutation verified");
`);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node scripts/import.js" } }));
    await project.write("app.sqlite", "database");

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 3);
    expect(stderr.join("\n")).toContain("--test-database");

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 3);
    expect(stderr.join("\n")).toContain("database-mutation-verifier");

    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 0);
    await expect(project.read("app.sqlite")).resolves.toBe("database");

    await project.write("scripts/import.js", "const fs = require('fs'); const db = process.env.DATABASE_URL; if (!db) process.exit(1); fs.appendFileSync(db, '\\ncopy row'); fs.appendFileSync('app.sqlite', '\\noriginal row'); console.log('import ok');\n");
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 3);
    expect(stderr.join("\n")).toContain("original database changed");
  });

  it("validates non-UI data mutations against a real SQLite copy", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Data\n\n**Goal:** Build import command\n\n- [ ] Build import command\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a CLI import command that writes customer records to a sqlite database",
      decisions: "Use isolated database validation for mutation proof",
      context: "The command persists imported rows without a browser UI",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSemanticQuestions("semantics-questions.json", {
      scenarios: "Import customers: run CLI import -> persist customer row -> verify imported row",
      data: "Insert imported customer record in the test database"
    });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await writeSqliteSeed("app.sqlite");
    await project.write("scripts/import-sqlite.cjs", `const fs = require("fs");
const initSqlJs = require(${JSON.stringify(sqlJsPackage)});
(async () => {
  const SQL = await initSqlJs();
  const database = new SQL.Database(fs.readFileSync(process.env.DATABASE_URL));
  database.run("CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)");
  database.run("INSERT INTO customers (name) VALUES (?)", ["real sqlite customer"]);
  fs.writeFileSync(process.env.DATABASE_URL, Buffer.from(database.export()));
  database.close();
  console.log("sqlite import ok");
})();
`);
    await project.write("scripts/assert-sqlite.cjs", `const fs = require("fs");
const initSqlJs = require(${JSON.stringify(sqlJsPackage)});
const expected = JSON.parse(fs.readFileSync(process.env.SDD_EXPECTED_MUTATIONS_FILE, "utf8"));
(async () => {
  if (!expected.mutations.some((item) => item.includes("Insert imported customer"))) process.exit(2);
  const SQL = await initSqlJs();
  const database = new SQL.Database(fs.readFileSync(process.env.SDD_TEST_DATABASE));
  const rows = database.exec("SELECT name FROM customers ORDER BY id");
  const names = rows[0]?.values.map((row) => row[0]) ?? [];
  database.close();
  if (!names.includes("real sqlite customer")) process.exit(3);
  console.log("sqlite mutation verified");
})();
`);
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-sqlite.cjs --expected {expectedMutationsFile}" }));
    await project.write("package.json", JSON.stringify({ scripts: { test: "node scripts/import-sqlite.cjs" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 0);
    await expect(readSqliteCustomers("app.sqlite")).resolves.not.toContain("real sqlite customer");
    await expect(readSqliteCustomers(path.join(".sdd", "test-db", "app.sqlite.copy"))).resolves.toContain("real sqlite customer");
  });

  it("runs configured database mutation verifier against expected mutations", async () => {
    const featureId = await createApprovedUiDataFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("tests/e2e/feedback.spec.ts", `import { expect, test } from '@playwright/test';

test('submits feedback form', async ({ page }) => {
  await page.goto('/feedback');
  await expect(page.getByText('Confirmation appears')).toBeVisible();
  await expect(page.getByText('Validation error')).toBeVisible();
  // Insert feedback row in the test database
});
`);
    await project.write("app.sqlite", "database");
    await project.write("scripts/e2e.js", "const fs = require('fs'); const db = process.env.DATABASE_URL; if (!db) process.exit(1); fs.appendFileSync(db, '\\nfeedback row'); console.log('e2e ok');\n");
    await project.write("scripts/assert-db.js", `const fs = require("fs");
const expected = JSON.parse(fs.readFileSync(process.env.SDD_EXPECTED_MUTATIONS_FILE, "utf8"));
const db = fs.readFileSync(process.env.SDD_TEST_DATABASE, "utf8");
if (!expected.mutations.some((item) => item.includes("Insert feedback row"))) process.exit(2);
if (!db.includes("feedback row")) process.exit(3);
console.log("mutation verified");
`);
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await writeFakePlaywrightBin(["submits feedback form"]);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "node scripts/e2e.js && playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 0);
    await expect(project.read(".sdd/validation-summaries.jsonl")).resolves.toContain("database-mutation-verifier");
    await expect(project.read(".sdd/validation-summaries.jsonl")).resolves.toContain("expected-db-mutations");
  });

  it("fails data-changing UI validation when configured mutation verifier fails", async () => {
    const featureId = await createApprovedUiDataFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("tests/e2e/feedback.spec.ts", `import { expect, test } from '@playwright/test';

test('submits feedback form', async ({ page }) => {
  await page.goto('/feedback');
  await expect(page.getByText('Confirmation appears')).toBeVisible();
  await expect(page.getByText('Validation error')).toBeVisible();
  // Insert feedback row in the test database
});
`);
    await project.write("app.sqlite", "database");
    await project.write("scripts/e2e.js", "const fs = require('fs'); const db = process.env.DATABASE_URL; if (!db) process.exit(1); fs.appendFileSync(db, '\\nwrong row'); console.log('e2e ok');\n");
    await project.write("scripts/assert-db.js", `console.error("expected feedback mutation missing");
process.exit(3);
`);
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await writeFakePlaywrightBin(["submits feedback form"]);
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "node scripts/e2e.js && playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId, "--test-database", "app.sqlite"], 3);
    expect(stderr.join("\n")).toContain("expected database mutations");
    expect(stderr.join("\n")).toContain("expected feedback mutation missing");
  });

  it("runs data-changing UI validation with a command-backed database sandbox", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: UI\n\n- [ ] Build sandboxed UI form\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a browser form that writes to a database",
      decisions: "Use Playwright coverage",
      context: "The route persists records in a configured database sandbox",
      experience: `## Experience Flows

### FLOW-001: Submit browser form

- Role: Signed-in customer
- Route or Screen: /feedback
- Happy Path: User submits feedback through the browser form
- Edge Cases:
  - Validation error
- Data Setup: Seed signed-in customer
- Database Mutations: Insert feedback row in the test database
- Expected Visible Outcome: Confirmation appears
- Playwright: tests/e2e/feedback.spec.ts::submits feedback form`
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await project.write("playwright.config.ts", "export default {};\n");
    await writeSemanticQuestions("semantics-questions.json", {
      scenarios: "Submit browser form through FLOW-001: open feedback route -> submit feedback -> assert confirmation",
      data: "Insert feedback row in the test database"
    });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await project.write("tests/e2e/feedback.spec.ts", `import { expect, test } from '@playwright/test';

test('submits feedback form', async ({ page }) => {
  await page.goto('/feedback');
  const databaseUrl = process.env.SDD_TEST_DATABASE;
  await expect(page.getByText('Confirmation appears')).toBeVisible();
  await expect(page.getByText('Validation error')).toBeVisible();
  expect(databaseUrl).toBeTruthy();
  // Insert feedback row in the test database
});
`);
    await completeFirstTaskGroup(featureId);
    await project.write("scripts/prepare-db.js", "const path = require('path'); const fs = require('fs'); const db = path.join(process.cwd(), 'sandbox.sqlite'); fs.writeFileSync(db, 'sandbox'); console.log(db);\n");
    await project.write("scripts/e2e.js", "const fs = require('fs'); const db = process.env.SDD_TEST_DATABASE; if (!db) process.exit(1); fs.appendFileSync(db, '\\nmutated'); console.log('e2e ok');\n");
    await project.write("scripts/assert-db.js", "const fs = require('fs'); const db = fs.readFileSync(process.env.SDD_TEST_DATABASE, 'utf8'); if (!db.includes('mutated')) process.exit(3); console.log('mutation verified');\n");
    await writeFakePlaywrightBin();
    await project.write(".sdd/database-sandbox.json", JSON.stringify({ prepareCommand: "node scripts/prepare-db.js", databaseUrlEnv: "DATABASE_URL" }));
    await project.write(".sdd/database-mutation-verifier.json", JSON.stringify({ commandTemplate: "node scripts/assert-db.js --expected {expectedMutationsFile}" }));
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "node scripts/e2e.js && playwright test" } }));

    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await expect(project.read("sandbox.sqlite")).resolves.toContain("mutated");
    await expect(project.read(".sdd/validation-summaries.jsonl")).resolves.toContain("databaseSandboxEvidence");
  });

  it("blocks deep review when structured review output is malformed", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeMalformedReviewAgent();

    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("invalid-structured-output");
  });

  it("blocks semantic verification when structured verifier output is malformed", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await writeMalformedSemanticVerifier();

    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("Invalid structured semantic verifier output");
  });

  it("blocks semantic verification for architecture boundary violations", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await project.write("src/domain/bad.ts", "import { UseCase } from '../application/use-case';\nexport const value = UseCase;\n");

    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("Domain code imports");
  });

  it("blocks semantic verification for direct application side effects", async () => {
    const featureId = await createApprovedNonUiFeature();
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeFirstTaskGroup(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await writeReviewAgent();
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await project.write("src/application/bad.ts", "export const databaseUrl = process.env.DATABASE_URL;\n");

    await expectCli(["feature", "semantic-verify", "--project", project.root, "--feature", featureId], 2);
    expect(stderr.join("\n")).toContain("Application code performs direct side effects");
  });

  it("marks only matching feature specs during replan impact", async () => {
    await project.write(".sdd/metadata.json", JSON.stringify({
      version: 1,
      features: {
        "billing-flow": { path: "specs/billing-flow", name: "Billing Flow", status: "approved", createdAt: "2026-05-23T00:00:00.000Z" },
        "search-flow": { path: "specs/search-flow", name: "Search Flow", status: "approved", createdAt: "2026-05-23T00:00:00.000Z" }
      },
      waivers: []
    }));
    await project.write("specs/billing-flow/requirements.md", "# Requirements\n\n## Scope\n\nBilling checkout collects payment details.\n");
    await project.write("specs/billing-flow/plan.md", "# Plan\n\n## 1. Billing\n\n1. [ ] Update billing tests (Requirements: REQ-001; Validation: VAL-001)\n");
    await project.write("specs/billing-flow/validation.md", "# Validation\n\n## Automated\n\n- **VAL-001:** Billing tests. Command: `npm test`.\n");
    await project.write("specs/search-flow/requirements.md", "# Requirements\n\n## Scope\n\nSearch indexes documents.\n");
    await project.write("specs/search-flow/plan.md", "# Plan\n\n## 1. Search\n\n1. [ ] Update search tests (Requirements: REQ-001; Validation: VAL-001)\n");
    await project.write("specs/search-flow/validation.md", "# Validation\n\n## Automated\n\n- **VAL-001:** Search tests. Command: `npm test`.\n");

    await expectCli(["replan", "impact", "--project", project.root, "--name", "Billing provider change", "--notes", "Payment checkout token migration"], 0);

    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    expect(metadata.features["billing-flow"]?.status).toBe("needs_review");
    expect(metadata.features["search-flow"]?.status).toBe("approved");
    await expect(project.read(".sdd/workflow-state.json")).resolves.toContain("impact:feature:billing-flow:tokens");

    await expectCli(["replan", "impact", "--project", project.root, "--name", "Unmatched platform shift", "--notes", "cryptographic ledger replacement"], 0);
    const fallbackMetadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    expect(fallbackMetadata.features["search-flow"]?.status).toBe("needs_review");
    await expect(project.read(".sdd/workflow-state.json")).resolves.toContain("impact:all:no-specific-match");
  });

  it("exports OpenSpec and Spec Kit views through grouped commands", async () => {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Export\n\n- [ ] Export views\n");
    await writeQuestions("questions.json", "feature-spec", {
      scope: "Export specs",
      decisions: "Support OpenSpec and Spec Kit",
      context: "Adapters are secondary views",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(featureCreateArgs("questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;

    await expectCli(["export", "openspec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["export", "speckit", "--project", project.root, "--feature", featureId], 0);

    await expect(project.read(path.join("openspec", "changes", featureId, "proposal.md"))).resolves.toContain("Export specs");
    await expect(project.read(path.join(".specify", "specs", featureId, "spec.md"))).resolves.toContain("Export specs");
  });

  it("lists, shows, and renders canonical prompts", async () => {
    await expectCli(["prompt", "list", "--project", project.root], 0);
    expect(stdout.join("\n")).toContain("feature.create");

    await expectCli(["prompt", "show", "--project", project.root, "--id", "feature.create"], 0);
    expect(stdout.join("\n")).toContain("Create Feature Spec");

    await expectCli(["prompt", "render", "--project", project.root, "--id", "feature.create"], 0);
    await expect(project.read(path.join(".sdd", "prompts", "feature-create.md"))).resolves.toContain("Find the next phase");
  });

  it("configures Codex and runs guided greenfield through feature spec with provider drafts", async () => {
    await writeFakeAgent();
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "codex",
      "--draft-command", "node scripts/fake-agent.js --purpose {purpose} --output {outputFile}",
      "--review-command", "node scripts/fake-agent.js --purpose {purpose} --output {outputFile}"
    ], 0);

    await expectCli([
      "workflow", "greenfield",
      "--project", project.root,
      "--agent", "codex",
      "--through", "feature",
      "--product", "SpecPilot",
      "--audience", "Developers",
      "--problem", "AI agents drift from strict specs",
      "--job", "Automate spec-driven development",
      "--thought", "Mary(engineering)=Needs hard gates",
      "--feature-name", "First UI"
    ], 0);

    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await expect(project.read("specs/mission.md")).resolves.toContain("SpecPilot keeps AI-built software aligned");
    await expect(project.read(path.join("specs", featureId, "experience.md"))).resolves.toContain("FLOW-001");
    await expect(project.read(path.join(".sdd", "implementation-packets", `${featureId}.md`))).resolves.toContain("Implementation Packet");

    await project.write("tests/e2e/first-ui.spec.ts", `import { expect, test } from '@playwright/test';

test('opens first ui', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Primary workflow is visible')).toBeVisible();
  await expect(page.getByText('Empty state is visible')).toBeVisible();
});
`);
    await completeFirstTaskGroup(featureId);
    await writeFakePlaywrightBin();
    await project.write("package.json", JSON.stringify({ scripts: { "test:e2e": "playwright test" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "deep-review", "--project", project.root, "--feature", featureId], 0);
    await expect(project.read(path.join(".sdd", "reviews", featureId, "architecture.json"))).resolves.toContain("architecture-ok");
  });

  it("configures Claude and writes agent provider config", async () => {
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "claude",
      "--draft-command", "node scripts/fake-agent.js --purpose {purpose} --output {outputFile}"
    ], 0);

    await expect(project.read(path.join(".sdd", "agents.json"))).resolves.toContain("\"claude\"");
  });

  it("initializes the orchestrator and pauses on human-owned intent steps", async () => {
    await expectCli([
      "orchestrator", "init",
      "--project", project.root,
      "--agent", "codex",
      "--profile", "human-intent-ai-build"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--target", "roadmap-next"], 0);

    await expect(project.read(path.join(".sdd", "orchestrator.json"))).resolves.toContain("\"agentProvider\": \"codex\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"paused\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("Human-owned step");
  });

  it("configures orchestrator policy and creates an agent-owned semantic contract", async () => {
    await writeFeatureWithoutSemantic();
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeFakeAgent();
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "codex",
      "--draft-command", "node scripts/fake-agent.js --purpose {purpose} --output {outputFile}"
    ], 0);
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "create-semantic-contract",
      "--owner", "agent"
    ], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "implement-feature",
      "--owner", "human",
      "--repair", "none"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--feature", featureId], 0);

    await expect(project.read(path.join(".sdd", "orchestrator.json"))).resolves.toContain("\"create-semantic-contract\"");
    await expect(project.read(path.join("specs", featureId, "semantics.md"))).resolves.toContain("# Semantics:");
    await expect(project.read(path.join(".sdd", "semantic-contracts", `${featureId}.json`))).resolves.toContain("Feature behavior matches");
  });

  it("keeps agent-owned feature spec creation bounded before human semantic approval", async () => {
    await writeFakeAgent();
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "codex",
      "--draft-command", "node scripts/fake-agent.js --purpose {purpose} --output {outputFile}"
    ], 0);
    await expectCli([
      "jtbd", "intake",
      "--project", project.root,
      "--product", "SpecPilot",
      "--audience", "Developers",
      "--problem", "AI agents drift from strict specs",
      "--job", "Automate spec-driven development"
    ], 0);
    await writeQuestions("constitution-questions.json", "constitution", {
      mission: "SpecPilot helps developers keep AI-built software aligned with specifications.",
      targetAudience: "Developers using AI coding agents",
      techStack: "TypeScript, Clean Architecture, Vitest, Playwright, telemetry",
      roadmap: "First UI"
    });
    await expectCli(["constitution", "create", "--project", project.root, "--questions", "constitution-questions.json"], 0);
    await expectCli(["constitution", "validate", "--project", project.root], 0);
    await expectCli(["constitution", "approve", "--project", project.root, "--reviewer", "Architect"], 0);
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "create-feature-spec",
      "--owner", "agent",
      "--waiver-reason", "Fixture project is not a git repository.",
      "--approved-by", "Architect"
    ], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "create-semantic-contract",
      "--owner", "human",
      "--repair", "none"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--target", "roadmap-next"], 0);

    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    expect(metadata.features[featureId]?.status).toBe("draft");
    await expect(project.read(path.join("specs", featureId, "requirements.md"))).resolves.toContain("Build the first browser UI workflow");
    await expect(project.read(path.join("specs", featureId, "semantics.md"))).rejects.toThrow();
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"currentStep\": \"create-semantic-contract\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"paused\"");
  });

  it("requires explicit waiver approver when configuring orchestrator waiver policy", async () => {
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);

    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "semantic-verification",
      "--waiver-reason", "Fixture accepts semantic verifier risk."
    ], 3);

    expect(stderr.join("\n")).toContain("waiverReason requires approvedBy");
  });

  it("blocks unsupported agent-owned workflow steps with an actionable state message", async () => {
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "setup-stakeholder-thoughts",
      "--owner", "agent"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--target", "roadmap-next"], 2);

    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"blocked\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("Configure this step as human-owned or add an adapter");
  });

  it("pauses at default human-owned MVP planning with an actionable next command", async () => {
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    const workflow = createInitialWorkflowState("2026-05-25T00:00:00.000Z");
    await project.write(path.join(".sdd", "workflow-state.json"), JSON.stringify({
      ...workflow,
      steps: Object.fromEntries(Object.entries(workflow.steps).map(([stepId, step]) => [
        stepId,
        {
          ...step,
          status: step.number > 0 && step.number < 18 ? "complete" : step.id === "mvp-spec-branch" ? "ready" : step.status
        }
      ]))
    }, null, 2));

    await expectCli(["orchestrator", "run", "--project", project.root, "--target", "roadmap-next"], 0);

    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"currentStep\": \"mvp-spec-branch\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"paused\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("sdd mvp plan --questions mvp-questions.json");
  });

  it("pauses human-owned feature spec creation with branch prerequisite guidance", async () => {
    await expectCli([
      "jtbd", "intake",
      "--project", project.root,
      "--product", "SpecPilot",
      "--audience", "Developers",
      "--problem", "AI agents drift from strict specs",
      "--job", "Automate spec-driven development"
    ], 0);
    await writeQuestions("constitution-questions.json", "constitution", {
      mission: "SpecPilot helps developers keep AI-built software aligned with specifications.",
      targetAudience: "Developers using AI coding agents",
      techStack: "TypeScript, Clean Architecture, Vitest, Playwright, telemetry",
      roadmap: "Orchestrated feature"
    });
    await expectCli(["constitution", "create", "--project", project.root, "--questions", "constitution-questions.json"], 0);
    await expectCli(["constitution", "validate", "--project", project.root], 0);
    await expectCli(["constitution", "approve", "--project", project.root, "--reviewer", "Architect"], 0);
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--target", "roadmap-next"], 0);

    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"currentStep\": \"create-feature-spec\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("sdd workflow branch --purpose feature --name");
  });

  it("runs agent-owned implementation, repairs validation once, and completes the feature", async () => {
    await writeApprovedNonUiFeature();
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeOrchestratorFakeAgent();
    await writeReviewAgent();
    await writeSemanticVerifier();
    await project.write("scripts/tdd-command.js", `const fs = require("fs");
const phase = fs.existsSync(".sdd/orchestrator-evidence/current-phase") ? fs.readFileSync(".sdd/orchestrator-evidence/current-phase", "utf8").trim() : "";
process.exit(phase === "red" ? 1 : 0);
`);
    await project.write("scripts/test-validation-command.js", `const fs = require("fs");
if (!fs.existsSync(".sdd/validation-repaired")) {
  fs.writeFileSync(".sdd/validation-attempted", "yes");
  process.exit(1);
}
console.log("validation repaired");
`);
    await project.write("tests/feature.test.ts", "group-1-tests-first group-2-implementation group-3-validation VAL-001\n");
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "codex",
      "--draft-command", "node scripts/fake-agent.js --purpose {purpose} --output {outputFile}",
      "--review-command", "node scripts/fake-agent.js --purpose {purpose} --output {outputFile}",
      "--implementation-command", "node scripts/orchestrator-agent.js --phase {phase} --task {taskGroup}"
    ], 0);
    await expectCli([
      "orchestrator", "init",
      "--project", project.root,
      "--agent", "codex",
      "--profile", "human-intent-ai-build",
      "--force"
    ], 0);
    const config = JSON.parse(await project.read(path.join(".sdd", "orchestrator.json"))) as {
      steps: Record<string, { owner?: string; tddCommand?: string; validationCommands?: string[]; autoRecordEmptyReviewDecisions?: boolean }>;
    };
    config.steps["implement-feature"] = {
      ...config.steps["implement-feature"],
      tddCommand: "node scripts/tdd-command.js"
    };
    config.steps["feature-validation"] = {
      ...config.steps["feature-validation"],
      validationCommands: ["node scripts/test-validation-command.js"]
    };
    config.steps["review-subagent-recommendations"] = {
      ...config.steps["review-subagent-recommendations"],
      owner: "harness",
      autoRecordEmptyReviewDecisions: true
    };
    await project.write(path.join(".sdd", "orchestrator.json"), JSON.stringify(config, null, 2));

    await expectCli(["orchestrator", "run", "--project", project.root, "--feature", featureId], 0);

    const finalMetadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    expect(finalMetadata.features[featureId]?.status).toBe("merged");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"succeeded\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("Repair attempt 1 completed");
    await expect(project.read(path.join(".sdd", "tdd-evidence.jsonl"))).resolves.toContain("\"phase\":\"red\"");
    await expect(project.read(path.join(".sdd", "tdd-evidence.jsonl"))).resolves.toContain("\"phase\":\"refactor\"");
    await expect(project.read(path.join(".sdd", "validation-summaries.jsonl"))).resolves.toContain(featureId);
    await expect(project.read(path.join(".sdd", "validation-repaired"))).resolves.toContain("repaired");
    const tddRecords = (await project.read(path.join(".sdd", "tdd-evidence.jsonl")))
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { taskGroup: string; phase: string; evidence: string[] });
    const firstGroupRecords = tddRecords.filter((record) => record.taskGroup === "group-1-tests-first");
    const phaseFiles = firstGroupRecords.flatMap((record) => record.evidence)
      .map((value) => value.split("::")[0]!)
      .filter((value) => /group-1-tests-first-(red|green|refactor)\.md$/.test(value));
    expect(new Set(phaseFiles).size).toBe(3);
    await expect(project.read(path.join(".sdd", "orchestrator-evidence", featureId, "group-1-tests-first-red.md"))).resolves.toContain("Phase: red");
    await expect(project.read(path.join(".sdd", "orchestrator-evidence", featureId, "group-1-tests-first-green.md"))).resolves.toContain("Phase: green");
    await expect(project.read(path.join(".sdd", "orchestrator-evidence", featureId, "group-1-tests-first-refactor.md"))).resolves.toContain("Phase: refactor");
    await expectCli(["orchestrator", "resume", "--project", project.root], 0);
    expect(stdout.at(-1)).toContain(`Feature ${featureId} is complete.`);
  });

  it("fails after max repair attempts and preserves the retry count across resume", async () => {
    await writeApprovedNonUiFeature();
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await project.write("scripts/noop-orchestrator-agent.js", `const fs = require("fs");
const path = require("path");
function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const phase = arg("--phase");
const task = arg("--task") || "unknown";
fs.mkdirSync(path.join(".sdd", "orchestrator-evidence"), { recursive: true });
fs.writeFileSync(path.join(".sdd", "orchestrator-evidence", "current-phase"), phase || "");
fs.mkdirSync("tests", { recursive: true });
fs.writeFileSync(path.join("tests", "feature.test.ts"), "import { expect, test } from 'vitest';\\n" +
  "test('" + task + " VAL-001 " + phase + "', () => { expect(true).toBe(true); });\\n");
`);
    await project.write("scripts/tdd-command.js", `const fs = require("fs");
const phase = fs.existsSync(".sdd/orchestrator-evidence/current-phase") ? fs.readFileSync(".sdd/orchestrator-evidence/current-phase", "utf8").trim() : "";
process.exit(phase === "red" ? 1 : 0);
`);
    await project.write("scripts/always-fail-validation.js", "process.exit(1);\n");
    await project.write("tests/feature.test.ts", "group-1-tests-first group-2-implementation group-3-validation VAL-001\n");
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "codex",
      "--implementation-command", "node scripts/noop-orchestrator-agent.js --phase {phase} --task {taskGroup}"
    ], 0);
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "implement-feature",
      "--tdd-command", "node scripts/tdd-command.js",
      "--repair", "none"
    ], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "feature-validation",
      "--validation-command", "node scripts/always-fail-validation.js",
      "--repair", "agent",
      "--max-repair-attempts", "1"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--feature", featureId], 2);
    await expectCli(["orchestrator", "resume", "--project", project.root], 2);

    const state = JSON.parse(await project.read(path.join(".sdd", "orchestrator-state.json"))) as {
      status: string;
      repairAttempts: Record<string, number>;
      lastGateFailure?: { stepId: string };
    };
    expect(state.status).toBe("failed");
    expect(state.repairAttempts["feature-validation"]).toBe(1);
    expect(state.lastGateFailure?.stepId).toBe("feature-validation");
  });

  it("blocks orchestrated implementation when the agent only writes synthetic TDD evidence", async () => {
    await writeApprovedNonUiFeature();
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSyntheticOnlyOrchestratorAgent();
    await project.write("scripts/tdd-command.js", `const fs = require("fs");
const phase = fs.existsSync(".sdd/orchestrator-evidence/current-phase") ? fs.readFileSync(".sdd/orchestrator-evidence/current-phase", "utf8").trim() : "";
process.exit(phase === "red" ? 1 : 0);
`);
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "codex",
      "--implementation-command", "node scripts/orchestrator-agent.js --phase {phase} --task {taskGroup}"
    ], 0);
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "implement-feature",
      "--tdd-command", "node scripts/tdd-command.js",
      "--repair", "none"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--feature", featureId], 2);

    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"blocked\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("real test source file");
  });

  it("blocks orchestrated implementation when the agent edits approved specs", async () => {
    await writeApprovedNonUiFeature();
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSpecEditingOrchestratorAgent();
    await project.write("scripts/tdd-command.js", `const fs = require("fs");
const phase = fs.existsSync(".sdd/orchestrator-evidence/current-phase") ? fs.readFileSync(".sdd/orchestrator-evidence/current-phase", "utf8").trim() : "";
process.exit(phase === "red" ? 1 : 0);
`);
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "codex",
      "--implementation-command", "node scripts/orchestrator-agent.js --phase {phase} --task {taskGroup} --feature {featureId}"
    ], 0);
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "implement-feature",
      "--tdd-command", "node scripts/tdd-command.js",
      "--repair", "none"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--feature", featureId], 2);

    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"blocked\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("changed approved spec files");
  });

  it("blocks agent-owned semantic drafting when the provider returns invalid schema output", async () => {
    await writeFeatureWithoutSemantic();
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeInvalidDraftAgent();
    await expectCli([
      "agent", "configure",
      "--project", project.root,
      "--provider", "codex",
      "--draft-command", "node scripts/invalid-draft-agent.js --output {outputFile}"
    ], 0);
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--feature", featureId], 2);

    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("failed schema validation");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("semantic.extra");
  });

  it("does not auto-complete human review decisions without explicit policy", async () => {
    await writeApprovedNonUiFeature();
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeAllTaskGroups(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await expectCli([
      "workflow", "checkpoint",
      "--project", project.root,
      "--step", "implement-feature",
      "--kind", "supervisor-note",
      "--feature", featureId,
      "--notes", "Fixture implementation already completed all task-group evidence."
    ], 0);
    await writeWarningReviewAgent();
    await writeSemanticVerifier();
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "review-subagent-recommendations",
      "--owner", "harness"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--feature", featureId], 2);

    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"blocked\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"currentStep\": \"review-subagent-recommendations\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("human-owned by default");
    await expect(project.read(path.join(".sdd", "review-decisions.jsonl"))).rejects.toThrow();
  });

  it("applies configured orchestrator waiver policy to semantic verification", async () => {
    await writeApprovedNonUiFeature();
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await expectCli(["feature", "plan-tdd", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "implement", "--project", project.root, "--feature", featureId], 0);
    await completeAllTaskGroups(featureId);
    await project.write("package.json", JSON.stringify({ scripts: { test: "node -e \"console.log('test ok')\"" } }));
    await expectCli(["feature", "run-validation", "--project", project.root, "--feature", featureId], 0);
    await expectCli([
      "workflow", "checkpoint",
      "--project", project.root,
      "--step", "implement-feature",
      "--kind", "supervisor-note",
      "--feature", featureId,
      "--notes", "Fixture implementation already completed all task-group evidence."
    ], 0);
    await writeReviewAgent();
    await writeSemanticVerifier(true);
    await expectCli(["orchestrator", "init", "--project", project.root, "--agent", "codex"], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "semantic-verification",
      "--owner", "harness",
      "--waiver-reason", "Fixture intentionally uses a blocking verifier.",
      "--approved-by", "Architect"
    ], 0);
    await expectCli([
      "orchestrator", "configure",
      "--project", project.root,
      "--step", "review-subagent-recommendations",
      "--owner", "human"
    ], 0);

    await expectCli(["orchestrator", "run", "--project", project.root, "--feature", featureId], 0);

    await expect(project.read(path.join(".sdd", "semantic-verifications.jsonl"))).resolves.toContain("\"status\":\"waived\"");
    await expect(project.read(path.join(".sdd", "waivers.jsonl"))).resolves.toContain("Fixture intentionally uses a blocking verifier.");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"currentStep\": \"review-subagent-recommendations\"");
    await expect(project.read(path.join(".sdd", "orchestrator-state.json"))).resolves.toContain("\"status\": \"paused\"");
  });

  async function writeReviewAgent(): Promise<void> {
    await project.write(".sdd/review-agents.json", JSON.stringify({
      commandTemplate: "node scripts/review-agent.js --lens {lens} --prompt {promptFile}",
      timeoutMs: 600000,
      requiredLenses: ["architecture", "spec-alignment", "test-and-qa"]
    }));
    await project.write("scripts/review-agent.js", `const lens = process.argv[process.argv.indexOf("--lens") + 1];
console.log(JSON.stringify({ findings: [{ id: lens + "-ok", severity: "info", summary: "No blocking issues", recommendation: "Proceed" }] }));
`);
  }

  async function writeBlockingReviewAgent(): Promise<void> {
    await project.write(".sdd/review-agents.json", JSON.stringify({
      commandTemplate: "node scripts/review-agent.js --lens {lens} --prompt {promptFile}",
      timeoutMs: 600000,
      requiredLenses: ["architecture"]
    }));
    await project.write("scripts/review-agent.js", `const lens = process.argv[process.argv.indexOf("--lens") + 1];
console.log(JSON.stringify({ findings: [{ id: lens + "-block", severity: "blocking", summary: "Architecture issue needs evidence", recommendation: "Attach follow-up evidence", evidenceRefs: ["specs/roadmap.md"] }] }));
`);
  }

  async function writeWarningReviewAgent(): Promise<void> {
    await project.write(".sdd/review-agents.json", JSON.stringify({
      commandTemplate: "node scripts/review-agent.js --lens {lens} --prompt {promptFile}",
      timeoutMs: 600000,
      requiredLenses: ["architecture"]
    }));
    await project.write("scripts/review-agent.js", `const lens = process.argv[process.argv.indexOf("--lens") + 1];
console.log(JSON.stringify({ findings: [{ id: lens + "-warn", severity: "warning", summary: "Review recommendation requires disposition", recommendation: "Record an explicit decision", evidenceRefs: ["specs/roadmap.md"] }] }));
`);
  }

  async function writeMalformedReviewAgent(): Promise<void> {
    await project.write(".sdd/review-agents.json", JSON.stringify({
      commandTemplate: "node scripts/review-agent.js --lens {lens} --prompt {promptFile}",
      timeoutMs: 600000,
      requiredLenses: ["architecture"]
    }));
    await project.write("scripts/review-agent.js", `console.log(JSON.stringify({ findings: [{ id: "bad", severity: "critical", summary: "Bad", recommendation: "Fix" }] }));
`);
  }

  async function completeFirstTaskGroup(featureId: string): Promise<void> {
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('group-1-tests-first VAL-001', () => { expect(true).toBe(true); });\n");
    await expectCli([
      "feature", "complete-task-group",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", "group-1-tests-first",
      "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::group-1-tests-first`,
      "--test-evidence", "tests/feature.test.ts::group-1-tests-first::VAL-001",
      "--compat-tdd",
      "--waiver-reason", "Fixture uses pre-existing test evidence instead of command-backed TDD.",
      "--approved-by", "Architect"
    ], 0);
  }

  async function recordTddPhase(featureId: string, taskGroup: string, phase: "red" | "green" | "refactor", evidence: string, command: string): Promise<void> {
    await expectCli([
      "feature", "record-tdd",
      "--project", project.root,
      "--feature", featureId,
      "--task-group", taskGroup,
      "--phase", phase,
      "--evidence", evidence,
      "--command", command
    ], 0);
  }

  async function completeAllTaskGroups(featureId: string): Promise<void> {
    await project.write("tests/feature.test.ts", "import { expect, test } from 'vitest';\ntest('all task evidence group-1-tests-first group-2-implementation group-3-validation VAL-001', () => { expect(true).toBe(true); });\n");
    for (const taskGroup of ["group-1-tests-first", "group-2-implementation", "group-3-validation"]) {
      await expectCli([
        "feature", "complete-task-group",
        "--project", project.root,
        "--feature", featureId,
        "--task-group", taskGroup,
        "--implementation-evidence", `.sdd/implementation-packets/${featureId}.md::${taskGroup}`,
        "--test-evidence", `tests/feature.test.ts::${taskGroup}::VAL-001`,
        "--compat-tdd",
        "--waiver-reason", "Fixture uses pre-existing test evidence instead of command-backed TDD.",
        "--approved-by", "Architect"
      ], 0);
    }
  }

  async function writeSqliteSeed(relativePath: string): Promise<void> {
    await project.write("scripts/create-sqlite.cjs", `const fs = require("fs");
const path = require("path");
const initSqlJs = require(${JSON.stringify(sqlJsPackage)});
(async () => {
  const SQL = await initSqlJs();
  const database = new SQL.Database();
  database.run("CREATE TABLE customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)");
  database.run("INSERT INTO customers (name) VALUES (?)", ["seed"]);
  const output = path.resolve(process.argv[2]);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, Buffer.from(database.export()));
  database.close();
})();
`);
    await execFileAsync(process.execPath, [path.join(project.root, "scripts", "create-sqlite.cjs"), path.join(project.root, relativePath)], { cwd: project.root });
  }

  async function readSqliteCustomers(relativePath: string): Promise<readonly string[]> {
    await project.write("scripts/read-sqlite.cjs", `const fs = require("fs");
const initSqlJs = require(${JSON.stringify(sqlJsPackage)});
(async () => {
  const SQL = await initSqlJs();
  const database = new SQL.Database(fs.readFileSync(process.argv[2]));
  const rows = database.exec("SELECT name FROM customers ORDER BY id");
  const names = rows[0]?.values.map((row) => String(row[0])) ?? [];
  database.close();
  console.log(JSON.stringify(names));
})();
`);
    const result = await execFileAsync(process.execPath, [path.join(project.root, "scripts", "read-sqlite.cjs"), path.join(project.root, relativePath)], { cwd: project.root });
    return JSON.parse(result.stdout) as readonly string[];
  }

  async function writeFakePlaywrightBin(titles: readonly string[] = ["opens dashboard", "submits feedback form", "opens first ui"]): Promise<void> {
    const binaryPath = path.join("node_modules", ".bin", "playwright");
    await project.write(binaryPath, `#!/usr/bin/env node
console.log(JSON.stringify({
  suites: [{
    specs: ${JSON.stringify(titles.map((title) => ({ title, tests: [{ status: "passed" }] })))}
  }]
}));
`);
    await chmod(path.join(project.root, binaryPath), 0o755);
  }

  async function writeFakePlaywrightTitleOnlyBin(titles: readonly string[] = ["opens dashboard", "submits feedback form", "opens first ui"]): Promise<void> {
    const binaryPath = path.join("node_modules", ".bin", "playwright");
    await project.write(binaryPath, `#!/usr/bin/env node
console.log('playwright test ok');
${titles.map((title) => `console.log(${JSON.stringify(title)});`).join("\n")}
`);
    await chmod(path.join(project.root, binaryPath), 0o755);
  }

  async function createApprovedUiFeature(): Promise<string> {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: UI\n\n- [ ] Build UI page\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a browser page",
      decisions: "Use Playwright coverage",
      context: "The route shows a dashboard screen",
      experience: `## Experience Flows

### FLOW-001: Open dashboard

- Role: Developer
- Route or Screen: /dashboard
- Happy Path: Developer opens the dashboard
- Edge Cases:
  - Empty state is visible
- Data Setup: Empty project
- Database Mutations: None
- Expected Visible Outcome: Dashboard loaded
- Playwright: tests/e2e/dashboard.spec.ts::opens dashboard`
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSemanticQuestions("semantics-questions.json", { scenarios: "Open dashboard through FLOW-001: navigate to dashboard -> assert dashboard loaded -> record Playwright evidence" });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    return featureId;
  }

  async function createApprovedUiDataFeature(): Promise<string> {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: UI\n\n**Goal:** Build UI form\n\n- [ ] Build UI form\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Build a browser form that writes to a database",
      decisions: "Use Playwright coverage",
      context: "The route persists records in sqlite",
      experience: `## Experience Flows

### FLOW-001: Submit browser form

- Role: Signed-in customer
- Route or Screen: /feedback
- Happy Path: User submits feedback through the browser form
- Edge Cases:
  - Validation error
- Data Setup: Seed signed-in customer
- Database Mutations: Insert feedback row in the test database
- Expected Visible Outcome: Confirmation appears
- Playwright: tests/e2e/feedback.spec.ts::submits feedback form`
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await project.write("playwright.config.ts", "export default {};\n");
    await writeSemanticQuestions("semantics-questions.json", {
      scenarios: "Submit browser form through FLOW-001: open feedback route -> submit feedback -> assert confirmation",
      data: "Insert feedback row in the test database"
    });
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    return featureId;
  }

  async function createApprovedNonUiFeature(): Promise<string> {
    await project.write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Feature Specs\n\n- [ ] Create feature specs from roadmap\n");
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Create feature specs from roadmap",
      decisions: "Use markdown docs and .sdd metadata",
      context: "Hard gates prevent implementation before approval",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    await writeSemanticQuestions("semantics-questions.json");
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantics-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
    return featureId;
  }

  async function writeSemanticVerifier(blocking = false): Promise<void> {
    await project.write(".sdd/semantic-verifiers.json", JSON.stringify({
      commandTemplate: "node scripts/semantic-verifier.js --dimension {dimension} --prompt {promptFile}",
      timeoutMs: 600000
    }));
    await project.write("scripts/semantic-verifier.js", `const dimension = process.argv[process.argv.indexOf("--dimension") + 1];
console.log(JSON.stringify({ findings: [${blocking ? `{ id: dimension + "-block", claimId: "SCN-001", severity: "blocking", summary: "Scenario evidence is insufficient", evidenceRefs: ["specs/feature/semantics.md"], requiredFix: "Add evidence" }` : `{ id: dimension + "-ok", claimId: dimension, severity: "info", summary: "No semantic issues", evidenceRefs: ["semantic-contract.json"], requiredFix: "Proceed" }`}] }));
`);
  }

  async function writeMalformedSemanticVerifier(): Promise<void> {
    await project.write(".sdd/semantic-verifiers.json", JSON.stringify({
      commandTemplate: "node scripts/semantic-verifier.js --dimension {dimension} --prompt {promptFile}",
      timeoutMs: 600000
    }));
    await project.write("scripts/semantic-verifier.js", `console.log(JSON.stringify({ findings: [{ id: "bad", severity: "blocking", summary: "Bad", evidenceRefs: "spec.md", requiredFix: "Fix" }] }));
`);
  }

  async function writeSemanticQuestions(pathName: string, answers: Record<string, string> = {}): Promise<void> {
    await writeQuestions(pathName, "semantic-contract", {
      actors: "Developer",
      outcomes: "Feature behavior matches the approved SDD spec",
      entities: "FeatureSpec",
      commands: "Create and verify feature",
      states: "draft -> approved",
      invariants: "Approved features cannot be implemented without validation evidence",
      scenarios: "Complete primary semantic workflow: inspect approved spec -> run validation -> record evidence",
      oracles: "Validation evidence proves the scenario",
      data: "not applicable",
      telemetry: "not applicable",
      architecture: "Domain and application logic remain decoupled from adapters",
      ...answers
    });
  }

  async function writeFakeAgent(): Promise<void> {
    await project.write("scripts/fake-agent.js", `const fs = require("fs");
const path = require("path");
function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const purpose = arg("--purpose");
const output = arg("--output");
const payloads = {
  constitution: {
    thinking: "Stakeholder notes say the product needs hard gates; constitution answers distill those notes without re-asking them.",
    questions: [],
    risks: [],
    answers: {
      mission: "SpecPilot keeps AI-built software aligned with strict specifications. Success means every feature has evidence.",
      targetAudience: "Developers using AI coding agents",
      techStack: "TypeScript, Clean Architecture, Vitest, Playwright, full telemetry",
      roadmap: "First UI"
    }
  },
  feature: {
    thinking: "The first roadmap feature is UI-facing, so the experience answer includes traceable Playwright coverage.",
    questions: [],
    risks: [],
    answers: {
      scope: "Build the first browser UI workflow",
      decisions: "Use Markdown specs, .sdd metadata, and Playwright coverage",
      context: "Feature must be approved before implementation",
      experience: "## Experience Flows\\n\\n### FLOW-001: Open first UI\\n\\n- Role: Developer\\n- Route or Screen: /\\n- Happy Path: Developer opens the app and sees the primary workflow\\n- Edge Cases:\\n  - Empty state is visible\\n- Data Setup: Seed empty project\\n- Database Mutations: None\\n- Expected Visible Outcome: Primary workflow is visible\\n- Playwright: tests/e2e/first-ui.spec.ts::opens first ui"
    }
  },
  semantic: {
    thinking: "Semantic contract answers map the non-UI feature to validation and telemetry evidence.",
    questions: [],
    risks: [],
    answers: {
      actors: "Developer",
      outcomes: "Feature behavior matches the approved SDD spec",
      entities: "FeatureSpec",
      commands: "Create and verify feature",
      states: "draft -> approved",
      invariants: "Approved features cannot be implemented without validation evidence",
      scenarios: "Complete primary semantic workflow: inspect approved spec -> run validation -> record evidence",
      oracles: "Validation evidence proves the scenario",
      data: "not applicable",
      telemetry: "not applicable",
      architecture: "Domain and application logic remain decoupled from adapters"
    }
  },
  mvp: {
    thinking: "MVP combines remaining roadmap work.",
    questions: [],
    risks: [],
    answers: {
      scope: "Complete MVP",
      decisions: "Keep hard gates",
      context: "Existing specs are approved",
      experience: "No UI-facing experience; no experience.md required."
    }
  },
  review: {
    findings: [{ id: "architecture-ok", severity: "info", summary: "No blocking architecture issues", recommendation: "Proceed" }]
  }
};
const payload = payloads[purpose] || payloads.feature;
if (output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(payload));
} else {
  console.log(JSON.stringify(payload));
}
`);
  }

  async function writeApprovedNonUiFeature(): Promise<void> {
    const featureId = await writeFeatureWithoutSemantic();
    await writeSemanticQuestions("semantic-questions.json");
    await expectCli(["feature", "semantics", "--project", project.root, "--feature", featureId, "--questions", "semantic-questions.json"], 0);
    await expectCli(["feature", "validate-spec", "--project", project.root, "--feature", featureId], 0);
    await expectCli(["feature", "approve", "--project", project.root, "--feature", featureId, "--reviewer", "Architect"], 0);
  }

  async function writeFeatureWithoutSemantic(): Promise<string> {
    await expectCli([
      "jtbd", "intake",
      "--project", project.root,
      "--product", "SpecPilot",
      "--audience", "Developers",
      "--problem", "AI agents drift from strict specs",
      "--job", "Automate spec-driven development"
    ], 0);
    await writeQuestions("constitution-questions.json", "constitution", {
      mission: "SpecPilot helps developers keep AI-built software aligned with specifications.",
      targetAudience: "Developers using AI coding agents",
      techStack: "TypeScript, Clean Architecture, Vitest, Playwright, telemetry",
      roadmap: "Orchestrated feature"
    });
    await expectCli(["constitution", "create", "--project", project.root, "--questions", "constitution-questions.json"], 0);
    await expectCli(["constitution", "validate", "--project", project.root], 0);
    await expectCli(["constitution", "approve", "--project", project.root, "--reviewer", "Architect"], 0);
    await writeQuestions("feature-questions.json", "feature-spec", {
      scope: "Implement an orchestrated non-UI workflow",
      decisions: "Use agent-owned implementation with harness-owned validation",
      context: "The orchestrator, not the agent, owns retry and completion decisions",
      experience: "No UI-facing experience; no experience.md required."
    });
    await expectCli(featureCreateArgs("feature-questions.json"), 0);
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    const featureId = Object.keys(metadata.features)[0]!;
    return featureId;
  }

  async function writeOrchestratorFakeAgent(): Promise<void> {
    await writeFakeAgent();
    await project.write("scripts/orchestrator-agent.js", `const fs = require("fs");
const path = require("path");
function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const phase = arg("--phase");
const task = arg("--task") || "unknown";
fs.mkdirSync(".sdd", { recursive: true });
if (phase === "repair") {
  fs.writeFileSync(".sdd/validation-repaired", "repaired");
} else {
  fs.mkdirSync(path.join(".sdd", "orchestrator-evidence"), { recursive: true });
  fs.writeFileSync(path.join(".sdd", "orchestrator-evidence", "current-phase"), phase || "");
  fs.mkdirSync("src", { recursive: true });
  fs.mkdirSync("tests", { recursive: true });
  fs.writeFileSync(path.join("src", "orchestrated-feature.ts"), "export const " + task.replace(/[^a-zA-Z0-9]/g, "_") + " = " + JSON.stringify(phase || "unknown") + ";\\n");
  fs.writeFileSync(path.join("tests", "feature.test.ts"), "import { expect, test } from 'vitest';\\n" +
    "test('" + task + " VAL-001 " + phase + "', () => { expect(true).toBe(true); });\\n");
}
console.log(JSON.stringify({ phase, task }));
`);
  }

  async function writeSyntheticOnlyOrchestratorAgent(): Promise<void> {
    await writeFakeAgent();
    await project.write("scripts/orchestrator-agent.js", `const fs = require("fs");
const path = require("path");
function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const phase = arg("--phase");
const task = arg("--task") || "unknown";
fs.mkdirSync(path.join(".sdd", "orchestrator-evidence"), { recursive: true });
fs.writeFileSync(path.join(".sdd", "orchestrator-evidence", "current-phase"), phase || "");
fs.writeFileSync(path.join(".sdd", "orchestrator-evidence", task + "-" + phase + "-synthetic.md"), "Synthetic-only " + phase + " evidence for " + task);
console.log(JSON.stringify({ phase, task }));
`);
  }

  async function writeSpecEditingOrchestratorAgent(): Promise<void> {
    await writeFakeAgent();
    await project.write("scripts/orchestrator-agent.js", `const fs = require("fs");
const path = require("path");
function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const phase = arg("--phase");
const task = arg("--task") || "unknown";
const feature = arg("--feature");
fs.mkdirSync(path.join(".sdd", "orchestrator-evidence"), { recursive: true });
fs.writeFileSync(path.join(".sdd", "orchestrator-evidence", "current-phase"), phase || "");
fs.mkdirSync("tests", { recursive: true });
fs.writeFileSync(path.join("tests", "feature.test.ts"), "import { expect, test } from 'vitest';\\n" +
  "test('" + task + " VAL-001 " + phase + "', () => { expect(true).toBe(true); });\\n");
if (feature) {
  fs.appendFileSync(path.join("specs", feature, "requirements.md"), "\\n\\nAgent edited approved requirements during " + phase + ".\\n");
}
console.log(JSON.stringify({ phase, task, feature }));
`);
  }

  async function writeInvalidDraftAgent(): Promise<void> {
    await project.write("scripts/invalid-draft-agent.js", `const fs = require("fs");
const path = require("path");
function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const output = arg("--output");
const payload = {
  thinking: "This draft has invalid schema shape.",
  extra: "not allowed",
  questions: ["ok"],
  risks: [123],
  answers: {
    actors: "Developer",
    outcomes: 42,
    entities: "FeatureSpec",
    commands: "Create and verify feature",
    states: "draft -> approved",
    invariants: "Approved features require validation",
    scenarios: "Complete workflow",
    oracles: "Validation evidence",
    data: "not applicable",
    telemetry: "not applicable",
    architecture: "Clean Architecture"
  }
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(payload));
`);
  }

  async function writeQuestions(pathName: string, workflow: string, answers: Record<string, string>): Promise<void> {
    const promptId = promptIdForWorkflow(workflow);
    await project.write(pathName, JSON.stringify({
      id: `${workflow}-questions`,
      workflow,
      promptId,
      promptHash: hashPromptTemplate(promptId),
      source: "test",
      createdAt: "2026-05-23T00:00:00.000Z",
      answers
    }));
  }

  async function initGit(): Promise<void> {
    await execFileAsync("git", ["init"], { cwd: project.root });
  }

  async function expectCli(args: readonly string[], expectedExitCode: number): Promise<void> {
    const exitCode = await runCli(args, {
      cwd: process.cwd(),
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message)
    });
    expect(exitCode, `stdout:\n${stdout.join("\n")}\n\nstderr:\n${stderr.join("\n")}`).toBe(expectedExitCode);
  }
});

function promptIdForWorkflow(workflow: string): PromptId {
  if (workflow === "constitution") return "constitution.create";
  if (workflow === "semantic-contract") return "feature.semantics";
  if (workflow === "mvp") return "mvp.plan";
  return "feature.create";
}

function hashPromptTemplate(promptId: PromptId): string {
  const template = PROMPT_TEMPLATES.find((prompt) => prompt.id === promptId);
  return createHash("sha256").update(JSON.stringify(template ?? promptId)).digest("hex");
}
