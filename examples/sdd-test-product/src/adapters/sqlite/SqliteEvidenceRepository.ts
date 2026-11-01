import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { EvidenceRepositoryPort } from "../../application/evidence/ports";
import type { EvidenceCategory, EvidenceRecord, EvidenceStatus } from "../../domain/evidence";

type SqliteEvidenceRepositoryOptions = {
  databasePath: string;
  failWrites?: boolean;
};

type SqliteEvidenceRow = {
  id: string;
  title: string;
  category: EvidenceCategory;
  status: EvidenceStatus;
  created_at: string;
};

export class SqliteEvidenceRepository implements EvidenceRepositoryPort {
  private constructor(
    private readonly database: DatabaseSync,
    public readonly databasePath: string,
    private failWrites: boolean
  ) {}

  static async open(options: SqliteEvidenceRepositoryOptions): Promise<SqliteEvidenceRepository> {
    await mkdir(path.dirname(options.databasePath), { recursive: true });
    const database = new DatabaseSync(options.databasePath);

    return new SqliteEvidenceRepository(database, options.databasePath, options.failWrites ?? false);
  }

  async migrate(): Promise<void> {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  async create(record: EvidenceRecord): Promise<EvidenceRecord> {
    if (this.failWrites) {
      throw new Error("simulated SQLite write failure");
    }

    this.database
      .prepare(
        `
          INSERT INTO evidence (id, title, category, status, created_at)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(record.id, record.title, record.category, record.status, record.createdAt);

    return record;
  }

  async list(): Promise<EvidenceRecord[]> {
    const rows = this.database
      .prepare(
        `
          SELECT id, title, category, status, created_at
          FROM evidence
          ORDER BY created_at ASC, id ASC
        `
      )
      .all() as SqliteEvidenceRow[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      status: row.status,
      createdAt: row.created_at
    }));
  }

  async replaceAll(records: EvidenceRecord[]): Promise<void> {
    this.database.exec("DELETE FROM evidence;");

    for (const record of records) {
      await this.create(record);
    }
  }

  setFailWrites(enabled: boolean): void {
    this.failWrites = enabled;
  }

  async close(): Promise<void> {
    this.database.close();
  }
}
