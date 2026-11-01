import { TddEvidencePhase, TddEvidenceRecord, TaskGroupProgress } from "../../domain/models";
import { ClockPort, FileSystemPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { GateError } from "../../domain/errors";
import { requireCurrentFeatureApproval, requireExistingEvidencePaths, requireFeatureStatus, traceUseCase } from "./common";
import path from "node:path";
import { resolvePlanTaskGroup } from "../../domain/spec-validation";

export class CompleteTaskGroupUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly featureId: string;
    readonly taskGroup: string;
    readonly implementationEvidence: readonly string[];
    readonly testEvidence: readonly string[];
    readonly tddRedEvidence?: readonly string[];
    readonly tddGreenEvidence?: readonly string[];
    readonly tddRefactorEvidence?: readonly string[];
    readonly strictTdd?: boolean;
    readonly compatTdd?: boolean;
    readonly waiverReason?: string;
    readonly approvedBy?: string;
  }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "feature complete-task-group", input, async () => {
      await requireFeatureStatus(this.store, input.featureId, ["approved", "implemented", "validated"], "task group completion");
      await requireCurrentFeatureApproval(this.store, this.workflow, this.fs, this.projectRoot, input.featureId);
      const files = await this.store.readFeatureFiles(input.featureId);
      const taskGroup = resolvePlanTaskGroup(files.plan, input.taskGroup);
      if (taskGroup === undefined) {
        throw new GateError(`Hard gate: task group '${input.taskGroup}' does not exist in the approved plan.`);
      }
      const acceptedTaskGroupRefs = [taskGroup.id, taskGroup.title];
      const hasWaiverReason = input.waiverReason !== undefined && input.waiverReason.trim().length > 0;
      const compatTdd = input.compatTdd === true;
      const taskEvidenceWaived = hasWaiverReason && input.testEvidence.length === 0;
      if (input.strictTdd === true && compatTdd) {
        throw new GateError("Hard gate: --strict-tdd and --compat-tdd cannot be combined.");
      }
      if (hasWaiverReason && (input.approvedBy === undefined || input.approvedBy.trim().length === 0)) {
        throw new GateError("Hard gate: task group waivers require --approved-by.");
      }
      if (compatTdd && !hasWaiverReason) {
        throw new GateError("Hard gate: --compat-tdd requires --waiver-reason and --approved-by because it bypasses strict command-backed TDD evidence.");
      }
      if (!taskEvidenceWaived && input.testEvidence.length === 0) {
        throw new GateError("Hard gate: task group completion requires linked test evidence or an explicit waiver.");
      }
      let strictTddTestFiles: readonly string[] = [];
      if (!taskEvidenceWaived && !compatTdd) {
        strictTddTestFiles = await this.assertStrictTddEvidence(input.featureId, taskGroup.id);
      }
      if (input.implementationEvidence.length === 0) {
        throw new GateError("Hard gate: task group completion requires linked implementation evidence.");
      }
      await requireExistingEvidencePaths(this.fs, this.projectRoot, input.implementationEvidence, "task implementation evidence");
      if (!taskEvidenceWaived) {
        await requireExistingEvidencePaths(this.fs, this.projectRoot, input.testEvidence, "task test evidence");
        await requireExistingEvidencePaths(this.fs, this.projectRoot, [
          ...(input.tddRedEvidence ?? []),
          ...(input.tddGreenEvidence ?? []),
          ...(input.tddRefactorEvidence ?? [])
        ], "TDD sequence evidence");
      }
      const implementationMappingFailures = input.implementationEvidence.filter((evidence) => !evidenceMapsToTaskGroup(evidence, acceptedTaskGroupRefs));
      const testMappingFailures = input.testEvidence.filter((evidence) => !evidenceMapsToTaskGroup(evidence, acceptedTaskGroupRefs) || !evidenceMapsToValidation(evidence));
      const tddMappingFailures = [
        ...(input.tddRedEvidence ?? []),
        ...(input.tddGreenEvidence ?? []),
        ...(input.tddRefactorEvidence ?? [])
      ].filter((evidence) => !evidenceMapsToTaskGroup(evidence, acceptedTaskGroupRefs) || !evidenceMapsToValidation(evidence));
      if (implementationMappingFailures.length > 0 || (!taskEvidenceWaived && [...testMappingFailures, ...tddMappingFailures].length > 0)) {
        throw new GateError(`Hard gate: task evidence must map to task group '${taskGroup.id}' and test evidence must map to a VAL-* id. Missing mappings: ${[...implementationMappingFailures, ...testMappingFailures, ...tddMappingFailures].join(", ")}.`);
      }
      if (!taskEvidenceWaived && !compatTdd) {
        const unmatchedTestEvidence = input.testEvidence.filter((evidence) => !strictTddTestFiles.includes(evidenceFile(evidence)));
        if (unmatchedTestEvidence.length > 0) {
          throw new GateError(`Hard gate: strict TDD task completion test evidence must reference the same test file recorded in the matching red/green TDD pair. Unmatched: ${unmatchedTestEvidence.join(", ")}.`);
        }
      }
      await assertEvidenceFilesAreSubstantive(this.fs, this.projectRoot, input.implementationEvidence, "task implementation evidence");
      if (!taskEvidenceWaived) {
        await assertEvidenceFilesAreSubstantive(this.fs, this.projectRoot, input.testEvidence, "task test evidence");
        await assertEvidenceFilesAreSubstantive(this.fs, this.projectRoot, [
          ...(input.tddRedEvidence ?? []),
          ...(input.tddGreenEvidence ?? []),
          ...(input.tddRefactorEvidence ?? [])
        ], "TDD sequence evidence");
      }
      const tddEvidencePaths = !taskEvidenceWaived && !compatTdd
        ? [path.join(this.projectRoot, ".sdd", "tdd-evidence.jsonl")]
        : await this.recordTddEvidence(input.featureId, taskGroup.id, input);
      const record: TaskGroupProgress = {
        id: `task-group-${this.clock.now().toISOString()}`,
        featureId: input.featureId,
        taskGroup: taskGroup.id,
        status: taskEvidenceWaived ? "waived" : "complete",
        implementationEvidence: input.implementationEvidence,
        testEvidence: input.testEvidence,
        waiverReason: input.waiverReason,
        approvedBy: input.approvedBy,
        completedAt: this.clock.now().toISOString()
      };
      const progressPath = await this.workflow.appendTaskGroupProgress(record);
      if (taskEvidenceWaived) {
        await this.workflow.appendWaiver({
          id: `waiver-${this.clock.now().toISOString()}`,
          gateId: "task-group.test-evidence",
          featureId: input.featureId,
          reason: input.waiverReason!,
          approvedBy: input.approvedBy!,
          createdAt: this.clock.now().toISOString()
        });
      }
      if (compatTdd) {
        await this.workflow.appendWaiver({
          id: `waiver-${this.clock.now().toISOString()}`,
          gateId: "task-group.strict-tdd",
          featureId: input.featureId,
          reason: input.waiverReason!,
          approvedBy: input.approvedBy!,
          createdAt: this.clock.now().toISOString()
        });
      }
      const metadata = await this.store.readMetadata();
      if (metadata.features[input.featureId]?.status === "approved") {
        await this.store.updateFeatureStatus(input.featureId, "implemented");
      }
      await this.workflow.updateStep("implement-feature", {
        status: "in_progress",
        featureId: input.featureId,
        evidence: [progressPath, ...tddEvidencePaths]
      });
      return { result: { path: progressPath }, outputs: { path: progressPath, status: record.status } };
    });
  }

  private async assertStrictTddEvidence(featureId: string, taskGroup: string): Promise<readonly string[]> {
    const records = (await this.workflow.readArtifacts<TddEvidenceRecord>("tdd-evidence"))
      .filter((record) => record.featureId === featureId && record.taskGroup === taskGroup)
      .filter((record) => record.command !== undefined && record.commandEvidencePath !== undefined && record.exitCode !== undefined && record.result !== undefined)
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
    const redRecords = records.filter((record) => record.phase === "red" && record.result === "failed-as-expected");
    const greenRecords = records.filter((record) => record.phase === "green" && record.result === "passed");
    if (redRecords.length === 0 || greenRecords.length === 0) {
      throw new GateError("Hard gate: strict TDD task completion requires command-backed red and green evidence recorded with sdd feature record-tdd before implementation can be accepted.");
    }
    const matchingPair = redRecords.flatMap((red) => greenRecords.map((green) => ({ red, green }))).find(({ red, green }) => (
      red.recordedAt < green.recordedAt
      && evidenceFiles(red.evidence).some((file) => evidenceFiles(green.evidence).includes(file))
    ));
    if (matchingPair === undefined) {
      throw new GateError("Hard gate: strict TDD evidence must show the same test file in red and green phases.");
    }
    const invalidMappings = records.flatMap((record) => record.evidence.filter((evidence) => !evidenceMapsToTaskGroup(evidence, [taskGroup]) || !evidenceMapsToValidation(evidence)));
    if (invalidMappings.length > 0) {
      throw new GateError(`Hard gate: command-backed TDD evidence must map to task group '${taskGroup}' and a VAL-* id. Missing mappings: ${invalidMappings.join(", ")}.`);
    }
    const badRefactors = records.filter((record) => record.phase === "refactor" && (record.result !== "passed" || record.recordedAt <= matchingPair.green.recordedAt));
    if (badRefactors.length > 0) {
      throw new GateError("Hard gate: strict TDD refactor evidence must be passing and recorded after green evidence.");
    }
    return evidenceFiles(matchingPair.red.evidence).filter((file) => evidenceFiles(matchingPair.green.evidence).includes(file));
  }

  private async recordTddEvidence(
    featureId: string,
    taskGroup: string,
    input: {
      readonly tddRedEvidence?: readonly string[];
      readonly tddGreenEvidence?: readonly string[];
      readonly tddRefactorEvidence?: readonly string[];
    }
  ): Promise<readonly string[]> {
    const records: readonly { readonly phase: TddEvidencePhase; readonly evidence: readonly string[] }[] = [
      { phase: "red", evidence: input.tddRedEvidence ?? [] },
      { phase: "green", evidence: input.tddGreenEvidence ?? [] },
      { phase: "refactor", evidence: input.tddRefactorEvidence ?? [] }
    ].filter((record): record is { readonly phase: TddEvidencePhase; readonly evidence: readonly string[] } => record.evidence.length > 0);
    const paths: string[] = [];
    for (const record of records) {
      const tddRecord: TddEvidenceRecord = {
        id: `tdd-${record.phase}-${this.clock.now().toISOString()}`,
        featureId,
        taskGroup,
        phase: record.phase,
        evidence: record.evidence,
        validationIds: validationIds(record.evidence),
        recordedAt: this.clock.now().toISOString()
      };
      paths.push(await this.workflow.appendTddEvidence(tddRecord));
    }
    return paths;
  }
}

async function assertEvidenceFilesAreSubstantive(fs: FileSystemPort, projectRoot: string, values: readonly string[], label: string): Promise<void> {
  const emptyOrPlaceholder: string[] = [];
  for (const value of values) {
    const fileRef = value.split("::")[0]!.trim();
    const absolute = path.isAbsolute(fileRef) ? fileRef : path.join(projectRoot, fileRef);
    const content = await fs.readFile(absolute);
    if (isPlaceholderOnly(content)) {
      emptyOrPlaceholder.push(value);
    }
  }
  if (emptyOrPlaceholder.length > 0) {
    throw new GateError(`Hard gate: ${label} files must be non-empty and not placeholder-only. Invalid: ${emptyOrPlaceholder.join(", ")}.`);
  }
}

function evidenceMapsToTaskGroup(value: string, taskGroups: readonly string[]): boolean {
  const parts = value.split("::").slice(1).map((part) => part.trim().toLowerCase());
  return taskGroups.some((taskGroup) => parts.includes(taskGroup.toLowerCase()));
}

function evidenceMapsToValidation(value: string): boolean {
  return value.split("::").slice(1).some((part) => /^VAL-\d+/i.test(part.trim()));
}

function validationIds(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values.flatMap((value) => value.split("::").slice(1).filter((part) => /^VAL-\d+/i.test(part.trim())).map((part) => part.trim()))));
}

function evidenceFiles(values: readonly string[]): readonly string[] {
  return values.map(evidenceFile);
}

function evidenceFile(value: string): string {
  return value.split("::")[0]!.trim();
}

function isPlaceholderOnly(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  return normalized.length === 0 || /^(todo|tbd|placeholder|test evidence|implementation evidence)$/i.test(normalized);
}
