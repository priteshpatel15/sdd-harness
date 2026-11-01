import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempProject, TempProject } from "../helpers/temp-project";
import { NodeFileSystem } from "../../src/adapters/fs/node-file-system";
import { MarkdownSpecStore } from "../../src/adapters/spec/markdown-spec-store";
import { JsonlTelemetrySink } from "../../src/adapters/telemetry/jsonl-telemetry-sink";
import { JsonWorkflowStateStore } from "../../src/adapters/workflow/json-workflow-state-store";
import { SystemClock } from "../../src/application/use-cases/common";
import { CreateConstitutionUseCase } from "../../src/application/use-cases/create-constitution";
import { CreateFeatureSpecUseCase } from "../../src/application/use-cases/create-feature-spec";
import { CreateSemanticContractUseCase } from "../../src/application/use-cases/create-semantic-contract";
import { ValidateSpecUseCase } from "../../src/application/use-cases/validate-spec";
import { GateError } from "../../src/domain/errors";
import { ApproveSpecUseCase } from "../../src/application/use-cases/approve-spec";
import { GitPort } from "../../src/application/ports";

describe("SDD use cases", () => {
  let project: TempProject;
  let fs: NodeFileSystem;
  let store: MarkdownSpecStore;
  let workflow: JsonWorkflowStateStore;
  let telemetry: JsonlTelemetrySink;
  let clock: SystemClock;

  beforeEach(async () => {
    project = await createTempProject();
    fs = new NodeFileSystem();
    store = new MarkdownSpecStore(fs, project.root);
    workflow = new JsonWorkflowStateStore(fs, project.root);
    telemetry = new JsonlTelemetrySink(fs, project.root);
    clock = new SystemClock();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it("enforces constitution interview hard gate", async () => {
    const useCase = new CreateConstitutionUseCase(store, fs, project.root, workflow, telemetry, clock);

    await expect(useCase.execute({
      id: "questions-1",
      workflow: "constitution",
      source: "test",
      createdAt: "2026-05-23T00:00:00.000Z",
      answers: { mission: "Build it" }
    })).rejects.toBeInstanceOf(GateError);
  });

  it("creates, validates, and approves a feature spec", async () => {
    const constitution = new CreateConstitutionUseCase(store, fs, project.root, workflow, telemetry, clock);
    await constitution.execute({
      id: "constitution-questions",
      workflow: "constitution",
      source: "test",
      createdAt: "2026-05-23T00:00:00.000Z",
      answers: {
        mission: "Build a harness for developers. Success means specs and code stay aligned.",
        targetAudience: "Developers using AI agents",
        techStack: "TypeScript, Vitest, Playwright, TDD",
        roadmap: "Feature Spec Automation"
      }
    });

    const git: GitPort = {
      isRepository: async () => false,
      currentBranch: async () => undefined,
      hasUncommittedChanges: async () => false,
      changedFiles: async () => [],
      diff: async () => undefined,
      createBranch: async () => ({ exitCode: 0, stdout: "", stderr: "" }),
      recentCommits: async () => []
    };
    const createFeature = new CreateFeatureSpecUseCase(store, git, workflow, telemetry, clock);
    const result = await createFeature.execute({
      waiverReason: "Test fixture does not need a git branch.",
      approvedBy: "Architect",
      questionEvidence: {
        id: "feature-questions",
        workflow: "feature-spec",
        source: "test",
        createdAt: "2026-05-23T00:00:00.000Z",
        answers: {
          scope: "Automate feature specs",
          decisions: "Use markdown and metadata",
          context: "No code before approved spec",
          experience: "No UI-facing experience; no experience.md required."
        }
      }
    });

    const validate = new ValidateSpecUseCase(store, workflow, telemetry, clock);
    const semantics = new CreateSemanticContractUseCase(store, workflow, telemetry, clock);
    await semantics.execute({
      featureId: result.featureId,
      questionEvidence: {
        id: "semantic-questions",
        workflow: "semantic-contract",
        source: "test",
        createdAt: "2026-05-23T00:00:00.000Z",
        answers: {
          actors: "Developer",
          outcomes: "Feature specs are automated",
          entities: "FeatureSpec",
          commands: "Create feature spec",
          states: "draft -> approved",
          invariants: "Feature implementation waits for approval",
          scenarios: "Create primary feature spec: read roadmap -> write spec files -> validate evidence",
          oracles: "Validation passes",
          data: "not applicable",
          telemetry: "not applicable",
          architecture: "Use cases stay decoupled from adapters"
        }
      }
    });
    await validate.execute({ featureId: result.featureId });
    const approve = new ApproveSpecUseCase(store, fs, project.root, workflow, telemetry, clock);
    await approve.execute({ target: "feature", featureId: result.featureId, reviewer: "Principal Architect" });

    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    expect(metadata.features[result.featureId]?.status).toBe("approved");
    await expect(project.read(".sdd/workflow-state.json")).resolves.toContain("validate-final-feature-spec");
  });
});
