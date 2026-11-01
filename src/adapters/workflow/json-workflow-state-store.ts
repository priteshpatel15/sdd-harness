import path from "node:path";
import {
  ApprovalRecord,
  BranchActionRecord,
  CheckpointRecord,
  MvpRetrospective,
  QuestionEvidence,
  ReviewDecisionRecord,
  ReviewSummaryRecord,
  RoadmapUpdateRecord,
  SemanticVerificationSummary,
  TddEvidenceRecord,
  TaskGroupProgress,
  ValidationSummary,
  WaiverRecord,
  WorkflowState,
  WorkflowStepId,
  WorkflowStepState
} from "../../domain/models";
import { createInitialWorkflowState, mergeWorkflowStep } from "../../domain/workflow";
import { FileSystemPort, WorkflowArtifactKind, WorkflowStatePort } from "../../application/ports";

const ARTIFACT_FILES: Record<WorkflowArtifactKind, string> = {
  questions: "question-evidence.jsonl",
  approvals: "approvals.jsonl",
  checkpoints: "checkpoints.jsonl",
  "task-groups": "task-groups.jsonl",
  "validation-summaries": "validation-summaries.jsonl",
  "review-summaries": "review-summaries.jsonl",
  "semantic-verifications": "semantic-verifications.jsonl",
  "review-decisions": "review-decisions.jsonl",
  "mvp-retrospectives": "mvp-retrospectives.jsonl",
  "tdd-evidence": "tdd-evidence.jsonl",
  "branch-actions": "branch-actions.jsonl",
  "roadmap-updates": "roadmap-updates.jsonl",
  waivers: "waivers.jsonl"
};

export class JsonWorkflowStateStore implements WorkflowStatePort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  public async ensure(): Promise<void> {
    await this.fs.mkdir(this.sddPath());
    if (!(await this.fs.exists(this.statePath()))) {
      await this.write(createInitialWorkflowState(this.now()));
    }
  }

  public async read(): Promise<WorkflowState> {
    await this.ensure();
    const parsed = JSON.parse(await this.fs.readFile(this.statePath())) as WorkflowState;
    const baseline = createInitialWorkflowState(parsed.initializedAt ?? this.now());
    return {
      version: 1,
      initializedAt: parsed.initializedAt ?? baseline.initializedAt,
      updatedAt: parsed.updatedAt ?? baseline.updatedAt,
      steps: {
        ...baseline.steps,
        ...(parsed.steps ?? {})
      }
    };
  }

  public async write(state: WorkflowState): Promise<void> {
    await this.fs.writeFile(this.statePath(), `${JSON.stringify(state, null, 2)}\n`);
  }

  public async updateStep(
    stepId: WorkflowStepId,
    update: {
      readonly status?: WorkflowStepState["status"];
      readonly evidence?: readonly string[];
      readonly blockers?: readonly string[];
      readonly branch?: string;
      readonly featureId?: string;
      readonly waiver?: WorkflowStepState["waiver"];
    }
  ): Promise<WorkflowState> {
    const state = await this.read();
    const next = mergeWorkflowStep(state, stepId, this.now(), update);
    await this.write(next);
    return next;
  }

  public async appendQuestionEvidence(evidence: QuestionEvidence): Promise<string> {
    return this.appendArtifact("questions", evidence);
  }

  public async appendApproval(record: ApprovalRecord): Promise<string> {
    return this.appendArtifact("approvals", record);
  }

  public async appendCheckpoint(record: CheckpointRecord): Promise<string> {
    return this.appendArtifact("checkpoints", record);
  }

  public async appendTaskGroupProgress(record: TaskGroupProgress): Promise<string> {
    return this.appendArtifact("task-groups", record);
  }

  public async appendTddEvidence(record: TddEvidenceRecord): Promise<string> {
    return this.appendArtifact("tdd-evidence", record);
  }

  public async appendValidationSummary(record: ValidationSummary): Promise<string> {
    return this.appendArtifact("validation-summaries", record);
  }

  public async appendReviewSummary(record: ReviewSummaryRecord): Promise<string> {
    return this.appendArtifact("review-summaries", record);
  }

  public async appendSemanticVerification(record: SemanticVerificationSummary): Promise<string> {
    return this.appendArtifact("semantic-verifications", record);
  }

  public async appendReviewDecision(record: ReviewDecisionRecord): Promise<string> {
    return this.appendArtifact("review-decisions", record);
  }

  public async appendMvpRetrospective(record: MvpRetrospective): Promise<string> {
    return this.appendArtifact("mvp-retrospectives", record);
  }

  public async appendBranchAction(record: BranchActionRecord): Promise<string> {
    return this.appendArtifact("branch-actions", record);
  }

  public async appendRoadmapUpdate(record: RoadmapUpdateRecord): Promise<string> {
    return this.appendArtifact("roadmap-updates", record);
  }

  public async appendWaiver(record: WaiverRecord): Promise<string> {
    return this.appendArtifact("waivers", record);
  }

  public async readArtifacts<T>(kind: WorkflowArtifactKind): Promise<readonly T[]> {
    const filePath = this.artifactPath(kind);
    if (!(await this.fs.exists(filePath))) {
      return [];
    }

    const content = await this.fs.readFile(filePath);
    return content
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  }

  private async appendArtifact(kind: WorkflowArtifactKind, record: unknown): Promise<string> {
    const filePath = this.artifactPath(kind);
    await this.fs.appendFile(filePath, `${JSON.stringify(record)}\n`);
    return filePath;
  }

  private artifactPath(kind: WorkflowArtifactKind): string {
    return path.join(this.sddPath(), ARTIFACT_FILES[kind]);
  }

  private statePath(): string {
    return path.join(this.sddPath(), "workflow-state.json");
  }

  private sddPath(): string {
    return path.join(this.projectRoot, ".sdd");
  }
}
