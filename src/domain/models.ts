export type ProjectMode = "greenfield" | "brownfield";

export interface StakeholderThought {
  readonly name: string;
  readonly role?: string;
  readonly thought: string;
}

export interface JTBD {
  readonly productName: string;
  readonly shortDescription?: string;
  readonly audience: string;
  readonly problem: string;
  readonly job: string;
  readonly situation?: string;
  readonly motivation?: string;
  readonly desiredOutcome?: string;
  readonly stakeholders: readonly StakeholderThought[];
}

export interface RoadmapItem {
  readonly text: string;
  readonly done: boolean;
}

export interface RoadmapPhase {
  readonly id: string;
  readonly name: string;
  readonly goal: string;
  readonly items: readonly RoadmapItem[];
}

export interface Constitution {
  readonly mission: string;
  readonly targetAudiences: readonly string[];
  readonly techStack: readonly string[];
  readonly roadmap: readonly RoadmapPhase[];
  readonly qualityStandards: readonly string[];
}

export interface Requirement {
  readonly id: string;
  readonly statement: string;
  readonly source?: string;
}

export type ValidationKind =
  | "unit"
  | "class"
  | "module"
  | "integration"
  | "e2e"
  | "ui"
  | "manual"
  | "typecheck"
  | "build"
  | "qa";

export interface ValidationCase {
  readonly id: string;
  readonly kind: ValidationKind;
  readonly description: string;
  readonly command?: string;
  readonly requiredEvidence?: string;
}

export interface Task {
  readonly id: string;
  readonly text: string;
  readonly done: boolean;
  readonly requirementIds: readonly string[];
  readonly validationIds: readonly string[];
}

export interface TaskGroup {
  readonly id: string;
  readonly title: string;
  readonly tasks: readonly Task[];
}

export type FeatureSpecStatus = "draft" | "needs_review" | "approved" | "implemented" | "validated" | "merged";

export interface FeatureSpec {
  readonly id: string;
  readonly name: string;
  readonly createdOn: string;
  readonly status: FeatureSpecStatus;
  readonly scope: string;
  readonly decisions: string;
  readonly context: string;
  readonly experience?: string;
  readonly taskGroups: readonly TaskGroup[];
  readonly validationCases: readonly ValidationCase[];
  readonly sourcePhaseId?: string;
}

export type GateSeverity = "info" | "warning" | "blocking";

export interface QualityGate {
  readonly id: string;
  readonly name: string;
  readonly severity: GateSeverity;
  readonly passed: boolean;
  readonly message: string;
  readonly evidencePath?: string;
}

export interface Evidence {
  readonly id: string;
  readonly kind: "command" | "file" | "review" | "manual" | "telemetry";
  readonly path?: string;
  readonly summary: string;
  readonly passed: boolean;
  readonly createdAt: string;
}

export interface RunTrace {
  readonly id: string;
  readonly command: string;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly status: "started" | "succeeded" | "failed";
  readonly inputs: Record<string, unknown>;
  readonly outputs: Record<string, unknown>;
  readonly gates: readonly QualityGate[];
  readonly evidence: readonly Evidence[];
}

export interface ProjectProfile {
  readonly mode: ProjectMode;
  readonly rootPath: string;
  readonly hasGit: boolean;
  readonly packageManagers: readonly string[];
  readonly packageScripts: readonly string[];
  readonly packageScriptCommands?: Record<string, string>;
  readonly testCommandCandidates?: readonly {
    readonly name: string;
    readonly command: string;
    readonly reason: string;
  }[];
  readonly languages: readonly string[];
  readonly testFiles: readonly string[];
  readonly uiFiles: readonly string[];
  readonly uiEntryCandidates?: readonly string[];
  readonly databaseFiles: readonly string[];
  readonly databaseSchemaSummaries?: readonly {
    readonly path: string;
    readonly summary: string;
  }[];
  readonly routes: readonly string[];
  readonly routeSummaries?: readonly {
    readonly path: string;
    readonly summary: string;
  }[];
  readonly architectureFiles: readonly string[];
  readonly issueFiles: readonly string[];
  readonly deploymentFiles: readonly string[];
  readonly readmeSummary?: string;
  readonly todoSummary?: string;
}

export interface SddMetadata {
  readonly version: 1;
  readonly project?: {
    readonly mode?: ProjectMode;
    readonly productName?: string;
    readonly initializedAt?: string;
  };
  readonly constitution?: {
    readonly status: "draft" | "approved";
    readonly updatedAt: string;
  };
  readonly features: Record<
    string,
    {
      readonly path: string;
      readonly name: string;
      readonly status: FeatureSpecStatus;
      readonly createdAt: string;
      readonly sourcePhaseId?: string;
    }
  >;
  readonly waivers: readonly {
    readonly id: string;
    readonly gateId: string;
    readonly reason: string;
    readonly approvedBy: string;
    readonly createdAt: string;
  }[];
}

export interface InterviewAnswers {
  readonly mission?: string;
  readonly targetAudience?: string;
  readonly techStack?: string;
  readonly roadmap?: string;
  readonly scope?: string;
  readonly decisions?: string;
  readonly context?: string;
  readonly experience?: string;
  readonly actors?: string;
  readonly outcomes?: string;
  readonly entities?: string;
  readonly commands?: string;
  readonly states?: string;
  readonly invariants?: string;
  readonly scenarios?: string;
  readonly oracles?: string;
  readonly data?: string;
  readonly telemetry?: string;
  readonly architecture?: string;
}

export type WorkflowStepStatus = "not_started" | "ready" | "in_progress" | "blocked" | "complete" | "waived";

export type AutomationLevel = "enforced" | "guided" | "manual_checkpoint" | "not_implemented";

export type WorkflowStepId =
  | "setup-stakeholder-thoughts"
  | "create-constitution"
  | "validate-constitution"
  | "clear-context-before-feature-spec"
  | "create-feature-spec"
  | "iterate-feature-spec"
  | "create-semantic-contract"
  | "validate-final-feature-spec"
  | "clear-context-before-implementation"
  | "implement-feature"
  | "feature-validation"
  | "replanning"
  | "new-idea-skill"
  | "repeat-feature-step"
  | "further-validation"
  | "validate-not-lied-to"
  | "semantic-verification"
  | "review-subagent-recommendations"
  | "run-changelog-skill"
  | "mvp-spec-branch"
  | "validation-of-mvp"
  | "create-auto-workflow-with-skills"
  | "brownfield-discovery";

export interface WorkflowStepDefinition {
  readonly id: WorkflowStepId;
  readonly number: number;
  readonly title: string;
  readonly automationLevel: AutomationLevel;
  readonly command?: string;
  readonly requiredEvidence: readonly string[];
}

export interface WorkflowStepState {
  readonly id: WorkflowStepId;
  readonly number: number;
  readonly title: string;
  readonly status: WorkflowStepStatus;
  readonly automationLevel: AutomationLevel;
  readonly command?: string;
  readonly requiredEvidence: readonly string[];
  readonly evidence: readonly string[];
  readonly blockers: readonly string[];
  readonly waiver?: {
    readonly reason: string;
    readonly approvedBy: string;
    readonly createdAt: string;
  };
  readonly branch?: string;
  readonly featureId?: string;
  readonly updatedAt: string;
}

export interface WorkflowState {
  readonly version: 1;
  readonly initializedAt: string;
  readonly updatedAt: string;
  readonly steps: Record<WorkflowStepId, WorkflowStepState>;
}

export type QuestionWorkflow = "constitution" | "feature-spec" | "semantic-contract" | "mvp";

export interface QuestionEvidence {
  readonly id: string;
  readonly workflow: QuestionWorkflow;
  readonly promptId?: PromptId;
  readonly promptHash?: string;
  readonly source: "skill" | "agent" | "manual" | "test";
  readonly createdAt: string;
  readonly questions?: readonly {
    readonly id: keyof InterviewAnswers;
    readonly prompt: string;
    readonly answer: string;
  }[];
  readonly answers: InterviewAnswers;
}

export type AgentProvider = "codex" | "claude";

export type AgentDraftPurpose = "jtbd" | "constitution" | "feature" | "semantic" | "mvp" | "review";
export type AgentImplementationPhase = "red" | "green" | "refactor" | "repair";

export interface AgentConfig {
  readonly provider: AgentProvider;
  readonly configuredAt: string;
  readonly draftCommandTemplate?: string;
  readonly reviewCommandTemplate?: string;
  readonly implementationCommandTemplate?: string;
  readonly requiredReviewLenses?: readonly ReviewLens[];
}

export interface AgentDraftRequest {
  readonly provider: AgentProvider;
  readonly purpose: AgentDraftPurpose;
  readonly prompt: string;
  readonly schema: Record<string, unknown>;
  readonly projectRoot: string;
  readonly featureId?: string;
  readonly lens?: ReviewLens;
  readonly semanticDimension?: SemanticVerificationDimension;
}

export interface AgentDraftResult {
  readonly provider: AgentProvider;
  readonly purpose: AgentDraftPurpose;
  readonly parsed: unknown;
  readonly rawText: string;
  readonly promptPath: string;
  readonly schemaPath: string;
  readonly outputPath: string;
  readonly command: string;
}

export interface AgentImplementationRequest {
  readonly provider: AgentProvider;
  readonly phase: AgentImplementationPhase;
  readonly prompt: string;
  readonly projectRoot: string;
  readonly featureId: string;
  readonly taskGroup?: string;
}

export interface AgentImplementationResult {
  readonly provider: AgentProvider;
  readonly phase: AgentImplementationPhase;
  readonly featureId: string;
  readonly taskGroup?: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly promptPath: string;
  readonly evidencePath: string;
  readonly command: string;
  readonly changedFilesBefore: readonly string[];
  readonly changedFilesAfter: readonly string[];
  readonly diff?: string;
}

export interface GuidedDraft<TAnswers extends Record<string, string | undefined>> {
  readonly thinking: string;
  readonly questions?: readonly string[];
  readonly risks?: readonly string[];
  readonly answers: TAnswers;
}

export interface ApprovalRecord {
  readonly id: string;
  readonly target: "constitution" | "feature";
  readonly featureId?: string;
  readonly reviewer: string;
  readonly notes?: string;
  readonly approvedAt: string;
  readonly fileHashes: Record<string, string>;
}

export interface CheckpointRecord {
  readonly id: string;
  readonly stepId: WorkflowStepId;
  readonly kind: "context-reset" | "architect-review" | "app-walkthrough" | "merge-decision" | "supervisor-note" | "manual";
  readonly notes: string;
  readonly createdAt: string;
  readonly featureId?: string;
}

export interface TaskGroupProgress {
  readonly id: string;
  readonly featureId: string;
  readonly taskGroup: string;
  readonly status: "complete" | "waived";
  readonly implementationEvidence: readonly string[];
  readonly testEvidence: readonly string[];
  readonly waiverReason?: string;
  readonly approvedBy?: string;
  readonly completedAt: string;
}

export type TddEvidencePhase = "red" | "green" | "refactor";
export type TddEvidenceResult = "failed-as-expected" | "passed" | "failed-unexpectedly";

export interface TddEvidenceRecord {
  readonly id: string;
  readonly featureId: string;
  readonly taskGroup: string;
  readonly phase: TddEvidencePhase;
  readonly evidence: readonly string[];
  readonly validationIds: readonly string[];
  readonly command?: string;
  readonly commandEvidencePath?: string;
  readonly exitCode?: number;
  readonly result?: TddEvidenceResult;
  readonly recordedAt: string;
}

export interface ValidationSummary {
  readonly id: string;
  readonly featureId?: string;
  readonly passed: boolean;
  readonly commands: readonly string[];
  readonly evidence: readonly Evidence[];
  readonly environment?: Record<string, string>;
  readonly uiCoverageEvidence?: string;
  readonly testDatabaseCopy?: string;
  readonly databaseSandboxEvidence?: readonly string[];
  readonly createdAt: string;
}

export interface RoadmapUpdateRecord {
  readonly id: string;
  readonly featureId: string;
  readonly roadmapPath: string;
  readonly sourcePhaseId?: string;
  readonly updated: boolean;
  readonly fileHash: string;
  readonly updatedAt: string;
}

export interface WaiverRecord {
  readonly id: string;
  readonly gateId: string;
  readonly featureId?: string;
  readonly reason: string;
  readonly approvedBy: string;
  readonly createdAt: string;
}

export interface ReviewDecisionRecord {
  readonly id: string;
  readonly featureId?: string;
  readonly decisions: readonly {
    readonly finding: string;
    readonly decision: "accepted" | "rejected" | "deferred";
    readonly reason: string;
    readonly evidence?: readonly string[];
  }[];
  readonly decidedAt: string;
}

export interface ReviewSummaryFinding {
  readonly id: string;
  readonly lens: ReviewLens;
  readonly severity: ReviewFinding["severity"];
  readonly summary: string;
  readonly recommendation: string;
  readonly source?: string;
  readonly evidencePaths: readonly string[];
}

export interface ReviewSummaryRecord {
  readonly id: string;
  readonly featureId?: string;
  readonly status: "passed" | "blocked" | "waived";
  readonly findings: readonly ReviewSummaryFinding[];
  readonly reviewEvidencePaths: readonly string[];
  readonly waivedFindingIds: readonly string[];
  readonly createdAt: string;
}

export interface MvpRetrospective {
  readonly id: string;
  readonly featureId: string;
  readonly findings: string;
  readonly specClarificationsNeeded: boolean;
  readonly createdAt: string;
}

export interface BranchActionRecord {
  readonly id: string;
  readonly branch: string;
  readonly name?: string;
  readonly purpose: "constitution" | "feature" | "replan" | "mvp" | "workflow";
  readonly featureId?: string;
  readonly createdAt: string;
}

export type PromptId =
  | "stakeholder.setup"
  | "jtbd.intake"
  | "constitution.create"
  | "constitution.validate"
  | "brownfield.discover"
  | "feature.create"
  | "feature.iterate"
  | "feature.validate-final"
  | "feature.semantics"
  | "feature.implement"
  | "feature.validation"
  | "feature.deep-review"
  | "feature.semantic-verify"
  | "feature.review-decisions"
  | "replan.create"
  | "skill.create"
  | "changelog.update"
  | "research.backlog"
  | "mvp.plan"
  | "mvp.retro";

export interface PromptTemplate {
  readonly id: PromptId;
  readonly title: string;
  readonly instruction: string;
  readonly requiredContext: readonly string[];
  readonly requiredGroupedQuestions: readonly (keyof InterviewAnswers)[];
  readonly writableFiles: readonly string[];
  readonly hardGates: readonly string[];
  readonly expectedCommand: string;
}

export interface PromptRenderContext {
  readonly promptId: PromptId;
  readonly featureId?: string;
  readonly lens?: ReviewLens;
  readonly semanticDimension?: SemanticVerificationDimension;
  readonly contextFiles: Record<string, string | undefined>;
}

export type ReviewLens = "architecture" | "spec-alignment" | "test-and-qa" | "experience-and-playwright";

export type SemanticVerificationMethod =
  | "static-rule"
  | "unit-test"
  | "integration-test"
  | "e2e-test"
  | "playwright-flow"
  | "database-evidence"
  | "telemetry-evidence"
  | "manual-review"
  | "model-falsification";

export type SemanticVerificationDimension = "architecture-philosophy" | "product-correctness";

export interface SemanticActor {
  readonly id: string;
  readonly name: string;
  readonly context?: string;
  readonly permissions: readonly string[];
}

export interface SemanticEntity {
  readonly id: string;
  readonly name: string;
  readonly states: readonly string[];
}

export interface SemanticCommand {
  readonly id: string;
  readonly name: string;
  readonly actorIds: readonly string[];
  readonly entityIds: readonly string[];
}

export interface SemanticStateTransition {
  readonly id: string;
  readonly entityId: string;
  readonly from: string;
  readonly to: string;
  readonly trigger: string;
}

export interface SemanticEvidenceRequirement {
  readonly id: string;
  readonly kind: SemanticVerificationMethod;
  readonly ref: string;
  readonly required: boolean;
}

export interface SemanticInvariant {
  readonly id: string;
  readonly statement: string;
  readonly severity: "warning" | "blocking";
  readonly verificationMethods: readonly SemanticVerificationMethod[];
  readonly evidence: readonly SemanticEvidenceRequirement[];
}

export interface SemanticOracle {
  readonly id: string;
  readonly statement: string;
  readonly verificationMethods: readonly SemanticVerificationMethod[];
}

export interface SemanticScenario {
  readonly id: string;
  readonly title: string;
  readonly actorIds: readonly string[];
  readonly preconditions: readonly string[];
  readonly steps: readonly string[];
  readonly expectedVisibleOutcome?: string;
  readonly expectedDataMutations: readonly string[];
  readonly expectedTelemetry: readonly string[];
  readonly experienceFlowIds: readonly string[];
  readonly oracleIds: readonly string[];
  readonly evidence: readonly SemanticEvidenceRequirement[];
}

export interface SemanticArchitectureClaim {
  readonly id: string;
  readonly statement: string;
  readonly verificationMethod: SemanticVerificationMethod;
}

export interface SemanticContract {
  readonly version: 1;
  readonly featureId: string;
  readonly sourceHash: string;
  readonly createdAt: string;
  readonly actors: readonly SemanticActor[];
  readonly outcomes: readonly string[];
  readonly entities: readonly SemanticEntity[];
  readonly commands: readonly SemanticCommand[];
  readonly transitions: readonly SemanticStateTransition[];
  readonly invariants: readonly SemanticInvariant[];
  readonly scenarios: readonly SemanticScenario[];
  readonly oracles: readonly SemanticOracle[];
  readonly architectureClaims: readonly SemanticArchitectureClaim[];
  readonly telemetryEvents: readonly string[];
  readonly notApplicable: {
    readonly actors?: string;
    readonly entities?: string;
    readonly commands?: string;
    readonly telemetry?: string;
    readonly architecture?: string;
  };
}

export interface SemanticVerificationFinding {
  readonly id: string;
  readonly claimId: string;
  readonly dimension: SemanticVerificationDimension | "deterministic";
  readonly severity: "info" | "warning" | "blocking";
  readonly summary: string;
  readonly evidenceRefs: readonly string[];
  readonly requiredFix: string;
  readonly source?: string;
}

export interface SemanticVerificationSummary {
  readonly id: string;
  readonly featureId: string;
  readonly status: "passed" | "failed" | "waived";
  readonly deterministicFindings: readonly SemanticVerificationFinding[];
  readonly reviewerFindings: readonly SemanticVerificationFinding[];
  readonly evidencePaths: readonly string[];
  readonly waiverReason?: string;
  readonly approvedBy?: string;
  readonly createdAt: string;
}

export interface ReviewFinding {
  readonly id: string;
  readonly severity: "info" | "warning" | "blocking";
  readonly summary: string;
  readonly recommendation: string;
  readonly source?: string;
  readonly evidenceRefs?: readonly string[];
}

export interface SubagentReviewRequest {
  readonly featureId?: string;
  readonly lens: ReviewLens;
  readonly projectRoot: string;
  readonly prompt: string;
}

export interface SubagentReviewResult {
  readonly lens: ReviewLens;
  readonly status: "passed" | "failed";
  readonly findings: readonly ReviewFinding[];
  readonly evidencePaths: readonly string[];
  readonly stdout?: string;
  readonly stderr?: string;
  readonly exitCode?: number;
}

export interface ExperienceFlow {
  readonly id: string;
  readonly title: string;
  readonly role: string;
  readonly routeOrScreen: string;
  readonly happyPath: string;
  readonly edgeCases: readonly string[];
  readonly dataSetup: string;
  readonly databaseMutations: string;
  readonly expectedVisibleOutcome: string;
  readonly playwrightCoverage: string;
}

export interface ExperienceCoverageMap {
  readonly featureId: string;
  readonly flows: readonly ExperienceFlow[];
}
