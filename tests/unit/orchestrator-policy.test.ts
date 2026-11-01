import { describe, expect, it } from "vitest";
import {
  evaluateAgentChangeScope,
  evaluateGuidedDraftSchema,
  evaluateTddSourceEvidence,
  isRealTestFilePath
} from "../../src/domain/orchestrator-policy";
import { GUIDED_DRAFT_SCHEMA } from "../../src/domain/agent-schemas";

describe("orchestrator policy", () => {
  it("recognizes real test files and rejects synthetic evidence as primary TDD proof", () => {
    expect(isRealTestFilePath("tests/feature.test.ts")).toBe(true);
    expect(isRealTestFilePath("src/foo.spec.ts")).toBe(true);
    expect(isRealTestFilePath("tests/e2e/dashboard.pw.ts")).toBe(true);
    expect(isRealTestFilePath(".sdd/orchestrator-evidence/feature/group-red.md")).toBe(false);
  });

  it("requires red and green phases to share a real test source file", () => {
    const result = evaluateTddSourceEvidence({
      taskGroup: "group-1-tests-first",
      redChangedFiles: [".sdd/orchestrator-evidence/feature/group-red.md", "tests/feature.test.ts"],
      greenChangedFiles: ["src/feature.ts", "tests/feature.test.ts"],
      refactorChangedFiles: ["src/feature.ts", "tests/feature.test.ts"]
    });

    expect(result.passed).toBe(true);
    expect(result.sharedTestFiles).toEqual(["tests/feature.test.ts"]);
  });

  it("rejects synthetic-only red and green evidence", () => {
    const result = evaluateTddSourceEvidence({
      taskGroup: "group-1-tests-first",
      redChangedFiles: [".sdd/orchestrator-evidence/feature/group-red.md"],
      greenChangedFiles: [".sdd/orchestrator-evidence/feature/group-green.md"]
    });

    expect(result.passed).toBe(false);
    expect(result.findings.map((finding) => finding.id)).toContain("tdd.red.real-test-file");
    expect(result.findings.map((finding) => finding.id)).toContain("tdd.green.same-test-file");
  });

  it("allows expected implementation and evidence paths", () => {
    const result = evaluateAgentChangeScope({
      featureId: "2026-05-25-feature",
      taskGroup: "group-1-tests-first",
      phase: "green",
      changedFiles: [
        "src/domain/feature.ts",
        "tests/feature.test.ts",
        ".sdd/evidence/agent-green.log",
        ".sdd/agent-runs/run/output.json",
        ".sdd/orchestrator-evidence/2026-05-25-feature/group-green.md",
        "package.json"
      ]
    });

    expect(result.passed).toBe(true);
  });

  it("blocks approved spec edits during implementation", () => {
    const result = evaluateAgentChangeScope({
      featureId: "2026-05-25-feature",
      taskGroup: "group-1-tests-first",
      phase: "green",
      changedFiles: ["specs/2026-05-25-feature/requirements.md", "src/domain/feature.ts"]
    });

    expect(result.passed).toBe(false);
    expect(result.findings[0]?.id).toBe("agent.scope.approved-spec");
  });

  it("blocks unrelated generated files outside the allowed implementation surface", () => {
    const result = evaluateAgentChangeScope({
      featureId: "2026-05-25-feature",
      taskGroup: "group-1-tests-first",
      phase: "green",
      changedFiles: ["tmp/generated-output.txt"]
    });

    expect(result.passed).toBe(false);
    expect(result.findings[0]?.id).toBe("agent.scope.forbidden-path");
  });

  it("validates guided draft schema shape strictly", () => {
    const result = evaluateGuidedDraftSchema({
      schema: GUIDED_DRAFT_SCHEMA.feature,
      value: {
        thinking: "A useful thought.",
        questions: [],
        risks: [],
        answers: {
          scope: "Scope",
          decisions: "Decisions",
          context: "Context",
          experience: "No UI-facing experience; no experience.md required."
        }
      },
      label: "feature"
    });

    expect(result.passed).toBe(true);
  });

  it("rejects unknown fields and wrong guided draft answer types", () => {
    const result = evaluateGuidedDraftSchema({
      schema: GUIDED_DRAFT_SCHEMA.feature,
      value: {
        thinking: "A useful thought.",
        extra: "not allowed",
        questions: ["ok"],
        risks: [123],
        answers: {
          scope: "Scope",
          decisions: 42,
          context: "Context",
          experience: "No UI-facing experience; no experience.md required."
        }
      },
      label: "feature"
    });

    expect(result.passed).toBe(false);
    expect(result.findings.map((finding) => finding.id)).toContain("draft.schema.additional-property");
    expect(result.findings.map((finding) => finding.id)).toContain("draft.schema.type");
  });
});
