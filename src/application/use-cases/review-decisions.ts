import { ReviewDecisionRecord, ReviewSummaryRecord } from "../../domain/models";
import { ClockPort, FileSystemPort, TelemetrySink, WorkflowStatePort } from "../ports";
import { GateError } from "../../domain/errors";
import { requireExistingEvidencePaths, traceUseCase } from "./common";

export class ReviewDecisionsUseCase {
  public constructor(
    private readonly workflow: WorkflowStatePort,
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly featureId?: string;
    readonly decisions: readonly { readonly finding: string; readonly decision: "accepted" | "rejected" | "deferred"; readonly reason: string; readonly evidence?: readonly string[] }[];
  }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "feature review-decisions", input, async () => {
      const reviewSummary = await this.latestReviewSummary(input.featureId);
      if (reviewSummary === undefined) {
        throw new GateError("Hard gate: review decisions require a deep review summary for this feature.");
      }
      const knownFindings = new Set(reviewSummary.findings.map((finding) => finding.id));
      const actionableFindings = reviewSummary.findings.filter((finding) => finding.severity === "blocking" || finding.severity === "warning");
      if (input.decisions.length === 0 && actionableFindings.length > 0) {
        throw new GateError("Hard gate: review decisions require at least one accepted, rejected, or deferred finding.");
      }
      const invalidFindings = input.decisions.filter((decision) => !knownFindings.has(decision.finding)).map((decision) => decision.finding);
      if (invalidFindings.length > 0) {
        throw new GateError(`Hard gate: review decisions must reference real review finding ids. Unknown: ${invalidFindings.join(", ")}.`);
      }
      const emptyReasons = input.decisions.filter((decision) => decision.reason.trim().length === 0).map((decision) => decision.finding);
      if (emptyReasons.length > 0) {
        throw new GateError(`Hard gate: review decisions require a reason. Missing: ${emptyReasons.join(", ")}.`);
      }
      const missingActionable = actionableFindings
        .filter((finding) => !input.decisions.some((decision) => decision.finding === finding.id))
        .map((finding) => finding.id);
      if (missingActionable.length > 0) {
        throw new GateError(`Hard gate: every blocking or warning review finding needs a decision. Missing: ${missingActionable.join(", ")}.`);
      }
      const evidence = input.decisions.flatMap((decision) => decision.evidence ?? []);
      if (evidence.length > 0) {
        await requireExistingEvidencePaths(this.fs, this.projectRoot, evidence, "review decision evidence");
      }
      const record: ReviewDecisionRecord = {
        id: `review-decisions-${this.clock.now().toISOString()}`,
        featureId: input.featureId,
        decisions: input.decisions,
        decidedAt: this.clock.now().toISOString()
      };
      const path = await this.workflow.appendReviewDecision(record);
      await this.workflow.updateStep("review-subagent-recommendations", {
        status: "complete",
        featureId: input.featureId,
        evidence: [path]
      });
      await this.workflow.updateStep("run-changelog-skill", { status: "ready", featureId: input.featureId });
      return { result: { path }, outputs: { path } };
    });
  }

  private async latestReviewSummary(featureId: string | undefined): Promise<ReviewSummaryRecord | undefined> {
    const summaries = await this.workflow.readArtifacts<ReviewSummaryRecord>("review-summaries");
    return summaries
      .filter((summary) => summary.featureId === featureId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  }
}
