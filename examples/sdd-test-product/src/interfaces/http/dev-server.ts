import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { JsonlTelemetrySink } from "../../adapters/telemetry/JsonlTelemetrySink";
import { SqliteEvidenceRepository } from "../../adapters/sqlite/SqliteEvidenceRepository";
import { CreateEvidenceUseCase, ListEvidenceUseCase } from "../../application/evidence/use-cases";
import type { EvidenceRecord } from "../../domain/evidence";
import { renderEvidencePage } from "./evidence-page";

const databasePath = path.resolve(
  process.env.DATABASE_PATH ??
    ".sdd/evidence/2026-05-26-workflow-evidence-dashboard/group-1-tests-first/test-db/dev.sqlite"
);
const telemetryPath = path.resolve(
  process.env.TELEMETRY_PATH ??
    ".sdd/evidence/2026-05-26-workflow-evidence-dashboard/group-1-tests-first/e2e-telemetry.jsonl"
);
const port = Number(process.env.PORT ?? 4173);

type JsonValue = Record<string, unknown> | unknown[];

function sendJson(response: ServerResponse, statusCode: number, body: JsonValue): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function sendHtml(response: ServerResponse, body: string): void {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(body);
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? (JSON.parse(rawBody) as T) : ({} as T);
}

async function readTelemetryEvents(): Promise<JsonValue[]> {
  try {
    const file = await readFile(telemetryPath, "utf8");

    return file
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JsonValue);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

const repository = await SqliteEvidenceRepository.open({ databasePath });
await repository.migrate();
const telemetry = new JsonlTelemetrySink({ filePath: telemetryPath });

function createEvidenceUseCase(): CreateEvidenceUseCase {
  return new CreateEvidenceUseCase({
    repository,
    telemetry,
    createId: () => `evd-${randomUUID()}`,
    now: () => new Date()
  });
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  try {
    if (request.method === "GET" && (requestUrl.pathname === "/" || requestUrl.pathname === "/evidence")) {
      sendHtml(response, renderEvidencePage());
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/evidence") {
      const result = await new ListEvidenceUseCase({ repository }).execute();
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/evidence") {
      const body = await readJsonBody<{ title: string; category: string; status: string }>(request);
      const result = await createEvidenceUseCase().execute({
        title: body.title ?? "",
        category: body.category ?? "",
        status: body.status ?? ""
      });

      sendJson(response, result.ok ? 201 : result.reason === "validation" ? 400 : 500, result);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/test-controls/evidence/reset") {
      const body = await readJsonBody<{ records?: EvidenceRecord[] }>(request);
      const records = body.records ?? [];
      repository.setFailWrites(false);
      await repository.replaceAll(records);
      await rm(telemetryPath, { force: true });
      sendJson(response, 200, {
        databasePath,
        recordCount: records.length
      });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/test-controls/evidence") {
      sendJson(response, 200, {
        databasePath,
        records: await repository.list()
      });
      return;
    }

    if (
      request.method === "POST" &&
      requestUrl.pathname === "/api/test-controls/persistence-failure"
    ) {
      const body = await readJsonBody<{ enabled?: boolean }>(request);
      repository.setFailWrites(body.enabled === true);
      sendJson(response, 200, { enabled: body.enabled === true });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/test-controls/telemetry") {
      sendJson(response, 200, {
        events: await readTelemetryEvents()
      });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Workflow Evidence Dashboard listening on http://127.0.0.1:${port}/evidence`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await repository.close();
    server.close(() => process.exit(0));
  });
}
