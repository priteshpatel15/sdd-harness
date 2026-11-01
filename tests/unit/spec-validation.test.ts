import { describe, expect, it } from "vitest";
import { detectDataMutationWork, experienceHasDatabaseMutations, parsePlanTaskGroups, requireInterviewAnswers, resolvePlanTaskGroup, validateConstitutionMarkdown, validateExperienceAnswer, validateFeatureMarkdown, validationCommandResolvesToPlaywright } from "../../src/domain/spec-validation";

describe("spec validation policy", () => {
  it("blocks constitution writes without grouped interview answers", () => {
    const gates = requireInterviewAnswers({ mission: "Build useful software" }, ["mission", "targetAudience", "techStack", "roadmap"], "constitution");

    expect(gates.filter((gate) => !gate.passed).map((gate) => gate.id)).toEqual([
      "constitution.interview.targetAudience",
      "constitution.interview.techStack",
      "constitution.interview.roadmap"
    ]);
  });

  it("accepts constitution docs with audience, testing, and roadmap checklists", () => {
    const gates = validateConstitutionMarkdown({
      mission: "# Mission\n\nHelp developers.\n\n## Target Audience\n\nDevelopers\n\n## What Success Looks Like\n\nSuccess is clear.",
      techStack: "# Tech Stack\n\nTypeScript\n\n## Testing\n\nUse TDD and Playwright QA.",
      roadmap: "# Roadmap\n\n## Phase 1: Start\n\n**Goal:** Build it\n\n- [ ] Build it"
    });

    expect(gates.every((gate) => gate.passed)).toBe(true);
  });

  it("requires feature spec validation, manual acceptance, and done criteria", () => {
    const gates = validateFeatureMarkdown({
      requirements: "# Requirements\n\n## Scope\n\nA\n\n## Decisions\n\nB\n\n## Context\n\nC\n\n## Requirements\n\n- **REQ-001:** Do it",
      plan: "# Plan\n\n## 1. Tests\n\n1. [ ] Add test (Requirements: REQ-001; Validation: VAL-001)",
      validation: "# Validation\n\n## Automated\n\n- **VAL-001:** Unit tests pass. Command: `npm test`.\n\n## Manual\n\nWalkthrough\n\n## Definition Of Done\n\nDone"
    });

    expect(gates.every((gate) => gate.passed)).toBe(true);
  });

  it("accepts explicit no-UI experience answers for non-UI features", () => {
    const gates = validateExperienceAnswer({
      scope: "Add a CLI export command",
      decisions: "Use markdown files",
      context: "No browser behavior is touched",
      experience: "No UI-facing experience; no experience.md required."
    });

    expect(gates.every((gate) => gate.passed)).toBe(true);
  });

  it("blocks UI experience answers without structured flows and Playwright mapping", () => {
    const gates = validateExperienceAnswer({
      scope: "Build a browser form",
      decisions: "Use Playwright",
      context: "The screen submits data",
      experience: "The user fills out the form."
    });

    expect(gates.filter((gate) => !gate.passed).map((gate) => gate.id)).toContain("feature.experience.flows");
  });

  it("blocks UI feature validation when experience.md has TODOs or unmapped flows", () => {
    const gates = validateFeatureMarkdown({
      requirements: "# Requirements\n\n## Scope\n\nBuild a browser form\n\n## Decisions\n\nUse Playwright\n\n## Context\n\nUI screen\n\n## Requirements\n\n- **REQ-001:** Submit form",
      plan: "# Plan\n\n## 1. Tests\n\n1. [ ] Add test (Requirements: REQ-001; Validation: VAL-001)",
      validation: "# Validation\n\n## Automated\n\n- **VAL-001:** E2E tests pass. Command: `npm run test:e2e`.\n\n## Manual\n\nWalkthrough\n\n## Definition Of Done\n\nDone",
      experience: `# Experience: Form

## Experience Flows

### FLOW-001: Submit form

- Role: User
- Route or Screen: TODO
- Happy Path: User submits form
- Edge Cases:
  - Validation error
- Data Setup: Seed user
- Database Mutations: Insert row
- Expected Visible Outcome: Confirmation appears
- Playwright: TODO
`
    });

    expect(gates.filter((gate) => !gate.passed).map((gate) => gate.id)).toEqual([
      "feature.experience.no-todo",
      "feature.experience.required-fields"
    ]);
  });

  it("requires every UI experience flow to declare database mutations", () => {
    const gates = validateExperienceAnswer({
      scope: "Build a browser UI workflow",
      decisions: "Use Playwright",
      context: "The page is read-only",
      experience: `## Experience Flows

### FLOW-001: Open page

- Role: User
- Route or Screen: /
- Happy Path: User opens the page
- Edge Cases:
  - Empty state
- Data Setup: None
- Expected Visible Outcome: Page is visible
- Playwright: tests/e2e/page.spec.ts::opens page`
    });

    expect(gates.find((gate) => gate.id === "feature.experience.required-fields")).toMatchObject({
      passed: false,
      message: expect.stringContaining("FLOW-001.Database Mutations")
    });
  });

  it("does not treat a UI flow with no database mutations as a no-UI feature", () => {
    const gates = validateExperienceAnswer({
      scope: "Build a browser UI workflow",
      decisions: "Use Playwright",
      context: "No persistence is needed",
      experience: `## Experience Flows

### FLOW-001: Open page

- Role: User
- Route or Screen: /
- Happy Path: User opens the page
- Edge Cases:
  - Empty state
- Data Setup: None
- Database Mutations: None
- Expected Visible Outcome: Page is visible
- Playwright: tests/e2e/page.spec.ts::opens page`
    });

    expect(gates.every((gate) => gate.passed)).toBe(true);
  });

  it("detects data-changing UI flows from database mutation fields", () => {
    expect(experienceHasDatabaseMutations(`### FLOW-001

- Database Mutations: None
`)).toBe(false);
    expect(experienceHasDatabaseMutations(`### FLOW-001

- Database Mutations: Insert feedback row
`)).toBe(true);
  });

  it("detects non-UI data mutation work from requirements and validation text", () => {
    expect(detectDataMutationWork("Build a CLI job that writes imported rows to the sqlite database.")).toBe(true);
    expect(detectDataMutationWork("Read reports from the database without mutation.")).toBe(false);
  });

  it("resolves Playwright validation commands from direct commands and npm scripts", () => {
    expect(validationCommandResolvesToPlaywright("npx playwright test", {})).toBe(true);
    expect(validationCommandResolvesToPlaywright("npm run test:e2e", { "test:e2e": "playwright test" })).toBe(true);
    expect(validationCommandResolvesToPlaywright("npm run test:e2e", { "test:e2e": "node scripts/e2e.js && playwright test" })).toBe(true);
    expect(validationCommandResolvesToPlaywright("node playwright test", {})).toBe(false);
    expect(validationCommandResolvesToPlaywright("npm run test:e2e", { "test:e2e": "node scripts/e2e.js" })).toBe(false);
  });

  it("parses plan task group ids and resolves ids or titles", () => {
    const plan = `# Plan

## 1. Tests First

Group ID: \`group-1-tests-first\`

1. [ ] Add tests (Requirements: REQ-001; Validation: VAL-001)

## 2. Implementation

1. [ ] Build it (Requirements: REQ-002; Validation: VAL-002)
`;

    expect(parsePlanTaskGroups(plan).map((group) => group.id)).toEqual(["group-1-tests-first", "group-2-implementation"]);
    expect(resolvePlanTaskGroup(plan, "Tests First")?.id).toBe("group-1-tests-first");
    expect(resolvePlanTaskGroup(plan, "group-2-implementation")?.title).toBe("Implementation");
  });
});
