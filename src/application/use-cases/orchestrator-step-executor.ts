import { GateError } from "../../domain/errors";
import { OrchestratorConfig, ResolvedOrchestratorStepPolicy } from "../../domain/orchestrator";
import { AgentProvider, WorkflowStepId } from "../../domain/models";
import { ApproveSpecUseCase } from "./approve-spec";
import { DeepReviewUseCase } from "./deep-review";
import { ReviewDecisionsUseCase } from "./review-decisions";
import { RunValidationUseCase } from "./run-validation";
import { SemanticVerifyUseCase } from "./semantic-verify";
import { UpdateChangelogUseCase } from "./update-changelog";
import { ValidateSpecUseCase } from "./validate-spec";
import { WorkflowCheckpointUseCase } from "./workflow-control";
import { CompleteFeatureUseCase } from "./complete-feature";
import { OrchestratorAgentWorkflows } from "./orchestrator-agent-workflows";
import { SkillValidateUseCase } from "./skill-workflows";

export interface OrchestratorStepExecutionInput {
  readonly stepId: WorkflowStepId;
  readonly policy: ResolvedOrchestratorStepPolicy;
  readonly config: OrchestratorConfig;
  readonly featureId?: string;
}

export interface OrchestratorRepairInput {
  readonly provider: AgentProvider;
  readonly featureId: string;
  readonly stepId: WorkflowStepId;
  readonly errorMessage: string;
  readonly evidencePaths: readonly string[];
}

export interface OrchestratorStepExecutor {
  execute(input: OrchestratorStepExecutionInput): Promise<readonly string[]>;
  repair(input: OrchestratorRepairInput): Promise<readonly string[]>;
}

type StepHandler = (input: OrchestratorStepExecutionInput) => Promise<readonly string[]>;

export class OrchestratorStepExecutorRegistry implements OrchestratorStepExecutor {
  private readonly handlers: Partial<Record<WorkflowStepId, StepHandler>>;

  public constructor(
    private readonly validateSpec: ValidateSpecUseCase,
    private readonly approveSpec: ApproveSpecUseCase,
    private readonly checkpoint: WorkflowCheckpointUseCase,
    private readonly runValidation: RunValidationUseCase,
    private readonly deepReview: DeepReviewUseCase,
    private readonly semanticVerify: SemanticVerifyUseCase,
    private readonly reviewDecisions: ReviewDecisionsUseCase,
    private readonly updateChangelog: UpdateChangelogUseCase,
    private readonly completeFeature: CompleteFeatureUseCase,
    private readonly agentWorkflows: OrchestratorAgentWorkflows,
    private readonly skillValidate: SkillValidateUseCase
  ) {
    this.handlers = {
      "create-constitution": (input) => this.createConstitution(input),
      "validate-constitution": (input) => this.validateConstitution(input),
      "clear-context-before-feature-spec": (input) => this.checkpointStep(input, "context-reset", `Orchestrator checkpoint for ${input.stepId}.`),
      "clear-context-before-implementation": (input) => this.checkpointStep(input, "context-reset", `Orchestrator checkpoint for ${input.stepId}.`),
      "iterate-feature-spec": (input) => this.checkpointStep(input, "supervisor-note", "Orchestrator found no requested feature-spec revision before semantic contract and final approval."),
      replanning: (input) => this.guidedNoop(input),
      "new-idea-skill": (input) => this.guidedNoop(input),
      "repeat-feature-step": (input) => this.guidedNoop(input),
      "create-feature-spec": (input) => this.createFeatureSpec(input),
      "create-semantic-contract": (input) => this.createSemanticContract(input),
      "validate-final-feature-spec": (input) => this.validateFinalFeatureSpec(input),
      "implement-feature": (input) => this.implementFeature(input),
      "feature-validation": (input) => this.featureValidation(input),
      "validate-not-lied-to": (input) => this.deepReviewStep(input),
      "semantic-verification": (input) => this.semanticVerification(input),
      "review-subagent-recommendations": (input) => this.reviewDecisionsStep(input),
      "run-changelog-skill": (input) => this.changelogAndComplete(input),
      "further-validation": (input) => this.furtherValidation(input),
      "create-auto-workflow-with-skills": (input) => this.validateSkills(input)
    };
  }

  public async execute(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    const handler = this.handlers[input.stepId];
    if (handler === undefined) {
      throw new GateError(`Orchestrator does not have an automated action for '${input.stepId}'. Configure this step as human-owned or add an adapter.`);
    }
    return handler(input);
  }

  public async repair(input: OrchestratorRepairInput): Promise<readonly string[]> {
    return this.agentWorkflows.repair(input.provider, input.featureId, input.stepId, input.errorMessage, input.evidencePaths);
  }

  private async createConstitution(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireAgentOwned(input.stepId, input.policy);
    throw new GateError("Orchestrator does not have a bounded automated action for 'create-constitution'. Configure this step as human-owned or use workflow greenfield explicitly.");
  }

  private async validateConstitution(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    await this.validateSpec.execute({});
    const approval = await this.approveSpec.execute({ target: "constitution", reviewer: input.policy.approvedBy });
    return [approval.approvalPath];
  }

  private async checkpointStep(input: OrchestratorStepExecutionInput, kind: "context-reset" | "supervisor-note", notes: string): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    const result = await this.checkpoint.execute({ stepId: input.stepId, kind, featureId: input.featureId, notes });
    return [result.path];
  }

  private async guidedNoop(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    if (!input.policy.completeNoopGuidedSteps) {
      throw new GateError(`Orchestrator step '${input.stepId}' is guided/no-op for this run and completeNoopGuidedSteps is disabled.`);
    }
    const result = await this.checkpoint.execute({
      stepId: input.stepId,
      kind: "supervisor-note",
      featureId: input.featureId,
      notes: `Orchestrator checkpoint: no blocking action required for ${input.stepId} during this feature run.`
    });
    return [result.path];
  }

  private async createFeatureSpec(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireAgentOwned(input.stepId, input.policy);
    return this.agentWorkflows.createFeatureSpec(input.policy, input.config);
  }

  private async createSemanticContract(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireAgentOwned(input.stepId, input.policy);
    return this.agentWorkflows.createSemanticContract(requireFeatureId(input.featureId, input.stepId), input.config.agentProvider);
  }

  private async validateFinalFeatureSpec(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    const featureId = requireFeatureId(input.featureId, input.stepId);
    await this.validateSpec.execute({ featureId });
    const approval = await this.approveSpec.execute({ target: "feature", featureId, reviewer: input.policy.approvedBy });
    return [approval.approvalPath];
  }

  private async implementFeature(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireAgentOwned(input.stepId, input.policy);
    return this.agentWorkflows.implementFeature(requireFeatureId(input.featureId, input.stepId), input.policy, input.config.agentProvider);
  }

  private async featureValidation(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    const result = await this.runValidation.execute({
      featureId: requireFeatureId(input.featureId, input.stepId),
      commands: input.policy.validationCommands,
      testDatabase: input.policy.testDatabase,
      testDatabaseEnv: input.policy.testDatabaseEnv
    });
    return result.evidence.map((item) => item.path ?? item.id);
  }

  private async deepReviewStep(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    const review = await this.deepReview.execute({
      featureId: requireFeatureId(input.featureId, input.stepId),
      waiverReason: input.policy.waiverReason,
      approvedBy: input.policy.approvedBy
    });
    return [review.path];
  }

  private async semanticVerification(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    const verification = await this.semanticVerify.execute({
      featureId: requireFeatureId(input.featureId, input.stepId),
      waiverReason: input.policy.waiverReason,
      approvedBy: input.policy.approvedBy
    });
    return [verification.path];
  }

  private async reviewDecisionsStep(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    if (!input.policy.autoRecordEmptyReviewDecisions) {
      throw new GateError("Orchestrator review decisions are human-owned by default. Configure --auto-record-empty-review-decisions only when there are no warning or blocking findings to disposition.");
    }
    const decisions = await this.reviewDecisions.execute({ featureId: requireFeatureId(input.featureId, input.stepId), decisions: [] });
    return [decisions.path];
  }

  private async changelogAndComplete(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    const changelog = await this.updateChangelog.execute();
    await this.completeFeature.execute({
      featureId: requireFeatureId(input.featureId, input.stepId),
      roadmapEvidence: "specs/roadmap.md",
      waiverReason: input.policy.waiverReason,
      approvedBy: input.policy.approvedBy
    });
    return [changelog.path];
  }

  private async furtherValidation(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    const validationPolicy = input.config.steps["feature-validation"];
    const result = await this.runValidation.execute({
      featureId: input.featureId,
      commands: input.policy.validationCommands ?? validationPolicy?.validationCommands,
      testDatabase: input.policy.testDatabase ?? validationPolicy?.testDatabase,
      testDatabaseEnv: input.policy.testDatabaseEnv ?? validationPolicy?.testDatabaseEnv
    });
    const checkpoint = await this.checkpoint.execute({
      stepId: input.stepId,
      kind: "supervisor-note",
      featureId: input.featureId,
      notes: "Orchestrator completed feature-scoped further validation."
    });
    return [...result.evidence.map((item) => item.path ?? item.id), checkpoint.path];
  }

  private async validateSkills(input: OrchestratorStepExecutionInput): Promise<readonly string[]> {
    requireHarnessOwned(input.stepId, input.policy);
    await this.skillValidate.execute();
    return ["skills/"];
  }
}

function requireFeatureId(featureId: string | undefined, stepId: WorkflowStepId): string {
  if (featureId === undefined) {
    throw new GateError(`Orchestrator step '${stepId}' requires --feature or a workflow feature context.`);
  }
  return featureId;
}

function requireAgentOwned(stepId: WorkflowStepId, policy: ResolvedOrchestratorStepPolicy): void {
  if (policy.owner !== "agent") {
    throw new GateError(`Orchestrator step '${stepId}' requires agent ownership for automated drafting or implementation. Configure it with sdd orchestrator configure --step ${stepId} --owner agent, or set --owner human to pause.`);
  }
}

function requireHarnessOwned(stepId: WorkflowStepId, policy: ResolvedOrchestratorStepPolicy): void {
  if (policy.owner !== "harness") {
    throw new GateError(`Orchestrator step '${stepId}' is a harness-owned gate. Configure it with sdd orchestrator configure --step ${stepId} --owner harness, or set --owner human to pause.`);
  }
}
