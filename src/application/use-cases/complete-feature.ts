import { ApprovalRecord, ReviewDecisionRecord, ReviewSummaryRecord, RoadmapUpdateRecord, SemanticVerificationSummary, TaskGroupProgress, ValidationSummary } from "../../domain/models";
import { ClockPort, FileSystemPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { GateError } from "../../domain/errors";
import { requireCurrentFeatureApproval, requireExistingEvidencePaths, traceUseCase } from "./common";
import path from "node:path";
import { canCompleteFeature } from "../../domain/feature-status";
import { parsePlanTaskGroups } from "../../domain/spec-validation";

export class CompleteFeatureUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly featureId: string; readonly roadmapEvidence?: string; readonly waiverReason?: string; readonly approvedBy?: string }): Promise<{ readonly ready: true }> {
    return traceUseCase(this.telemetry, this.clock, "feature complete", input, async () => {
      const metadata = await this.store.readMetadata();
      const feature = metadata.features[input.featureId];
      if (feature === undefined) {
        throw new GateError(`Hard gate: unknown feature '${input.featureId}'.`);
      }
      if (!canCompleteFeature(feature.status)) {
        throw new GateError(`Hard gate: feature '${input.featureId}' must be validated before completion. Current status: ${feature.status}.`);
      }
      await requireCurrentFeatureApproval(this.store, this.workflow, this.fs, this.projectRoot, input.featureId);

      const approvals = await this.workflow.readArtifacts<ApprovalRecord>("approvals");
      const validations = await this.workflow.readArtifacts<ValidationSummary>("validation-summaries");
      const semanticVerifications = await this.workflow.readArtifacts<SemanticVerificationSummary>("semantic-verifications");
      const reviewSummaries = await this.workflow.readArtifacts<ReviewSummaryRecord>("review-summaries");
      const decisions = await this.workflow.readArtifacts<ReviewDecisionRecord>("review-decisions");
      const taskGroups = await this.workflow.readArtifacts<TaskGroupProgress>("task-groups");
      const featureFiles = await this.store.readFeatureFiles(input.featureId);
      const plannedTaskGroups = parsePlanTaskGroups(featureFiles.plan);
      const changelogPath = path.join(this.projectRoot, "CHANGELOG.md");
      const implementationPacket = path.join(this.projectRoot, ".sdd", "implementation-packets", `${input.featureId}.md`);
      const latestReviewSummary = reviewSummaries
        .filter((summary) => summary.featureId === input.featureId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
      const latestApproval = approvals
        .filter((approval) => approval.target === "feature" && approval.featureId === input.featureId)
        .sort((left, right) => right.approvedAt.localeCompare(left.approvedAt))[0];
      const latestSemanticVerification = semanticVerifications
        .filter((summary) => summary.featureId === input.featureId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
      const latestReviewDecision = decisions
        .filter((decision) => decision.featureId === input.featureId)
        .sort((left, right) => right.decidedAt.localeCompare(left.decidedAt))[0];
      const latestChangelogUpdate = await this.latestSucceededCommandAt("changelog update");
      const satisfiedTaskGroups = taskGroups.filter((progress) => progress.featureId === input.featureId && (progress.status === "complete" || progress.status === "waived"));
      const satisfiedTaskGroupIds = new Set(satisfiedTaskGroups.map((progress) => progress.taskGroup));
      const missingTaskGroups = plannedTaskGroups.filter((group) => !satisfiedTaskGroupIds.has(group.id));
      const latestTaskEvidence = satisfiedTaskGroups
        .map((progress) => progress.completedAt)
        .sort((left, right) => right.localeCompare(left))[0];
      const validationAfterTaskEvidence = latestTaskEvidence !== undefined
        && validations.some((summary) => summary.featureId === input.featureId && summary.passed && summary.createdAt >= latestTaskEvidence);
      const approvalTime = latestApproval?.approvedAt;
      const validationAfterApproval = approvalTime !== undefined && validations.some((summary) => summary.featureId === input.featureId && summary.passed && summary.createdAt >= approvalTime);
      const reviewAfterApproval = approvalTime !== undefined && latestReviewSummary !== undefined && latestReviewSummary.createdAt >= approvalTime;
      const semanticAfterApproval = approvalTime !== undefined && latestSemanticVerification !== undefined && latestSemanticVerification.createdAt >= approvalTime;
      const decisionsAfterApproval = approvalTime !== undefined && latestReviewDecision !== undefined && latestReviewDecision.decidedAt >= approvalTime;
      const reviewAfterTaskEvidence = latestTaskEvidence !== undefined && latestReviewSummary !== undefined && latestReviewSummary.createdAt >= latestTaskEvidence;
      const semanticAfterTaskEvidence = latestTaskEvidence !== undefined && latestSemanticVerification !== undefined && latestSemanticVerification.createdAt >= latestTaskEvidence;
      const decisionsAfterTaskEvidence = latestTaskEvidence !== undefined && latestReviewDecision !== undefined && latestReviewDecision.decidedAt >= latestTaskEvidence;
      const changelogAfterApproval = approvalTime !== undefined && latestChangelogUpdate !== undefined && latestChangelogUpdate >= approvalTime;
      const changelogAfterTaskEvidence = latestTaskEvidence !== undefined && latestChangelogUpdate !== undefined && latestChangelogUpdate >= latestTaskEvidence;
      const reviewDecisionFailures = await this.reviewDecisionFailures(input.featureId, latestReviewSummary, decisions);
      const roadmapEvidencePaths = input.roadmapEvidence !== undefined ? [input.roadmapEvidence] : [];
      if (roadmapEvidencePaths.length > 0) {
        await requireExistingEvidencePaths(this.fs, this.projectRoot, roadmapEvidencePaths, "roadmap evidence");
      }

      const failures = [
        approvals.some((approval) => approval.target === "feature" && approval.featureId === input.featureId) ? undefined : "feature approval record",
        feature.status === "validated" || feature.status === "merged" ? undefined : "validated feature status",
        validations.some((summary) => summary.featureId === input.featureId && summary.passed) ? undefined : "validation summary",
        validationAfterApproval ? undefined : "validation summary after latest approval",
        validationAfterTaskEvidence ? undefined : "validation summary after task evidence",
        latestReviewSummary !== undefined && (latestReviewSummary.status === "passed" || latestReviewSummary.status === "waived") ? undefined : "passed or waived deep review summary",
        reviewAfterApproval ? undefined : "deep review after latest approval",
        reviewAfterTaskEvidence ? undefined : "deep review after task evidence",
        ...reviewDecisionFailures,
        latestReviewDecision !== undefined ? undefined : "review decision record",
        decisionsAfterApproval ? undefined : "review decisions after latest approval",
        decisionsAfterTaskEvidence ? undefined : "review decisions after task evidence",
        latestSemanticVerification !== undefined && (latestSemanticVerification.status === "passed" || latestSemanticVerification.status === "waived") ? undefined : "semantic verification",
        semanticAfterApproval ? undefined : "semantic verification after latest approval",
        semanticAfterTaskEvidence ? undefined : "semantic verification after task evidence",
        plannedTaskGroups.length > 0
          ? missingTaskGroups.length === 0 ? undefined : `completed or waived task groups (${missingTaskGroups.map((group) => group.id).join(", ")})`
          : satisfiedTaskGroups.length > 0 ? undefined : "completed task group progress",
        await this.fs.exists(changelogPath) ? undefined : "CHANGELOG.md",
        changelogAfterApproval ? undefined : "changelog after latest approval",
        changelogAfterTaskEvidence ? undefined : "changelog after task evidence",
        await this.fs.exists(implementationPacket) ? undefined : "implementation packet",
        input.roadmapEvidence !== undefined ? undefined : "roadmap evidence"
      ].filter((failure): failure is string => failure !== undefined);

      if (plannedTaskGroups.length > 0 && missingTaskGroups.length > 0 && input.waiverReason !== undefined) {
        throw new GateError(`Hard gate: feature completion cannot waive planned task groups at the feature level. Complete or explicitly waive task groups first: ${missingTaskGroups.map((group) => group.id).join(", ")}.`);
      }

      if (failures.length > 0 && input.waiverReason !== undefined && (input.approvedBy === undefined || input.approvedBy.trim().length === 0)) {
        throw new GateError("Hard gate: feature completion waivers require --approved-by.");
      }

      if (failures.length > 0 && input.waiverReason === undefined) {
        throw new GateError(`Hard gate: feature cannot complete until evidence exists for: ${failures.join(", ")}.`);
      }

      if (failures.length > 0 && input.waiverReason !== undefined) {
        await this.workflow.appendWaiver({
          id: `waiver-${this.clock.now().toISOString()}`,
          gateId: "feature-complete",
          featureId: input.featureId,
          reason: input.waiverReason,
          approvedBy: input.approvedBy!,
          createdAt: this.clock.now().toISOString()
        });
        await this.workflow.updateStep("feature-validation", {
          status: "waived",
          featureId: input.featureId,
          waiver: {
            reason: input.waiverReason,
            approvedBy: input.approvedBy ?? "unspecified",
            createdAt: this.clock.now().toISOString()
          }
        });
      }

      const roadmapUpdate = await this.store.completeRoadmapPhaseForFeature(input.featureId);
      const roadmapRecord: RoadmapUpdateRecord = {
        id: `roadmap-update-${this.clock.now().toISOString()}`,
        featureId: input.featureId,
        roadmapPath: path.relative(this.projectRoot, roadmapUpdate.path),
        sourcePhaseId: roadmapUpdate.sourcePhaseId,
        updated: roadmapUpdate.updated,
        fileHash: roadmapUpdate.fileHash,
        updatedAt: this.clock.now().toISOString()
      };
      const roadmapUpdatePath = await this.workflow.appendRoadmapUpdate(roadmapRecord);

      await this.store.updateFeatureStatus(input.featureId, "merged");
      await this.workflow.updateStep("feature-validation", {
        status: "complete",
        featureId: input.featureId,
        evidence: [changelogPath, implementationPacket, roadmapUpdatePath, input.roadmapEvidence ?? path.relative(this.projectRoot, roadmapUpdate.path)]
      });
      await this.workflow.updateStep("repeat-feature-step", { status: "ready" });

      return { result: { ready: true }, outputs: { ready: true, waived: failures.length > 0 } };
    });
  }

  private async reviewDecisionFailures(featureId: string, reviewSummary: ReviewSummaryRecord | undefined, decisionRecords: readonly ReviewDecisionRecord[]): Promise<readonly string[]> {
    if (reviewSummary === undefined) {
      return ["review summary"];
    }

    const actionable = reviewSummary.findings.filter((finding) => finding.severity === "blocking" || finding.severity === "warning");
    if (actionable.length === 0) {
      return [];
    }

    const decisions = decisionRecords
      .filter((record) => record.featureId === featureId)
      .flatMap((record) => record.decisions);
    const decisionsByFinding = new Map(decisions.map((decision) => [decision.finding, decision]));
    const failures: string[] = [];
    const allEvidence = decisions.flatMap((decision) => decision.evidence ?? []);
    if (allEvidence.length > 0) {
      await requireExistingEvidencePaths(this.fs, this.projectRoot, allEvidence, "review decision evidence");
    }

    for (const finding of actionable) {
      const decision = decisionsByFinding.get(finding.id);
      if (decision === undefined || decision.reason.trim().length === 0) {
        failures.push(`review decision for ${finding.id}`);
        continue;
      }
      if (finding.severity === "blocking" && decision.decision === "accepted" && (decision.evidence ?? []).length === 0) {
        failures.push(`follow-up evidence for accepted blocking review finding ${finding.id}`);
      }
    }

    return failures;
  }

  private async latestSucceededCommandAt(command: string): Promise<string | undefined> {
    const telemetryPath = path.join(this.projectRoot, ".sdd", "telemetry.jsonl");
    if (!(await this.fs.exists(telemetryPath))) {
      return undefined;
    }
    const timestamps: string[] = [];
    for (const line of (await this.fs.readFile(telemetryPath)).split(/\r?\n/)) {
      if (line.trim().length === 0) {
        continue;
      }
      try {
        const event = JSON.parse(line) as { readonly command?: string; readonly status?: string; readonly endedAt?: string };
        if (event.command === command && event.status === "succeeded" && event.endedAt !== undefined) {
          timestamps.push(event.endedAt);
        }
      } catch {
        // Ignore malformed telemetry lines; they cannot prove freshness.
      }
    }
    return timestamps.sort((left, right) => right.localeCompare(left))[0];
  }
}
