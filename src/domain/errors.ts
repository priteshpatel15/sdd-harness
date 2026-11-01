import type { QualityGate } from "./models";

export class SddError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly exitCode = 1,
    public readonly gates: readonly QualityGate[] = []
  ) {
    super(message);
    this.name = "SddError";
  }
}

export class GateError extends SddError {
  public constructor(message: string, code = "GATE_FAILED", gates: readonly QualityGate[] = []) {
    super(message, code, 2, gates);
    this.name = "GateError";
  }
}

export class ValidationError extends SddError {
  public constructor(message: string, code = "VALIDATION_FAILED", gates: readonly QualityGate[] = []) {
    super(message, code, 3, gates);
    this.name = "ValidationError";
  }
}
