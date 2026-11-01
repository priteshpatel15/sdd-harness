import { describe, expect, it } from "vitest";

type EvidenceRecord = {
  id: string;
  title: string;
  category: "unit" | "integration" | "database" | "playwright" | "telemetry";
  status: "passing" | "failing";
  createdAt: string;
};

type TelemetryEvent = {
  name: string;
  occurredAt: string;
  properties?: Record<string, unknown>;
};

class InMemoryEvidenceRepository {
  public records: EvidenceRecord[] = [];
  public createCalls: EvidenceRecord[] = [];
  public failWrites = false;

  async create(record: EvidenceRecord): Promise<EvidenceRecord> {
    this.createCalls.push(record);
    if (this.failWrites) {
      throw new Error("simulated SQLite write failure");
    }
    this.records.push(record);
    return record;
  }

  async list(): Promise<EvidenceRecord[]> {
    return [...this.records];
  }
}

class CapturingTelemetry {
  public events: TelemetryEvent[] = [];

  async emit(event: TelemetryEvent): Promise<void> {
    this.events.push(event);
  }

  names(): string[] {
    return this.events.map((event) => event.name);
  }
}

async function loadUseCases() {
  return import("../../src/application/evidence/use-cases");
}

describe("Evidence application use cases", () => {
  it("creates evidence through a repository port and emits started, validation, and success telemetry", async () => {
    const { CreateEvidenceUseCase } = await loadUseCases();
    const repository = new InMemoryEvidenceRepository();
    const telemetry = new CapturingTelemetry();

    const useCase = new CreateEvidenceUseCase({
      repository,
      telemetry,
      createId: () => "evd-app-001",
      now: () => new Date("2026-05-26T03:10:00.000Z")
    });

    const result = await useCase.execute({
      title: "Unit test evidence",
      category: "unit",
      status: "passing"
    });

    expect(result).toEqual({
      ok: true,
      record: {
        id: "evd-app-001",
        title: "Unit test evidence",
        category: "unit",
        status: "passing",
        createdAt: "2026-05-26T03:10:00.000Z"
      }
    });
    expect(repository.createCalls).toHaveLength(1);
    expect(repository.records).toHaveLength(1);
    expect(telemetry.names()).toEqual([
      "evidence_create_started",
      "validation_checked",
      "evidence_create_succeeded"
    ]);
  });

  it("blocks invalid submissions without repository writes and returns field-level messages", async () => {
    const { CreateEvidenceUseCase } = await loadUseCases();
    const repository = new InMemoryEvidenceRepository();
    const telemetry = new CapturingTelemetry();

    const useCase = new CreateEvidenceUseCase({
      repository,
      telemetry,
      createId: () => "should-not-be-used",
      now: () => new Date("2026-05-26T03:11:00.000Z")
    });

    const result = await useCase.execute({
      title: "",
      category: "",
      status: ""
    });

    expect(result).toEqual({
      ok: false,
      reason: "validation",
      errors: {
        title: "Title is required",
        category: "Category is required",
        status: "Status is required"
      }
    });
    expect(repository.createCalls).toHaveLength(0);
    expect(repository.records).toHaveLength(0);
    expect(telemetry.names()).toEqual([
      "evidence_create_started",
      "validation_checked",
      "evidence_create_failed"
    ]);
    expect(telemetry.events.at(-1)?.properties).toMatchObject({ reason: "validation" });
  });

  it("surfaces persistence failures without adding a saved record", async () => {
    const { CreateEvidenceUseCase } = await loadUseCases();
    const repository = new InMemoryEvidenceRepository();
    repository.failWrites = true;
    const telemetry = new CapturingTelemetry();

    const useCase = new CreateEvidenceUseCase({
      repository,
      telemetry,
      createId: () => "evd-fail-001",
      now: () => new Date("2026-05-26T03:12:00.000Z")
    });

    const result = await useCase.execute({
      title: "SQLite adapter outage",
      category: "database",
      status: "failing"
    });

    expect(result).toEqual({
      ok: false,
      reason: "persistence",
      message: "Unable to save evidence. Please retry."
    });
    expect(repository.createCalls).toHaveLength(1);
    expect(repository.records).toHaveLength(0);
    expect(telemetry.names()).toEqual([
      "evidence_create_started",
      "validation_checked",
      "database_write_failed",
      "evidence_create_failed"
    ]);
  });

  it("lists evidence with reviewer category summaries", async () => {
    const { ListEvidenceUseCase } = await loadUseCases();
    const repository = new InMemoryEvidenceRepository();
    repository.records = [
      {
        id: "evd-int",
        title: "Integration coverage",
        category: "integration",
        status: "passing",
        createdAt: "2026-05-26T03:13:00.000Z"
      },
      {
        id: "evd-tel",
        title: "Telemetry capture",
        category: "telemetry",
        status: "passing",
        createdAt: "2026-05-26T03:14:00.000Z"
      }
    ];

    const useCase = new ListEvidenceUseCase({ repository });

    const result = await useCase.execute();

    expect(result.records.map((record: EvidenceRecord) => record.id)).toEqual([
      "evd-int",
      "evd-tel"
    ]);
    expect(result.categorySummary).toEqual([
      { category: "unit", represented: false, latestStatus: "missing", count: 0 },
      { category: "integration", represented: true, latestStatus: "passing", count: 1 },
      { category: "database", represented: false, latestStatus: "missing", count: 0 },
      { category: "playwright", represented: false, latestStatus: "missing", count: 0 },
      { category: "telemetry", represented: true, latestStatus: "passing", count: 1 }
    ]);
  });

  it("returns an empty evidence list with every required category marked missing", async () => {
    const { ListEvidenceUseCase } = await loadUseCases();
    const repository = new InMemoryEvidenceRepository();

    const result = await new ListEvidenceUseCase({ repository }).execute();

    expect(result.records).toEqual([]);
    expect(result.categorySummary).toEqual([
      { category: "unit", represented: false, latestStatus: "missing", count: 0 },
      { category: "integration", represented: false, latestStatus: "missing", count: 0 },
      { category: "database", represented: false, latestStatus: "missing", count: 0 },
      { category: "playwright", represented: false, latestStatus: "missing", count: 0 },
      { category: "telemetry", represented: false, latestStatus: "missing", count: 0 }
    ]);
  });
});
