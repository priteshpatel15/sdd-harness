import { describe, expect, it } from "vitest";
import { structuredTelemetryEvidenceMatches, validateRunTraceSchema } from "../../src/domain/telemetry-evidence";

describe("structured telemetry evidence", () => {
  it("passes on exact structured telemetry fields and arrays", () => {
    expect(structuredTelemetryEvidenceMatches("feature.saved", JSON.stringify({ event: "feature.saved" }))).toBe(true);
    expect(structuredTelemetryEvidenceMatches("feature.saved", JSON.stringify({ nested: { eventName: "feature.saved" } }))).toBe(true);
    expect(structuredTelemetryEvidenceMatches("feature.saved", JSON.stringify({ telemetryEvents: ["feature.saved"] }))).toBe(true);
  });

  it("does not pass on raw substring-only text or malformed JSON lines", () => {
    expect(structuredTelemetryEvidenceMatches("feature.saved", "raw text mentions feature.saved")).toBe(false);
    expect(structuredTelemetryEvidenceMatches("feature.saved", "{not json feature.saved")).toBe(false);
    expect(structuredTelemetryEvidenceMatches("feature.saved", JSON.stringify({ summary: "feature.saved happened" }))).toBe(false);
  });

  it("validates structured run trace schema including failed gates", () => {
    const trace = {
      id: "feature complete-2026-05-25T00:00:00.000Z",
      command: "feature complete",
      startedAt: "2026-05-25T00:00:00.000Z",
      endedAt: "2026-05-25T00:00:01.000Z",
      status: "failed",
      inputs: { featureId: "feature" },
      outputs: { error: "Hard gate failed" },
      gates: [{
        id: "feature.validation",
        name: "Validation",
        severity: "blocking",
        passed: false,
        message: "Validation summary is missing"
      }],
      evidence: []
    };

    expect(validateRunTraceSchema(trace)).toEqual({ valid: true, errors: [] });
  });

  it("rejects malformed run trace schema", () => {
    const validation = validateRunTraceSchema({
      id: "",
      command: "feature complete",
      startedAt: "2026-05-25T00:00:00.000Z",
      status: "done",
      inputs: [],
      outputs: {},
      gates: [{ id: "gate", severity: "blocking", passed: "no", message: "" }],
      evidence: "none"
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("id must be a non-empty string");
    expect(validation.errors).toContain("status must be started, succeeded, or failed");
    expect(validation.errors).toContain("gates[0].name must be a non-empty string");
    expect(validation.errors).toContain("evidence must be an array");
  });
});
