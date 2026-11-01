import {
  createEvidenceRecord,
  summarizeEvidenceCategories,
  validateEvidenceInput,
  type EvidenceInput,
  type EvidenceRecord
} from "../../domain/evidence";
import type { EvidenceRepositoryPort, TelemetryEvent, TelemetryPort } from "./ports";

type Clock = () => Date;
type IdFactory = () => string;

type CreateEvidenceDependencies = {
  repository: EvidenceRepositoryPort;
  telemetry: TelemetryPort;
  createId: IdFactory;
  now: Clock;
};

type ListEvidenceDependencies = {
  repository: EvidenceRepositoryPort;
};

type CreateEvidenceResult =
  | { ok: true; record: EvidenceRecord }
  | {
      ok: false;
      reason: "validation";
      errors: Partial<Record<keyof EvidenceInput, string>>;
    }
  | {
      ok: false;
      reason: "persistence";
      message: "Unable to save evidence. Please retry.";
    };

export class CreateEvidenceUseCase {
  constructor(private readonly dependencies: CreateEvidenceDependencies) {}

  async execute(input: EvidenceInput): Promise<CreateEvidenceResult> {
    await this.emit({ name: "evidence_create_started" });

    const validation = validateEvidenceInput(input);
    await this.emit({
      name: "validation_checked",
      properties: {
        valid: validation.ok
      }
    });

    if (!validation.ok) {
      await this.emit({
        name: "evidence_create_failed",
        properties: {
          reason: "validation",
          errors: validation.errors
        }
      });

      return {
        ok: false,
        reason: "validation",
        errors: validation.errors
      };
    }

    const record = createEvidenceRecord(input, {
      createId: this.dependencies.createId,
      now: this.dependencies.now
    });

    try {
      const savedRecord = await this.dependencies.repository.create(record);
      await this.emit({
        name: "evidence_create_succeeded",
        properties: {
          evidenceId: savedRecord.id,
          category: savedRecord.category,
          status: savedRecord.status
        }
      });

      return {
        ok: true,
        record: savedRecord
      };
    } catch (error) {
      await this.emit({
        name: "database_write_failed",
        properties: {
          reason: error instanceof Error ? error.message : "unknown"
        }
      });
      await this.emit({
        name: "evidence_create_failed",
        properties: {
          reason: "persistence"
        }
      });

      return {
        ok: false,
        reason: "persistence",
        message: "Unable to save evidence. Please retry."
      };
    }
  }

  private async emit(event: Omit<TelemetryEvent, "occurredAt">): Promise<void> {
    await this.dependencies.telemetry.emit({
      ...event,
      occurredAt: this.dependencies.now().toISOString()
    });
  }
}

export class ListEvidenceUseCase {
  constructor(private readonly dependencies: ListEvidenceDependencies) {}

  async execute(): Promise<{
    records: EvidenceRecord[];
    categorySummary: ReturnType<typeof summarizeEvidenceCategories>;
  }> {
    const records = await this.dependencies.repository.list();

    return {
      records,
      categorySummary: summarizeEvidenceCategories(records)
    };
  }
}

export type { EvidenceRepositoryPort, TelemetryPort };
