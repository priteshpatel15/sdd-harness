import path from "node:path";
import { TddEvidencePhase, TddEvidenceRecord, TddEvidenceResult } from "../../domain/models";
import { resolvePlanTaskGroup } from "../../domain/spec-validation";
import { GateError } from "../../domain/errors";
import { ClockPort, FileSystemPort, SpecStorePort, TelemetrySink, TestRunnerPort, WorkflowStatePort } from "../ports";
import { requireCurrentFeatureApproval, requireExistingEvidencePaths, requireFeatureStatus, traceUseCase } from "./common";

export class RecordTddEvidenceUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly testRunner: TestRunnerPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly featureId: string;
    readonly taskGroup: string;
    readonly phase: TddEvidencePhase;
    readonly evidence: readonly string[];
    readonly command: string;
  }): Promise<{ readonly path: string; readonly result: TddEvidenceResult; readonly exitCode: number }> {
    return traceUseCase(this.telemetry, this.clock, "feature record-tdd", input, async () => {
      await requireFeatureStatus(this.store, input.featureId, ["approved", "implemented", "validated"], "TDD evidence recording");
      await requireCurrentFeatureApproval(this.store, this.workflow, this.fs, this.projectRoot, input.featureId);
      const files = await this.store.readFeatureFiles(input.featureId);
      const taskGroup = resolvePlanTaskGroup(files.plan, input.taskGroup);
      if (taskGroup === undefined) {
        throw new GateError(`Hard gate: task group '${input.taskGroup}' does not exist in the approved plan.`);
      }
      if (input.evidence.length === 0) {
        throw new GateError("Hard gate: TDD evidence recording requires at least one --evidence reference.");
      }
      if (input.command.trim().length === 0) {
        throw new GateError("Hard gate: TDD evidence recording requires --command.");
      }

      const acceptedTaskGroupRefs = [taskGroup.id, taskGroup.title];
      await requireExistingEvidencePaths(this.fs, this.projectRoot, input.evidence, "TDD evidence");
      const missingMappings = input.evidence.filter((evidence) => !evidenceMapsToTaskGroup(evidence, acceptedTaskGroupRefs) || !evidenceMapsToValidation(evidence));
      if (missingMappings.length > 0) {
        throw new GateError(`Hard gate: TDD evidence must map to task group '${taskGroup.id}' and a VAL-* id. Missing mappings: ${missingMappings.join(", ")}.`);
      }
      await assertEvidenceFilesAreSubstantive(this.fs, this.projectRoot, input.evidence, "TDD evidence");

      const commandResult = await this.testRunner.runCommand(input.command, this.projectRoot);
      const result = tddResult(input.phase, commandResult.exitCode);
      const record: TddEvidenceRecord = {
        id: `tdd-${input.phase}-${this.clock.now().toISOString()}`,
        featureId: input.featureId,
        taskGroup: taskGroup.id,
        phase: input.phase,
        evidence: input.evidence,
        validationIds: validationIds(input.evidence),
        command: input.command,
        commandEvidencePath: commandResult.evidencePath,
        exitCode: commandResult.exitCode,
        result,
        recordedAt: this.clock.now().toISOString()
      };
      const recordPath = await this.workflow.appendTddEvidence(record);
      await this.workflow.updateStep("implement-feature", {
        status: "in_progress",
        featureId: input.featureId,
        evidence: [recordPath, ...(commandResult.evidencePath !== undefined ? [commandResult.evidencePath] : [])]
      });

      if (result === "failed-unexpectedly") {
        const expectation = input.phase === "red" ? "fail" : "pass";
        throw new GateError(`Hard gate: TDD ${input.phase} command must ${expectation}; '${input.command}' exited ${commandResult.exitCode}.`);
      }
      return {
        result: { path: recordPath, result, exitCode: commandResult.exitCode },
        outputs: { path: recordPath, result, exitCode: commandResult.exitCode }
      };
    });
  }
}

function tddResult(phase: TddEvidencePhase, exitCode: number): TddEvidenceResult {
  if (phase === "red") {
    return exitCode === 0 ? "failed-unexpectedly" : "failed-as-expected";
  }
  return exitCode === 0 ? "passed" : "failed-unexpectedly";
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

function isPlaceholderOnly(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  return normalized.length === 0 || /^(todo|tbd|placeholder|test evidence|implementation evidence)$/i.test(normalized);
}
