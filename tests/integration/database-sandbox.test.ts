import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempProject, TempProject } from "../helpers/temp-project";
import { FileDatabaseSandbox } from "../../src/adapters/database/file-database-sandbox";
import { NodeFileSystem } from "../../src/adapters/fs/node-file-system";

describe("database sandbox adapter", () => {
  let project: TempProject;

  beforeEach(async () => {
    project = await createTempProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it("creates and cleans up a command-backed sandbox from .sdd/database-sandbox.json", async () => {
    await project.write("scripts/prepare-db.js", "const path = require('path'); const fs = require('fs'); const db = path.join(process.cwd(), 'sandbox.sqlite'); fs.writeFileSync(db, 'sandbox'); console.log(db);\n");
    await project.write("scripts/cleanup-db.js", "const fs = require('fs'); fs.writeFileSync('cleanup.txt', 'done');\n");
    await project.write(".sdd/database-sandbox.json", JSON.stringify({
      prepareCommand: "node scripts/prepare-db.js",
      cleanupCommand: "node scripts/cleanup-db.js",
      databaseUrlEnv: "DATABASE_URL"
    }));

    const sandbox = new FileDatabaseSandbox(new NodeFileSystem());
    const result = await sandbox.createConfiguredSandbox({ projectRoot: project.root });

    expect(result?.label.endsWith("sandbox.sqlite")).toBe(true);
    expect(result?.env.DATABASE_URL).toBe(result?.label);
    expect(result?.env.SDD_TEST_DATABASE).toBe(result?.label);
    expect(result?.evidencePath).toContain(".sdd/evidence");

    const cleanup = await sandbox.cleanupConfiguredSandbox({ projectRoot: project.root });
    expect(cleanup?.evidencePath).toContain(".sdd/evidence");
    await expect(project.read("cleanup.txt")).resolves.toBe("done");
  });
});
