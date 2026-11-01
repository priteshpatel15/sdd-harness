import type { RunTrace } from "./models";

const ACCEPTED_TELEMETRY_FIELDS = new Set(["event", "eventName", "name", "type", "command", "id"]);

export interface TelemetrySchemaValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function validateRunTraceSchema(value: unknown): TelemetrySchemaValidation {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["trace must be an object"] };
  }

  requireString(value, "id", errors);
  requireString(value, "command", errors);
  requireString(value, "startedAt", errors);
  if (value.endedAt !== undefined && typeof value.endedAt !== "string") {
    errors.push("endedAt must be a string when present");
  }
  if (value.status !== "started" && value.status !== "succeeded" && value.status !== "failed") {
    errors.push("status must be started, succeeded, or failed");
  }
  if (!isRecord(value.inputs) || Array.isArray(value.inputs)) {
    errors.push("inputs must be an object");
  }
  if (!isRecord(value.outputs) || Array.isArray(value.outputs)) {
    errors.push("outputs must be an object");
  }
  if (!Array.isArray(value.gates)) {
    errors.push("gates must be an array");
  } else {
    value.gates.forEach((gate, index) => validateGate(gate, index, errors));
  }
  if (!Array.isArray(value.evidence)) {
    errors.push("evidence must be an array");
  } else {
    value.evidence.forEach((evidence, index) => validateEvidence(evidence, index, errors));
  }

  return { valid: errors.length === 0, errors };
}

export function structuredTelemetryEvidenceMatches(expectedRef: string, ...jsonlContents: readonly (string | undefined)[]): boolean {
  const expected = expectedRef.trim();
  if (expected.length === 0 || /^TODO\b/i.test(expected)) {
    return false;
  }

  for (const content of jsonlContents) {
    for (const line of (content ?? "").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        continue;
      }
      try {
        if (jsonValueMatchesTelemetryRef(JSON.parse(trimmed) as unknown, expected)) {
          return true;
        }
      } catch {
        // Malformed JSONL lines are ignored; raw substrings are not evidence.
      }
    }
  }
  return false;
}

function jsonValueMatchesTelemetryRef(value: unknown, expected: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => jsonValueMatchesTelemetryRef(item, expected));
  }
  if (!isRecord(value)) {
    return false;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (ACCEPTED_TELEMETRY_FIELDS.has(key) && typeof nested === "string" && nested === expected) {
      return true;
    }
    if ((key === "events" || key === "telemetryEvents") && Array.isArray(nested) && nested.some((item) => item === expected)) {
      return true;
    }
    if (jsonValueMatchesTelemetryRef(nested, expected)) {
      return true;
    }
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(value: Record<string, unknown>, key: keyof RunTrace, errors: string[]): void {
  if (typeof value[key] !== "string" || value[key].length === 0) {
    errors.push(`${key} must be a non-empty string`);
  }
}

function validateGate(value: unknown, index: number, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`gates[${index}] must be an object`);
    return;
  }
  for (const key of ["id", "name", "message"]) {
    if (typeof value[key] !== "string" || value[key].length === 0) {
      errors.push(`gates[${index}].${key} must be a non-empty string`);
    }
  }
  if (value.severity !== "info" && value.severity !== "warning" && value.severity !== "blocking") {
    errors.push(`gates[${index}].severity must be info, warning, or blocking`);
  }
  if (typeof value.passed !== "boolean") {
    errors.push(`gates[${index}].passed must be boolean`);
  }
}

function validateEvidence(value: unknown, index: number, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`evidence[${index}] must be an object`);
    return;
  }
  for (const key of ["id", "summary", "createdAt"]) {
    if (typeof value[key] !== "string" || value[key].length === 0) {
      errors.push(`evidence[${index}].${key} must be a non-empty string`);
    }
  }
  if (value.kind !== "command" && value.kind !== "file" && value.kind !== "review" && value.kind !== "manual" && value.kind !== "telemetry") {
    errors.push(`evidence[${index}].kind must be a known evidence kind`);
  }
  if (typeof value.passed !== "boolean") {
    errors.push(`evidence[${index}].passed must be boolean`);
  }
}
