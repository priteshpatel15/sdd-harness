import {
  Evidence,
  AgentConfig,
  AgentDraftRequest,
  AgentDraftResult,
  AgentImplementationRequest,
  AgentImplementationResult,
  AgentProvider,
  FeatureSpec,
  FeatureSpecStatus,
  InterviewAnswers,
  JTBD,
  ApprovalRecord,
  BranchActionRecord,
  CheckpointRecord,
  MvpRetrospective,
  ProjectProfile,
  PromptId,
  PromptRenderContext,
  PromptTemplate,
  QuestionEvidence,
  ReviewDecisionRecord,
  ReviewLens,
  ReviewSummaryRecord,
  RoadmapUpdateRecord,
  RoadmapPhase,
  RunTrace,
  SddMetadata,
  SemanticContract,
  SemanticVerificationDimension,
  SemanticVerificationFinding,
  SemanticVerificationSummary,
  SubagentReviewRequest,
  SubagentReviewResult,
  TddEvidenceRecord,
  TaskGroupProgress,
  ValidationSummary,
  WaiverRecord,
  WorkflowState,
  WorkflowStepId,
  WorkflowStepState
} from "../domain/models";
import { OrchestratorConfig, OrchestratorRunState, OrchestratorStepPolicy } from "../domain/orchestrator";

export interface FileSystemPort {
  readFile(path: string): Promise<string>;
  readFileBuffer?(path: string): Promise<Uint8Array>;
  writeFile(path: string, content: string): Promise<void>;
  appendFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  list(path: string): Promise<string[]>;
  copyFile(sourcePath: string, destinationPath: string): Promise<void>;
  stat(path: string): Promise<{ readonly isFile: boolean; readonly isDirectory: boolean }>;
}

export interface SpecStorePort {
  ensureProject(): Promise<void>;
  writeJtbd(jtbd: JTBD): Promise<void>;
  readJtbd(): Promise<JTBD | undefined>;
  writeConstitution(input: {
    readonly answers: Required<Pick<InterviewAnswers, "mission" | "targetAudience" | "techStack" | "roadmap">>;
    readonly stakeholderNotes: string;
    readonly packageSummary: string;
  }): Promise<void>;
  readConstitutionFiles(): Promise<{ readonly mission?: string; readonly techStack?: string; readonly roadmap?: string }>;
  readRoadmap(): Promise<readonly RoadmapPhase[]>;
  findNextRoadmapPhase(): Promise<RoadmapPhase | undefined>;
  writeFeatureSpec(input: {
    readonly id: string;
    readonly name: string;
    readonly createdOn: string;
    readonly answers: Required<Pick<InterviewAnswers, "scope" | "decisions" | "context" | "experience">>;
    readonly sourcePhase?: RoadmapPhase;
    readonly approved: boolean;
    readonly mvp: boolean;
  }): Promise<FeatureSpec>;
  readFeatureFiles(featureId: string): Promise<{ readonly requirements?: string; readonly plan?: string; readonly validation?: string; readonly rawText: string }>;
  readFeatureExperience(featureId: string): Promise<string | undefined>;
  writeSemanticContract(featureId: string, contract: SemanticContract): Promise<SemanticContract>;
  readSemanticContract(featureId: string): Promise<SemanticContract | undefined>;
  readFeatureSemanticFiles(featureId: string): Promise<{ readonly markdown?: string; readonly contract?: SemanticContract }>;
  writeTddPlan(featureId: string, content: string): Promise<string>;
  writeImplementationPacket(featureId: string, content: string): Promise<string>;
  writeReviewPacket(featureId: string | undefined, content: string): Promise<string>;
  writeReplan(changeName: string, content: string): Promise<string>;
  completeRoadmapPhaseForFeature(featureId: string): Promise<{ readonly path: string; readonly updated: boolean; readonly sourcePhaseId?: string; readonly fileHash: string }>;
  readMetadata(): Promise<SddMetadata>;
  writeMetadata(metadata: SddMetadata): Promise<void>;
  updateFeatureStatus(featureId: string, status: FeatureSpecStatus): Promise<void>;
  updateConstitutionStatus(status: "draft" | "approved"): Promise<void>;
  resolveFeaturePath(featureId: string): Promise<string>;
}

export interface GitPort {
  isRepository(): Promise<boolean>;
  currentBranch(): Promise<string | undefined>;
  hasUncommittedChanges(): Promise<boolean>;
  changedFiles(): Promise<readonly string[]>;
  diff(): Promise<string | undefined>;
  createBranch(branchName: string): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }>;
  recentCommits(sinceIsoDate?: string): Promise<readonly { readonly date: string; readonly subject: string }[]>;
}

export type WorkflowArtifactKind =
  | "questions"
  | "approvals"
  | "checkpoints"
  | "task-groups"
  | "validation-summaries"
  | "review-summaries"
  | "review-decisions"
  | "semantic-verifications"
  | "mvp-retrospectives"
  | "tdd-evidence"
  | "branch-actions"
  | "roadmap-updates"
  | "waivers";

export interface WorkflowStatePort {
  ensure(): Promise<void>;
  read(): Promise<WorkflowState>;
  write(state: WorkflowState): Promise<void>;
  updateStep(
    stepId: WorkflowStepId,
    update: {
      readonly status?: WorkflowStepState["status"];
      readonly evidence?: readonly string[];
      readonly blockers?: readonly string[];
      readonly branch?: string;
      readonly featureId?: string;
      readonly waiver?: WorkflowStepState["waiver"];
    }
  ): Promise<WorkflowState>;
  appendQuestionEvidence(evidence: QuestionEvidence): Promise<string>;
  appendApproval(record: ApprovalRecord): Promise<string>;
  appendCheckpoint(record: CheckpointRecord): Promise<string>;
  appendTaskGroupProgress(record: TaskGroupProgress): Promise<string>;
  appendTddEvidence(record: TddEvidenceRecord): Promise<string>;
  appendValidationSummary(record: ValidationSummary): Promise<string>;
  appendReviewSummary(record: ReviewSummaryRecord): Promise<string>;
  appendSemanticVerification(record: SemanticVerificationSummary): Promise<string>;
  appendReviewDecision(record: ReviewDecisionRecord): Promise<string>;
  appendMvpRetrospective(record: MvpRetrospective): Promise<string>;
  appendBranchAction(record: BranchActionRecord): Promise<string>;
  appendRoadmapUpdate(record: RoadmapUpdateRecord): Promise<string>;
  appendWaiver(record: WaiverRecord): Promise<string>;
  readArtifacts<T>(kind: WorkflowArtifactKind): Promise<readonly T[]>;
}

export interface OrchestratorStorePort {
  readConfig(): Promise<OrchestratorConfig | undefined>;
  writeConfig(config: OrchestratorConfig): Promise<string>;
  updateStepPolicy(stepId: WorkflowStepId, policy: OrchestratorStepPolicy): Promise<{ readonly config: OrchestratorConfig; readonly path: string }>;
  readState(): Promise<OrchestratorRunState | undefined>;
  writeState(state: OrchestratorRunState): Promise<string>;
}

export interface AgentRunnerPort {
  run(input: { readonly command: string; readonly cwd: string }): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }>;
}

export interface AgentProviderPort {
  configure(input: {
    readonly provider: AgentProvider;
    readonly draftCommandTemplate?: string;
    readonly reviewCommandTemplate?: string;
    readonly implementationCommandTemplate?: string;
    readonly requiredReviewLenses?: readonly ReviewLens[];
  }): Promise<AgentConfig>;
  readConfig(projectRoot: string, provider?: AgentProvider): Promise<AgentConfig | undefined>;
  doctor(projectRoot: string, provider: AgentProvider): Promise<{ readonly provider: AgentProvider; readonly available: boolean; readonly command: string; readonly message: string }>;
  draft(input: AgentDraftRequest): Promise<AgentDraftResult>;
  implement(input: AgentImplementationRequest): Promise<AgentImplementationResult>;
}

export interface UserQuestionPort {
  askGroupedQuestions(input: {
    readonly workflow: string;
    readonly promptId?: PromptId;
    readonly promptHash?: string;
    readonly questions: readonly { readonly id: keyof InterviewAnswers; readonly prompt: string }[];
  }): Promise<InterviewAnswers>;
}

export interface PromptCatalogPort {
  list(): readonly PromptTemplate[];
  get(id: PromptId): PromptTemplate | undefined;
  render(input: PromptRenderContext): string;
}

export interface ValidationCommandOptions {
  readonly env?: Record<string, string>;
}

export interface ValidationCommandResult {
  readonly command: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly evidencePath?: string;
}

export interface TestRunnerPort {
  runCommand(command: string, cwd: string, options?: ValidationCommandOptions): Promise<ValidationCommandResult>;
}

export interface BrowserQAPort {
  hasWorkflowCoverage(projectRoot: string): Promise<{ readonly passed: boolean; readonly evidence: string }>;
  validateExperienceCoverage(input: {
    readonly projectRoot: string;
    readonly featureId: string;
    readonly experienceMarkdown: string;
  }): Promise<{ readonly passed: boolean; readonly evidence: string; readonly missingFlows: readonly string[] }>;
  validateExecutedExperienceCoverage(input: {
    readonly projectRoot: string;
    readonly featureId: string;
    readonly experienceMarkdown: string;
    readonly commands: readonly ValidationCommandResult[];
    readonly packageScripts: Record<string, string>;
    readonly strict?: boolean;
  }): Promise<{ readonly passed: boolean; readonly evidence: string; readonly missingFlows: readonly string[] }>;
  validateInventoryCoverage(input: {
    readonly projectRoot: string;
    readonly featureId: string;
    readonly experienceMarkdown: string;
  }): Promise<{ readonly passed: boolean; readonly evidence: string; readonly missingWorkflows: readonly string[] }>;
}

export interface DatabaseSandboxPort {
  createTestCopy(input: { readonly projectRoot: string; readonly databasePath: string; readonly envKey?: string }): Promise<{ readonly copyPath: string; readonly env: Record<string, string>; readonly evidencePath?: string }>;
  createConfiguredSandbox(input: { readonly projectRoot: string }): Promise<{ readonly label: string; readonly env: Record<string, string>; readonly evidencePath: string } | undefined>;
  cleanupConfiguredSandbox(input: { readonly projectRoot: string }): Promise<{ readonly evidencePath?: string } | undefined>;
}

export interface DatabaseMutationVerifierPort {
  verifyExpectedMutations(input: {
    readonly projectRoot: string;
    readonly originalDatabasePath?: string;
    readonly testDatabasePath: string;
    readonly expectedMutations: readonly string[];
  }): Promise<{
    readonly configured: boolean;
    readonly passed: boolean;
    readonly message: string;
    readonly evidencePath?: string;
    readonly evidencePaths?: readonly string[];
  }>;
}

export interface DocsLookupPort {
  findRelevantDocs(query: string): Promise<readonly { readonly title: string; readonly url: string; readonly summary: string }[]>;
}

export interface IssueTrackerPort {
  listOpenItems(projectRoot: string): Promise<readonly { readonly id: string; readonly title: string; readonly url?: string }[]>;
}

export interface ReviewAgentPort {
  requiredLenses(projectRoot: string): Promise<readonly ReviewLens[]>;
  review(input: SubagentReviewRequest): Promise<SubagentReviewResult>;
}

export interface SemanticVerifierPort {
  verify(input: {
    readonly featureId: string;
    readonly dimension: SemanticVerificationDimension;
    readonly projectRoot: string;
    readonly prompt: string;
  }): Promise<{
    readonly dimension: SemanticVerificationDimension;
    readonly status: "passed" | "failed";
    readonly findings: readonly SemanticVerificationFinding[];
    readonly evidencePaths: readonly string[];
    readonly stdout?: string;
    readonly stderr?: string;
    readonly exitCode?: number;
  }>;
}

export interface TelemetrySink {
  record(event: RunTrace): Promise<void>;
  recordEvidence(evidence: Evidence): Promise<void>;
}

export interface ClockPort {
  now(): Date;
}

export interface IdGeneratorPort {
  nextId(prefix: string): string;
}
