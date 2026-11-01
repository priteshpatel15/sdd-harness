import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const isolatedRoot = path.resolve(
  ".sdd/evidence/2026-05-26-workflow-evidence-dashboard/group-1-tests-first/test-db/integration"
);

async function freshWorkspace(name: string): Promise<{
  databasePath: string;
  telemetryPath: string;
}> {
  const workspace = path.join(isolatedRoot, name);
  await rm(workspace, { recursive: true, force: true });
  await mkdir(workspace, { recursive: true });
  return {
    databasePath: path.join(workspace, "evidence.sqlite"),
    telemetryPath: path.join(workspace, "telemetry.jsonl")
  };
}

async function loadSqliteAdapter() {
  return import("../../src/adapters/sqlite/SqliteEvidenceRepository");
}

async function loadTelemetryAdapter() {
  return import("../../src/adapters/telemetry/JsonlTelemetrySink");
}

async function loadUseCases() {
  return import("../../src/application/evidence/use-cases");
}

describe("SQLite evidence repository and JSONL telemetry adapters", () => {
  it("migrates an isolated SQLite test database and persists records across repository instances", async () => {
    const { databasePath } = await freshWorkspace("persists-records");
    const { SqliteEvidenceRepository } = await loadSqliteAdapter();

    const repository = await SqliteEvidenceRepository.open({ databasePath });
    await repository.migrate();
    await repository.create({
      id: "evd-sqlite-001",
      title: "SQLite repository red test",
      category: "database",
      status: "failing",
      createdAt: "2026-05-26T03:15:00.000Z"
    });
    await repository.close();

    const header = await readFile(databasePath, { encoding: "utf8" });
    expect(header.slice(0, 15)).toBe("SQLite format 3");

    const reopened = await SqliteEvidenceRepository.open({ databasePath });
    const records = await reopened.list();
    await reopened.close();

    expect(records).toEqual([
      {
        id: "evd-sqlite-001",
        title: "SQLite repository red test",
        category: "database",
        status: "failing",
        createdAt: "2026-05-26T03:15:00.000Z"
      }
    ]);
  });

  it("uses the real adapters through application ports and writes structured telemetry", async () => {
    const { databasePath, telemetryPath } = await freshWorkspace("application-with-adapters");
    const { SqliteEvidenceRepository } = await loadSqliteAdapter();
    const { JsonlTelemetrySink } = await loadTelemetryAdapter();
    const { CreateEvidenceUseCase, ListEvidenceUseCase } = await loadUseCases();

    const repository = await SqliteEvidenceRepository.open({ databasePath });
    await repository.migrate();
    const telemetry = new JsonlTelemetrySink({ filePath: telemetryPath });
    const createEvidence = new CreateEvidenceUseCase({
      repository,
      telemetry,
      createId: () => "evd-real-ports-001",
      now: () => new Date("2026-05-26T03:16:00.000Z")
    });

    const createResult = await createEvidence.execute({
      title: "Application calls SQLite and telemetry ports",
      category: "integration",
      status: "passing"
    });
    const listResult = await new ListEvidenceUseCase({ repository }).execute();
    await repository.close();

    expect(createResult.ok).toBe(true);
    expect(listResult.records).toHaveLength(1);
    expect(listResult.records[0]).toMatchObject({
      id: "evd-real-ports-001",
      category: "integration",
      status: "passing"
    });

    const telemetryLines = (await readFile(telemetryPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(telemetryLines.map((event) => event.name)).toEqual([
      "evidence_create_started",
      "validation_checked",
      "evidence_create_succeeded"
    ]);
    expect(telemetryLines.at(-1)).toMatchObject({
      name: "evidence_create_succeeded",
      occurredAt: "2026-05-26T03:16:00.000Z",
      properties: {
        evidenceId: "evd-real-ports-001",
        category: "integration",
        status: "passing"
      }
    });
  });

  it("simulates repository write failure without leaving a successful row behind", async () => {
    const { databasePath, telemetryPath } = await freshWorkspace("simulated-write-failure");
    const { SqliteEvidenceRepository } = await loadSqliteAdapter();
    const { JsonlTelemetrySink } = await loadTelemetryAdapter();
    const { CreateEvidenceUseCase, ListEvidenceUseCase } = await loadUseCases();

    const repository = await SqliteEvidenceRepository.open({
      databasePath,
      failWrites: true
    });
    await repository.migrate();
    const telemetry = new JsonlTelemetrySink({ filePath: telemetryPath });
    const createEvidence = new CreateEvidenceUseCase({
      repository,
      telemetry,
      createId: () => "evd-rejected-001",
      now: () => new Date("2026-05-26T03:17:00.000Z")
    });

    const createResult = await createEvidence.execute({
      title: "Rejected write should not be listed",
      category: "database",
      status: "failing"
    });
    const listResult = await new ListEvidenceUseCase({ repository }).execute();
    await repository.close();

    expect(createResult).toEqual({
      ok: false,
      reason: "persistence",
      message: "Unable to save evidence. Please retry."
    });
    expect(listResult.records).toEqual([]);

    const telemetryNames = (await readFile(telemetryPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line).name);
    expect(telemetryNames).toEqual([
      "evidence_create_started",
      "validation_checked",
      "database_write_failed",
      "evidence_create_failed"
    ]);
  });
});
