import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { TelemetryEvent, TelemetryPort } from "../../application/evidence/ports";

type JsonlTelemetrySinkOptions = {
  filePath: string;
};

export class JsonlTelemetrySink implements TelemetryPort {
  constructor(private readonly options: JsonlTelemetrySinkOptions) {}

  async emit(event: TelemetryEvent): Promise<void> {
    await mkdir(path.dirname(this.options.filePath), { recursive: true });
    await appendFile(this.options.filePath, `${JSON.stringify(event)}\n`, "utf8");
  }
}
