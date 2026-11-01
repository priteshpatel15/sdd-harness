import { describe, expect, it } from "vitest";
import { createInitialWorkflowState, mergeWorkflowStep, nextWorkflowStep, requireQuestionEvidence } from "../../src/domain/workflow";

describe("workflow domain", () => {
  it("initializes the course workflow with stakeholder setup ready", () => {
    const state = createInitialWorkflowState("2026-05-23T00:00:00.000Z");

    expect(state.steps["setup-stakeholder-thoughts"].status).toBe("ready");
    expect(state.steps["create-constitution"].status).toBe("not_started");
  });

  it("merges step evidence without losing required evidence", () => {
    const state = createInitialWorkflowState("2026-05-23T00:00:00.000Z");
    const next = mergeWorkflowStep(state, "create-constitution", "2026-05-23T01:00:00.000Z", {
      status: "complete",
      evidence: ["specs/mission.md", "specs/mission.md"]
    });

    expect(next.steps["create-constitution"].status).toBe("complete");
    expect(next.steps["create-constitution"].evidence).toEqual(["specs/mission.md"]);
    expect(next.steps["create-constitution"].requiredEvidence).toContain("grouped constitution question evidence");
  });

  it("selects the first incomplete non-brownfield course step", () => {
    const state = createInitialWorkflowState("2026-05-23T00:00:00.000Z");

    expect(nextWorkflowStep(state)?.id).toBe("setup-stakeholder-thoughts");
  });

  it("requires persisted grouped question evidence", () => {
    const gates = requireQuestionEvidence({
      id: "questions",
      workflow: "feature-spec",
      source: "test",
      createdAt: "2026-05-23T00:00:00.000Z",
      answers: {
        scope: "Build",
        decisions: "Use CLI"
      }
    }, "feature-spec", ["scope", "decisions", "context"]);

    expect(gates.map((gate) => gate.passed)).toEqual([true, true, false]);
  });
});
