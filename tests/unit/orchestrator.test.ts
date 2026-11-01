import { describe, expect, it } from "vitest";
import {
  appendOrchestratorEvent,
  createDefaultOrchestratorConfig,
  createInitialOrchestratorRunState,
  incrementRepairAttempts,
  nextOrchestratorWorkflowStep,
  parseOrchestratorConfig,
  parseOrchestratorRunState,
  repairAttemptsFor,
  resolveOrchestratorStepPolicy,
  shouldAttemptAgentRepair,
  updateOrchestratorStepPolicy
} from "../../src/domain/orchestrator";
import { createInitialWorkflowState } from "../../src/domain/workflow";

describe("orchestrator domain policy", () => {
  it("defaults to human intent and agent-owned implementation", () => {
    const config = createDefaultOrchestratorConfig({ agentProvider: "codex" });

    expect(resolveOrchestratorStepPolicy(config, "create-feature-spec").owner).toBe("human");
    expect(resolveOrchestratorStepPolicy(config, "create-semantic-contract").owner).toBe("agent");
    expect(resolveOrchestratorStepPolicy(config, "implement-feature")).toMatchObject({
      owner: "agent",
      repair: "agent",
      maxRepairAttempts: 3,
      refactorEnabled: true
    });
    expect(resolveOrchestratorStepPolicy(config, "feature-validation")).toMatchObject({
      owner: "harness",
      repair: "agent"
    });
    expect(resolveOrchestratorStepPolicy(config, "review-subagent-recommendations")).toMatchObject({
      owner: "human",
      autoRecordEmptyReviewDecisions: false
    });
    expect(resolveOrchestratorStepPolicy(config, "mvp-spec-branch").owner).toBe("human");
    expect(resolveOrchestratorStepPolicy(config, "validation-of-mvp").owner).toBe("human");
    expect(resolveOrchestratorStepPolicy(config, "create-auto-workflow-with-skills").owner).toBe("harness");
  });

  it("tracks repair attempts against the configured budget", () => {
    const config = createDefaultOrchestratorConfig({ agentProvider: "claude" });
    const policy = resolveOrchestratorStepPolicy(config, "feature-validation");
    const initial = createInitialOrchestratorRunState({
      now: "2026-05-25T00:00:00.000Z",
      target: "feature",
      featureId: "feature-a"
    });

    expect(shouldAttemptAgentRepair(initial, "feature-validation", policy)).toBe(true);
    const first = incrementRepairAttempts(initial, "feature-validation", "2026-05-25T00:00:01.000Z");
    const second = incrementRepairAttempts(first, "feature-validation", "2026-05-25T00:00:02.000Z");
    const third = incrementRepairAttempts(second, "feature-validation", "2026-05-25T00:00:03.000Z");

    expect(repairAttemptsFor(third, "feature-validation")).toBe(3);
    expect(shouldAttemptAgentRepair(third, "feature-validation", policy)).toBe(false);
  });

  it("appends run events without losing prior state", () => {
    const state = createInitialOrchestratorRunState({
      now: "2026-05-25T00:00:00.000Z",
      target: "roadmap-next"
    });

    const next = appendOrchestratorEvent(state, {
      at: "2026-05-25T00:00:01.000Z",
      stepId: "create-feature-spec",
      status: "paused",
      message: "Waiting for human spec answers."
    });

    expect(next.status).toBe("paused");
    expect(next.currentStep).toBe("create-feature-spec");
    expect(next.events).toHaveLength(1);
    expect(next.startedAt).toBe(state.startedAt);
  });

  it("merges step policy updates without dropping existing fields", () => {
    const config = createDefaultOrchestratorConfig({ agentProvider: "codex" });
    const first = updateOrchestratorStepPolicy(config, "feature-validation", {
      validationCommands: ["npm run qa"],
      repair: "agent"
    });
    const second = updateOrchestratorStepPolicy(first, "feature-validation", {
      maxRepairAttempts: 1
    });

    expect(second.steps["feature-validation"]).toMatchObject({
      validationCommands: ["npm run qa"],
      repair: "agent",
      maxRepairAttempts: 1
    });
  });

  it("rejects invalid owner and repair combinations", () => {
    const config = createDefaultOrchestratorConfig({ agentProvider: "codex" });

    expect(() => updateOrchestratorStepPolicy(config, "create-feature-spec", {
      owner: "human",
      repair: "agent"
    })).toThrow(/cannot use agent repair/);
    expect(() => updateOrchestratorStepPolicy(config, "feature-validation", {
      refactorEnabled: true
    })).toThrow(/refactorEnabled/);
    expect(() => updateOrchestratorStepPolicy(config, "review-subagent-recommendations", {
      owner: "harness",
      repair: "agent"
    })).toThrow(/human judgment/);
  });

  it("validates persisted orchestrator config shape", () => {
    const config = createDefaultOrchestratorConfig({ agentProvider: "codex" });

    expect(parseOrchestratorConfig(config).agentProvider).toBe("codex");
    expect(() => parseOrchestratorConfig({ ...config, steps: { "missing-step": {} } })).toThrow(/known workflow step/);
    expect(() => parseOrchestratorConfig({ ...config, steps: { "feature-validation": { owner: "robot" } } })).toThrow(/owner/);
    expect(() => parseOrchestratorConfig({ ...config, maxRepairAttemptsPerStep: -1 })).toThrow(/non-negative/);
  });

  it("validates persisted orchestrator run state shape", () => {
    const state = createInitialOrchestratorRunState({
      now: "2026-05-25T00:00:00.000Z",
      target: "feature",
      featureId: "feature-a"
    });

    expect(parseOrchestratorRunState(state).target).toBe("feature");
    expect(() => parseOrchestratorRunState({ ...state, status: "done" })).toThrow(/run status/);
    expect(() => parseOrchestratorRunState({ ...state, repairAttempts: { "missing-step": 1 } })).toThrow(/known workflow step/);
    expect(() => parseOrchestratorRunState({ ...state, events: [{ at: "now", status: "running" }] })).toThrow(/message/);
  });

  it("selects roadmap-next steps and filters by feature context", () => {
    const state = createInitialWorkflowState("2026-05-25T00:00:00.000Z");
    const withFeature = {
      ...state,
      steps: {
        ...state.steps,
        "setup-stakeholder-thoughts": { ...state.steps["setup-stakeholder-thoughts"], status: "complete" as const },
        "create-constitution": { ...state.steps["create-constitution"], status: "complete" as const },
        "create-feature-spec": { ...state.steps["create-feature-spec"], status: "complete" as const, featureId: "feature-a" },
        "iterate-feature-spec": { ...state.steps["iterate-feature-spec"], status: "ready" as const, featureId: "feature-a" }
      }
    };

    expect(nextOrchestratorWorkflowStep(state)?.id).toBe("setup-stakeholder-thoughts");
    expect(nextOrchestratorWorkflowStep(withFeature, "feature-a")?.id).toBe("validate-constitution");
  });
});
