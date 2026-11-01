import path from "node:path";
import { NodeFileSystem } from "../../adapters/fs/node-file-system";
import { MarkdownSpecStore } from "../../adapters/spec/markdown-spec-store";
import { JsonlTelemetrySink } from "../../adapters/telemetry/jsonl-telemetry-sink";
import { JsonWorkflowStateStore } from "../../adapters/workflow/json-workflow-state-store";
import { ChildProcessGit } from "../../adapters/git/child-process-git";
import { CommandTestRunner } from "../../adapters/testing/command-test-runner";
import { PlaywrightCoverageAdapter } from "../../adapters/browser/playwright-coverage-adapter";
import { ShellAgentRunner } from "../../adapters/testing/shell-agent-runner";
import { CommandReviewAgent } from "../../adapters/testing/command-review-agent";
import { CommandSemanticVerifier } from "../../adapters/testing/command-semantic-verifier";
import { CommandAgentProvider } from "../../adapters/agents/command-agent-provider";
import { JsonOrchestratorStore } from "../../adapters/orchestrator/json-orchestrator-store";
import { StaticPromptCatalog } from "../../adapters/prompts/static-prompt-catalog";
import { DeterministicIdGenerator, SystemClock } from "../../application/use-cases/common";
import { IntakeJtbdUseCase } from "../../application/use-cases/intake-jtbd";
import { CreateConstitutionUseCase } from "../../application/use-cases/create-constitution";
import { CreateFeatureSpecUseCase } from "../../application/use-cases/create-feature-spec";
import { CreateSemanticContractUseCase } from "../../application/use-cases/create-semantic-contract";
import { ValidateSpecUseCase } from "../../application/use-cases/validate-spec";
import { DiscoverBrownfieldUseCase } from "../../application/use-cases/discover-brownfield";
import { PlanTddUseCase } from "../../application/use-cases/plan-tdd";
import { ImplementTaskGroupUseCase } from "../../application/use-cases/implement-task-group";
import { RecordTddEvidenceUseCase } from "../../application/use-cases/record-tdd-evidence";
import { RunValidationUseCase } from "../../application/use-cases/run-validation";
import { SemanticVerifyUseCase } from "../../application/use-cases/semantic-verify";
import { DeepReviewUseCase } from "../../application/use-cases/deep-review";
import { ReplanUseCase } from "../../application/use-cases/replan";
import { UpdateChangelogUseCase } from "../../application/use-cases/update-changelog";
import { OpenSpecAdapter } from "../../adapters/spec/openspec-adapter";
import { SpecKitAdapter } from "../../adapters/spec/spec-kit-adapter";
import { ResearchBacklogUseCase } from "../../application/use-cases/research-backlog";
import { FileDatabaseSandbox } from "../../adapters/database/file-database-sandbox";
import { CommandDatabaseMutationVerifier } from "../../adapters/database/command-database-mutation-verifier";
import { ConfigDocsLookup } from "../../adapters/docs/config-docs-lookup";
import { ConfigIssueTracker } from "../../adapters/issues/config-issue-tracker";
import { SetupStakeholdersUseCase } from "../../application/use-cases/setup-stakeholders";
import { ApproveSpecUseCase } from "../../application/use-cases/approve-spec";
import { CompleteTaskGroupUseCase } from "../../application/use-cases/complete-task-group";
import { CompleteFeatureUseCase } from "../../application/use-cases/complete-feature";
import { MvpRetroUseCase } from "../../application/use-cases/mvp-retro";
import { ReviewDecisionsUseCase } from "../../application/use-cases/review-decisions";
import { ReviseFeatureSpecUseCase } from "../../application/use-cases/revise-feature-spec";
import { SkillScaffoldUseCase, SkillValidateUseCase } from "../../application/use-cases/skill-workflows";
import { WorkflowBranchUseCase, WorkflowCheckpointUseCase, WorkflowDoctorUseCase, WorkflowNextUseCase, WorkflowStatusUseCase } from "../../application/use-cases/workflow-control";
import { PromptUseCase } from "../../application/use-cases/prompts";
import { AgentConfigureUseCase, AgentDoctorUseCase } from "../../application/use-cases/agent-workflows";
import { GuidedGreenfieldUseCase } from "../../application/use-cases/guided-greenfield";
import { OrchestratorUseCase } from "../../application/use-cases/orchestrator";
import { OrchestratorAgentWorkflows } from "../../application/use-cases/orchestrator-agent-workflows";
import { OrchestratorStepExecutorRegistry } from "../../application/use-cases/orchestrator-step-executor";

export interface CliContext {
  readonly projectRoot: string;
  readonly fs: NodeFileSystem;
  readonly store: MarkdownSpecStore;
  readonly workflow: JsonWorkflowStateStore;
  readonly git: ChildProcessGit;
  readonly telemetry: JsonlTelemetrySink;
  readonly clock: SystemClock;
  readonly promptCatalog: StaticPromptCatalog;
  readonly useCases: {
    readonly setupStakeholders: SetupStakeholdersUseCase;
    readonly intakeJtbd: IntakeJtbdUseCase;
    readonly createConstitution: CreateConstitutionUseCase;
    readonly approveSpec: ApproveSpecUseCase;
    readonly createFeatureSpec: CreateFeatureSpecUseCase;
    readonly createSemanticContract: CreateSemanticContractUseCase;
    readonly reviseFeatureSpec: ReviseFeatureSpecUseCase;
    readonly validateSpec: ValidateSpecUseCase;
    readonly discoverBrownfield: DiscoverBrownfieldUseCase;
    readonly planTdd: PlanTddUseCase;
    readonly implementTaskGroup: ImplementTaskGroupUseCase;
    readonly recordTddEvidence: RecordTddEvidenceUseCase;
    readonly completeTaskGroup: CompleteTaskGroupUseCase;
    readonly runValidation: RunValidationUseCase;
    readonly semanticVerify: SemanticVerifyUseCase;
    readonly deepReview: DeepReviewUseCase;
    readonly reviewDecisions: ReviewDecisionsUseCase;
    readonly completeFeature: CompleteFeatureUseCase;
    readonly replan: ReplanUseCase;
    readonly updateChangelog: UpdateChangelogUseCase;
    readonly mvpRetro: MvpRetroUseCase;
    readonly researchBacklog: ResearchBacklogUseCase;
    readonly skillValidate: SkillValidateUseCase;
    readonly skillScaffold: SkillScaffoldUseCase;
    readonly workflowStatus: WorkflowStatusUseCase;
    readonly workflowNext: WorkflowNextUseCase;
    readonly workflowDoctor: WorkflowDoctorUseCase;
    readonly workflowCheckpoint: WorkflowCheckpointUseCase;
    readonly workflowBranch: WorkflowBranchUseCase;
    readonly workflowGreenfield: GuidedGreenfieldUseCase;
    readonly orchestrator: OrchestratorUseCase;
    readonly prompts: PromptUseCase;
    readonly agentConfigure: AgentConfigureUseCase;
    readonly agentDoctor: AgentDoctorUseCase;
  };
  readonly exporters: {
    readonly openSpec: OpenSpecAdapter;
    readonly specKit: SpecKitAdapter;
  };
}

export function createCliContext(cwd: string, projectOption?: string): CliContext {
  const projectRoot = path.resolve(cwd, projectOption ?? ".");
  const fs = new NodeFileSystem();
  const store = new MarkdownSpecStore(fs, projectRoot);
  const telemetry = new JsonlTelemetrySink(fs, projectRoot);
  const workflow = new JsonWorkflowStateStore(fs, projectRoot);
  const orchestratorStore = new JsonOrchestratorStore(fs, projectRoot);
  const git = new ChildProcessGit(projectRoot);
  const clock = new SystemClock();
  const idGenerator = new DeterministicIdGenerator();
  void idGenerator;

  const testRunner = new CommandTestRunner(fs);
  const browserQa = new PlaywrightCoverageAdapter(fs);
  const databaseSandbox = new FileDatabaseSandbox(fs);
  const databaseMutationVerifier = new CommandDatabaseMutationVerifier(fs);
  const docsLookup = new ConfigDocsLookup(fs, projectRoot);
  const issueTracker = new ConfigIssueTracker(fs, projectRoot);
  const agentRunner = new ShellAgentRunner();
  const promptCatalog = new StaticPromptCatalog();
  const agentProvider = new CommandAgentProvider(fs, projectRoot);
  const reviewAgent = new CommandReviewAgent(fs, agentProvider);
  const semanticVerifier = new CommandSemanticVerifier(fs, agentProvider);
  const guidedGreenfield = new GuidedGreenfieldUseCase(
    fs,
    store,
    workflow,
    promptCatalog,
    agentProvider,
    projectRoot,
    new SetupStakeholdersUseCase(fs, projectRoot, workflow, telemetry, clock),
    new IntakeJtbdUseCase(store, workflow, telemetry, clock),
    new CreateConstitutionUseCase(store, fs, projectRoot, workflow, telemetry, clock),
    new ValidateSpecUseCase(store, workflow, telemetry, clock),
    new ApproveSpecUseCase(store, fs, projectRoot, workflow, telemetry, clock),
    new WorkflowCheckpointUseCase(workflow, telemetry, clock),
    new CreateFeatureSpecUseCase(store, git, workflow, telemetry, clock),
    new CreateSemanticContractUseCase(store, workflow, telemetry, clock),
    new PlanTddUseCase(store, fs, projectRoot, workflow, telemetry, clock),
    new ImplementTaskGroupUseCase(store, fs, agentRunner, git, projectRoot, workflow, telemetry, clock),
    telemetry,
    clock
  );
  const orchestratorAgentWorkflows = new OrchestratorAgentWorkflows(
    fs,
    store,
    workflow,
    promptCatalog,
    agentProvider,
    projectRoot,
    new CreateFeatureSpecUseCase(store, git, workflow, telemetry, clock),
    new CreateSemanticContractUseCase(store, workflow, telemetry, clock),
    new PlanTddUseCase(store, fs, projectRoot, workflow, telemetry, clock),
    new ImplementTaskGroupUseCase(store, fs, agentRunner, git, projectRoot, workflow, telemetry, clock),
    new RecordTddEvidenceUseCase(store, fs, testRunner, projectRoot, workflow, telemetry, clock),
    new CompleteTaskGroupUseCase(store, fs, projectRoot, workflow, telemetry, clock),
    clock
  );
  const orchestratorStepExecutor = new OrchestratorStepExecutorRegistry(
    new ValidateSpecUseCase(store, workflow, telemetry, clock),
    new ApproveSpecUseCase(store, fs, projectRoot, workflow, telemetry, clock),
    new WorkflowCheckpointUseCase(workflow, telemetry, clock),
    new RunValidationUseCase(store, fs, testRunner, browserQa, databaseSandbox, databaseMutationVerifier, projectRoot, workflow, telemetry, clock),
    new DeepReviewUseCase(store, fs, reviewAgent, git, promptCatalog, projectRoot, workflow, telemetry, clock),
    new SemanticVerifyUseCase(store, fs, semanticVerifier, git, projectRoot, workflow, telemetry, clock),
    new ReviewDecisionsUseCase(workflow, fs, projectRoot, telemetry, clock),
    new UpdateChangelogUseCase(fs, git, projectRoot, workflow, telemetry, clock),
    new CompleteFeatureUseCase(store, fs, projectRoot, workflow, telemetry, clock),
    orchestratorAgentWorkflows,
    new SkillValidateUseCase(fs, projectRoot, workflow, telemetry, clock)
  );

  return {
    projectRoot,
    fs,
    store,
    workflow,
    git,
    telemetry,
    clock,
    promptCatalog,
    exporters: {
      openSpec: new OpenSpecAdapter(fs, store, projectRoot),
      specKit: new SpecKitAdapter(fs, store, projectRoot)
    },
    useCases: {
      setupStakeholders: new SetupStakeholdersUseCase(fs, projectRoot, workflow, telemetry, clock),
      intakeJtbd: new IntakeJtbdUseCase(store, workflow, telemetry, clock),
      createConstitution: new CreateConstitutionUseCase(store, fs, projectRoot, workflow, telemetry, clock),
      approveSpec: new ApproveSpecUseCase(store, fs, projectRoot, workflow, telemetry, clock),
      createFeatureSpec: new CreateFeatureSpecUseCase(store, git, workflow, telemetry, clock),
      createSemanticContract: new CreateSemanticContractUseCase(store, workflow, telemetry, clock),
      reviseFeatureSpec: new ReviseFeatureSpecUseCase(store, fs, projectRoot, workflow, telemetry, clock),
      validateSpec: new ValidateSpecUseCase(store, workflow, telemetry, clock),
      discoverBrownfield: new DiscoverBrownfieldUseCase(store, fs, git, projectRoot, workflow, telemetry, clock),
      planTdd: new PlanTddUseCase(store, fs, projectRoot, workflow, telemetry, clock),
      implementTaskGroup: new ImplementTaskGroupUseCase(store, fs, agentRunner, git, projectRoot, workflow, telemetry, clock),
      recordTddEvidence: new RecordTddEvidenceUseCase(store, fs, testRunner, projectRoot, workflow, telemetry, clock),
      completeTaskGroup: new CompleteTaskGroupUseCase(store, fs, projectRoot, workflow, telemetry, clock),
      runValidation: new RunValidationUseCase(store, fs, testRunner, browserQa, databaseSandbox, databaseMutationVerifier, projectRoot, workflow, telemetry, clock),
      semanticVerify: new SemanticVerifyUseCase(store, fs, semanticVerifier, git, projectRoot, workflow, telemetry, clock),
      deepReview: new DeepReviewUseCase(store, fs, reviewAgent, git, promptCatalog, projectRoot, workflow, telemetry, clock),
      reviewDecisions: new ReviewDecisionsUseCase(workflow, fs, projectRoot, telemetry, clock),
      completeFeature: new CompleteFeatureUseCase(store, fs, projectRoot, workflow, telemetry, clock),
      replan: new ReplanUseCase(store, workflow, telemetry, clock),
      updateChangelog: new UpdateChangelogUseCase(fs, git, projectRoot, workflow, telemetry, clock),
      mvpRetro: new MvpRetroUseCase(workflow, telemetry, clock),
      researchBacklog: new ResearchBacklogUseCase(fs, projectRoot, telemetry, clock),
      skillValidate: new SkillValidateUseCase(fs, projectRoot, workflow, telemetry, clock),
      skillScaffold: new SkillScaffoldUseCase(fs, projectRoot, workflow, telemetry, clock),
      workflowStatus: new WorkflowStatusUseCase(workflow, telemetry, clock),
      workflowNext: new WorkflowNextUseCase(workflow, telemetry, clock),
      workflowDoctor: new WorkflowDoctorUseCase(fs, projectRoot, telemetry, clock, docsLookup, issueTracker),
      workflowCheckpoint: new WorkflowCheckpointUseCase(workflow, telemetry, clock),
      workflowBranch: new WorkflowBranchUseCase(workflow, git, telemetry, clock),
      workflowGreenfield: guidedGreenfield,
      orchestrator: new OrchestratorUseCase(
        orchestratorStore,
        store,
        workflow,
        orchestratorStepExecutor,
        telemetry,
        clock
      ),
      prompts: new PromptUseCase(promptCatalog, store, fs, projectRoot, telemetry, clock),
      agentConfigure: new AgentConfigureUseCase(agentProvider, telemetry, clock),
      agentDoctor: new AgentDoctorUseCase(agentProvider, projectRoot, telemetry, clock)
    }
  };
}
