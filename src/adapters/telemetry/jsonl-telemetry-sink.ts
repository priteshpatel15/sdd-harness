import path from "node:path";
import { Evidence, RunTrace } from "../../domain/models";
import { FileSystemPort, TelemetrySink } from "../../application/ports";
import { validateRunTraceSchema } from "../../domain/telemetry-evidence";

export class JsonlTelemetrySink implements TelemetrySink {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string
  ) {}

  public async record(event: RunTrace): Promise<void> {
    const validation = validateRunTraceSchema(event);
    if (!validation.valid) {
      throw new Error(`Invalid telemetry trace: ${validation.errors.join(", ")}`);
    }
    await this.fs.appendFile(this.telemetryPath(), `${JSON.stringify(event)}\n`);
  }

  public async recordEvidence(evidence: Evidence): Promise<void> {
    await this.fs.appendFile(path.join(this.projectRoot, ".sdd", "evidence.jsonl"), `${JSON.stringify(evidence)}\n`);
  }

  private telemetryPath(): string {
    return path.join(this.projectRoot, ".sdd", "telemetry.jsonl");
  }
}
