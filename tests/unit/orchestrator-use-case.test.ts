import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonOrchestratorStore } from "../../src/adapters/orchestrator/json-orchestrator-store";
import { NodeFileSystem } from "../../src/adapters/fs/node-file-system";
import { MarkdownSpecStore } from "../../src/adapters/spec/markdown-spec-store";
import { JsonWorkflowStateStore } from "../../src/adapters/workflow/json-workflow-state-store";
import { JsonlTelemetrySink } from "../../src/adapters/telemetry/jsonl-telemetry-sink";
import { OrchestratorUseCase } from "../../src/application/use-cases/orchestrator";
import { SystemClock } from "../../src/application/use-cases/common";
import { OrchestratorStepExecutor } from "../../src/application/use-cases/orchestrator-step-executor";
import { createDefaultOrchestratorConfig, createInitialOrchestratorRunState } from "../../src/domain/orchestrator";
import { createTempProject, TempProject } from "../helpers/temp-project";

describe("orchestrator use case", () => {
  let project: TempProject;
  let fs: NodeFileSystem;
  let store: MarkdownSpecStore;
  let workflow: JsonWorkflowStateStore;
  let orchestratorStore: JsonOrchestratorStore;
  let orchestrator: OrchestratorUseCase;

  beforeEach(async () => {
    project = await createTempProject();
    fs = new NodeFileSystem();
    store = new MarkdownSpecStore(fs, project.root);
    workflow = new JsonWorkflowStateStore(fs, project.root);
    orchestratorStore = new JsonOrchestratorStore(fs, project.root);
    orchestrator = new OrchestratorUseCase(
      orchestratorStore,
      store,
      workflow,
      noOpExecutor,
      new JsonlTelemetrySink(fs, project.root),
      new SystemClock()
    );
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it("surfaces stale paused state when the target feature is already merged", async () => {
    await writeMergedFeatureState();

    const result = await orchestrator.status();

    expect(result.lines).toContain("State: paused (stale: target feature is complete)");
    expect(result.lines).toContain("Feature terminal: Feature feature-a is complete.");
    expect(result.lines).toContain("Current policy: owner=human repair=none");
    expect(result.lines).toContain("Reconcile command: sdd orchestrator resume");
  });

  it("resume immediately succeeds when the target feature is already merged", async () => {
    await writeMergedFeatureState();

    const result = await orchestrator.resume();

    expect(result.status).toBe("succeeded");
    expect(result.message).toBe("Feature feature-a is complete.");
  });

  async function writeMergedFeatureState(): Promise<void> {
    await orchestratorStore.writeConfig(createDefaultOrchestratorConfig({ agentProvider: "codex" }));
    await store.writeMetadata({
      version: 1,
      features: {
        "feature-a": {
          path: "specs/feature-a",
          name: "Feature A",
          status: "merged",
          createdAt: "2026-05-25T00:00:00.000Z"
        }
      },
      waivers: []
    });
    await workflow.updateStep("review-subagent-recommendations", {
      status: "complete",
      featureId: "feature-a"
    });
    await orchestratorStore.writeState({
      ...createInitialOrchestratorRunState({
        now: "2026-05-25T00:00:00.000Z",
        target: "feature",
        featureId: "feature-a"
      }),
      status: "paused",
      currentStep: "review-subagent-recommendations",
      pausedReason: "Waiting for review decisions.",
      nextCommand: "sdd feature review-decisions --feature feature-a"
    });
  }
});

const noOpExecutor: OrchestratorStepExecutor = {
  execute: async () => [],
  repair: async () => []
};
