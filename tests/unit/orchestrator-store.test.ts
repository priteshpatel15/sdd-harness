import { afterEach, beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import { JsonOrchestratorStore } from "../../src/adapters/orchestrator/json-orchestrator-store";
import { NodeFileSystem } from "../../src/adapters/fs/node-file-system";
import { createDefaultOrchestratorConfig, createInitialOrchestratorRunState } from "../../src/domain/orchestrator";
import { createTempProject, TempProject } from "../helpers/temp-project";

describe("json orchestrator store", () => {
  let project: TempProject;
  let store: JsonOrchestratorStore;

  beforeEach(async () => {
    project = await createTempProject();
    store = new JsonOrchestratorStore(new NodeFileSystem(), project.root);
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it("round-trips valid config and state", async () => {
    const configPath = await store.writeConfig(createDefaultOrchestratorConfig({ agentProvider: "codex" }));
    const statePath = await store.writeState(createInitialOrchestratorRunState({
      now: "2026-05-25T00:00:00.000Z",
      target: "feature",
      featureId: "feature-a"
    }));

    expect(path.relative(project.root, configPath)).toBe(path.join(".sdd", "orchestrator.json"));
    expect(path.relative(project.root, statePath)).toBe(path.join(".sdd", "orchestrator-state.json"));
    await expect(store.readConfig()).resolves.toMatchObject({ agentProvider: "codex" });
    await expect(store.readState()).resolves.toMatchObject({ target: "feature", featureId: "feature-a" });
  });

  it("rejects malformed config with actionable validation errors", async () => {
    await project.write(path.join(".sdd", "orchestrator.json"), JSON.stringify({
      version: 1,
      agentProvider: "codex",
      profile: "human-intent-ai-build",
      defaultOwner: "harness",
      maxTotalIterations: 20,
      maxRepairAttemptsPerStep: 3,
      approvedBy: "Architect",
      steps: {
        "feature-validation": { owner: "robot" }
      }
    }));

    await expect(store.readConfig()).rejects.toThrow(/Invalid orchestrator config/);
    await expect(store.readConfig()).rejects.toThrow(/owner/);
  });

  it.each([
    ["missing version", (config: Record<string, unknown>) => {
      delete config.version;
    }, /version/],
    ["unknown repair owner", (config: Record<string, unknown>) => {
      const steps = config.steps as Record<string, Record<string, unknown>>;
      steps["feature-validation"] = { repair: "bot" };
    }, /repair/],
    ["invalid step id", (config: Record<string, unknown>) => {
      const steps = config.steps as Record<string, Record<string, unknown>>;
      steps["not-a-workflow-step"] = { owner: "harness" };
    }, /known workflow step/],
    ["negative retry count", (config: Record<string, unknown>) => {
      const steps = config.steps as Record<string, Record<string, unknown>>;
      steps["feature-validation"] = { maxRepairAttempts: -1 };
    }, /maxRepairAttempts/]
  ])("rejects malformed persisted config: %s", async (_name, mutate, expected) => {
    const config = cloneJson(createDefaultOrchestratorConfig({ agentProvider: "codex" }));
    mutate(config);
    await project.write(path.join(".sdd", "orchestrator.json"), JSON.stringify(config));

    await expect(store.readConfig()).rejects.toThrow(/Invalid orchestrator config/);
    await expect(store.readConfig()).rejects.toThrow(expected);
  });

  it("rejects malformed state with actionable validation errors", async () => {
    await project.write(path.join(".sdd", "orchestrator-state.json"), JSON.stringify({
      version: 1,
      status: "running",
      target: "feature",
      startedAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z",
      iteration: -1,
      repairAttempts: {},
      events: []
    }));

    await expect(store.readState()).rejects.toThrow(/Invalid orchestrator state/);
    await expect(store.readState()).rejects.toThrow(/iteration/);
  });

  it.each([
    ["missing version", (state: Record<string, unknown>) => {
      delete state.version;
    }, /version/],
    ["unknown status", (state: Record<string, unknown>) => {
      state.status = "done";
    }, /run status/],
    ["invalid step id", (state: Record<string, unknown>) => {
      state.currentStep = "not-a-workflow-step";
    }, /known workflow step/],
    ["negative retry count", (state: Record<string, unknown>) => {
      state.repairAttempts = { "feature-validation": -1 };
    }, /repairAttempts/],
    ["malformed event", (state: Record<string, unknown>) => {
      state.events = [{ at: "2026-05-25T00:00:01.000Z", status: "running" }];
    }, /event message/]
  ])("rejects malformed persisted state: %s", async (_name, mutate, expected) => {
    const state = cloneJson(createInitialOrchestratorRunState({
      now: "2026-05-25T00:00:00.000Z",
      target: "feature",
      featureId: "feature-a"
    }));
    mutate(state);
    await project.write(path.join(".sdd", "orchestrator-state.json"), JSON.stringify(state));

    await expect(store.readState()).rejects.toThrow(/Invalid orchestrator state/);
    await expect(store.readState()).rejects.toThrow(expected);
  });
});

function cloneJson(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
