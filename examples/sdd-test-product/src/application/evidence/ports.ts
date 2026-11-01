import type { EvidenceRecord } from "../../domain/evidence";

export type TelemetryEvent = {
  name: string;
  occurredAt: string;
  properties?: Record<string, unknown>;
};

export interface EvidenceRepositoryPort {
  create(record: EvidenceRecord): Promise<EvidenceRecord>;
  list(): Promise<EvidenceRecord[]>;
}

export interface TelemetryPort {
  emit(event: TelemetryEvent): Promise<void>;
}
