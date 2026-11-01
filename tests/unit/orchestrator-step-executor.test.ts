import { describe, expect, it } from "vitest";
import { createDefaultOrchestratorConfig, resolveOrchestratorStepPolicy, updateOrchestratorStepPolicy } from "../../src/domain/orchestrator";
import { OrchestratorStepExecutorRegistry } from "../../src/application/use-cases/orchestrator-step-executor";
import { ApproveSpecUseCase } from "../../src/application/use-cases/approve-spec";
import { CompleteFeatureUseCase } from "../../src/application/use-cases/complete-feature";
import { DeepReviewUseCase } from "../../src/application/use-cases/deep-review";
import { ReviewDecisionsUseCase } from "../../src/application/use-cases/review-decisions";
import { RunValidationUseCase } from "../../src/application/use-cases/run-validation";
import { SemanticVerifyUseCase } from "../../src/application/use-cases/semantic-verify";
import { SkillValidateUseCase } from "../../src/application/use-cases/skill-workflows";
import { UpdateChangelogUseCase } from "../../src/application/use-cases/update-changelog";
import { ValidateSpecUseCase } from "../../src/application/use-cases/validate-spec";
import { WorkflowCheckpointUseCase } from "../../src/application/use-cases/workflow-control";
import { OrchestratorAgentWorkflows } from "../../src/application/use-cases/orchestrator-agent-workflows";

describe("orchestrator step executor", () => {
  it("preserves feature context and validation sandbox policy for further validation", async () => {
    let received: unknown;
    const runValidation = {
      execute: async (input: unknown) => {
        received = input;
        return {
          evidence: [{
            id: "validation-evidence",
            kind: "command",
            summary: "validation passed",
            passed: true,
            createdAt: "2026-05-25T00:00:00.000Z"
          }]
        };
      }
    } as unknown as RunValidationUseCase;
    let config = createDefaultOrchestratorConfig({ agentProvider: "codex" });
    config = updateOrchestratorStepPolicy(config, "feature-validation", {
      validationCommands: ["npm run qa"],
      testDatabase: "db.sqlite",
      testDatabaseEnv: "APP_DATABASE_URL"
    });
    const executor = registry({ runValidation });

    await executor.execute({
      stepId: "further-validation",
      policy: resolveOrchestratorStepPolicy(config, "further-validation"),
      config,
      featureId: "feature-a"
    });

    expect(received).toEqual({
      featureId: "feature-a",
      commands: ["npm run qa"],
      testDatabase: "db.sqlite",
      testDatabaseEnv: "APP_DATABASE_URL"
    });
  });

  it("does not auto-record empty review decisions without explicit policy", async () => {
    let config = createDefaultOrchestratorConfig({ agentProvider: "codex" });
    config = updateOrchestratorStepPolicy(config, "review-subagent-recommendations", {
      owner: "harness"
    });
    const executor = registry();

    await expect(executor.execute({
      stepId: "review-subagent-recommendations",
      policy: resolveOrchestratorStepPolicy(config, "review-subagent-recommendations"),
      config,
      featureId: "feature-a"
    })).rejects.toThrow(/human-owned by default/);
  });
});

function registry(overrides: { readonly runValidation?: RunValidationUseCase } = {}): OrchestratorStepExecutorRegistry {
  return new OrchestratorStepExecutorRegistry(
    {} as unknown as ValidateSpecUseCase,
    {} as unknown as ApproveSpecUseCase,
    { execute: async () => ({ path: ".sdd/checkpoints.jsonl" }) } as unknown as WorkflowCheckpointUseCase,
    overrides.runValidation ?? ({} as unknown as RunValidationUseCase),
    {} as unknown as DeepReviewUseCase,
    {} as unknown as SemanticVerifyUseCase,
    {} as unknown as ReviewDecisionsUseCase,
    {} as unknown as UpdateChangelogUseCase,
    {} as unknown as CompleteFeatureUseCase,
    {} as unknown as OrchestratorAgentWorkflows,
    {} as unknown as SkillValidateUseCase
  );
}
