import path from "node:path";
import { createHash } from "node:crypto";
import { ClockPort, FileSystemPort, IdGeneratorPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { ApprovalRecord, Evidence, FeatureSpecStatus, QualityGate, RunTrace } from "../../domain/models";
import { GateError, ValidationError } from "../../domain/errors";

export class SystemClock implements ClockPort {
  public now(): Date {
    return new Date();
  }
}

export class DeterministicIdGenerator implements IdGeneratorPort {
  private counter = 0;

  public nextId(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter.toString().padStart(4, "0")}`;
  }
}

export function assertAllGatesPass(gates: readonly QualityGate[]): void {
  const failed = gates.filter((gate) => gate.severity === "blocking" && !gate.passed);
  if (failed.length > 0) {
    throw new GateError(failed.map((gate) => `${gate.id}: ${gate.message}`).join("\n"), "GATE_FAILED", failed);
  }
}

export function assertValidationPasses(gates: readonly QualityGate[]): void {
  const failed = gates.filter((gate) => gate.severity === "blocking" && !gate.passed);
  if (failed.length > 0) {
    throw new ValidationError(failed.map((gate) => `${gate.id}: ${gate.message}`).join("\n"), "VALIDATION_FAILED", failed);
  }
}

export async function traceUseCase<T>(
  telemetry: TelemetrySink,
  clock: ClockPort,
  command: string,
  inputs: Record<string, unknown>,
  operation: () => Promise<{ readonly result: T; readonly gates?: readonly QualityGate[]; readonly evidence?: readonly Evidence[]; readonly outputs?: Record<string, unknown> }>
): Promise<T> {
  const startedAt = clock.now().toISOString();
  const runId = `${command}-${startedAt}`;
  await telemetry.record({
    id: runId,
    command,
    startedAt,
    status: "started",
    inputs,
    outputs: {},
    gates: [],
    evidence: []
  });

  try {
    const outcome = await operation();
    const evidence = outcome.evidence ?? evidenceFromOutputs(outcome.outputs ?? {}, clock.now().toISOString());
    const event: RunTrace = {
      id: runId,
      command,
      startedAt,
      endedAt: clock.now().toISOString(),
      status: "succeeded",
      inputs,
      outputs: outcome.outputs ?? {},
      gates: outcome.gates ?? [],
      evidence
    };
    await telemetry.record(event);
    for (const item of evidence) {
      await telemetry.recordEvidence(item);
    }
    return outcome.result;
  } catch (error) {
    const event: RunTrace = {
      id: runId,
      command,
      startedAt,
      endedAt: clock.now().toISOString(),
      status: "failed",
      inputs,
      outputs: {
        error: error instanceof Error ? error.message : String(error)
      },
      gates: error instanceof GateError || error instanceof ValidationError ? failureGates(command, error) : [],
      evidence: []
    };
    await telemetry.record(event);
    throw error;
  }
}

function evidenceFromOutputs(outputs: Record<string, unknown>, createdAt: string): readonly Evidence[] {
  return Object.entries(outputs)
    .filter(([key, value]) => /(?:^path$|Path$)/.test(key) && typeof value === "string" && value.trim().length > 0)
    .map(([key, value], index) => ({
      id: `output-${key}-${index + 1}`,
      kind: "file" as const,
      path: value as string,
      summary: `Output artifact from ${key}.`,
      passed: true,
      createdAt
    }));
}

function failureGates(command: string, error: GateError | ValidationError): readonly QualityGate[] {
  if (error.gates.length > 0) {
    return error.gates;
  }
  return [{
    id: error.code.toLowerCase().replace(/_/g, "."),
    name: command,
    severity: "blocking",
    passed: false,
    message: error.message
  }];
}

export async function requireFeatureStatus(store: SpecStorePort, featureId: string, allowedStatuses: readonly FeatureSpecStatus[], action: string): Promise<void> {
  const metadata = await store.readMetadata();
  const feature = metadata.features[featureId];
  if (feature === undefined) {
    throw new GateError(`Hard gate: feature '${featureId}' is not registered in SDD metadata.`);
  }
  if (!allowedStatuses.includes(feature.status)) {
    throw new GateError(`Hard gate: feature '${featureId}' must be ${allowedStatuses.join(" or ")} before ${action}. Current status: ${feature.status}.`);
  }
}

export async function requireCurrentFeatureApproval(
  store: SpecStorePort,
  workflow: WorkflowStatePort,
  fs: FileSystemPort,
  projectRoot: string,
  featureId: string
): Promise<void> {
  const approvals = await workflow.readArtifacts<ApprovalRecord>("approvals");
  const latest = approvals
    .filter((approval) => approval.target === "feature" && approval.featureId === featureId)
    .sort((left, right) => right.approvedAt.localeCompare(left.approvedAt))[0];
  if (latest === undefined) {
    throw new GateError(`Hard gate: feature '${featureId}' requires a feature approval record.`);
  }

  const current = await currentFeatureFileHashes(store, fs, projectRoot, featureId);
  const mismatches = Object.entries(latest.fileHashes).filter(([file, approvedHash]) => current[file] !== approvedHash);
  const missingFromApproval = Object.keys(current).filter((file) => latest.fileHashes[file] === undefined);
  if (mismatches.length > 0 || missingFromApproval.length > 0) {
    throw new GateError(`Hard gate: feature '${featureId}' changed after approval. Re-run feature validate-spec and feature approve. Changed files: ${[...mismatches.map(([file]) => file), ...missingFromApproval].join(", ")}.`);
  }
}

export async function requireExistingEvidencePaths(fs: FileSystemPort, projectRoot: string, values: readonly string[], label: string): Promise<void> {
  const missing: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      missing.push("(empty)");
      continue;
    }
    const fileRef = trimmed.split("::")[0]!.trim();
    const absolute = path.isAbsolute(fileRef) ? fileRef : path.join(projectRoot, fileRef);
    if (!(await fs.exists(absolute))) {
      missing.push(trimmed);
    }
  }
  if (missing.length > 0) {
    throw new GateError(`Hard gate: ${label} must reference existing file paths. Missing: ${missing.join(", ")}.`);
  }
}

async function currentFeatureFileHashes(store: SpecStorePort, fs: FileSystemPort, projectRoot: string, featureId: string): Promise<Record<string, string>> {
  const featurePath = await store.resolveFeaturePath(featureId);
  const candidates = ["requirements.md", "plan.md", "validation.md", "experience.md", "semantics.md"];
  const hashes: Record<string, string> = {};
  for (const candidate of candidates) {
    const absolute = path.join(featurePath, candidate);
    if (await fs.exists(absolute)) {
      hashes[path.relative(projectRoot, absolute)] = createHash("sha256").update(await fs.readFile(absolute)).digest("hex");
    }
  }
  return hashes;
}
