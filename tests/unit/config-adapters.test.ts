import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ConfigDocsLookup } from "../../src/adapters/docs/config-docs-lookup";
import { ConfigIssueTracker } from "../../src/adapters/issues/config-issue-tracker";
import { NodeFileSystem } from "../../src/adapters/fs/node-file-system";

describe("config-backed optional adapters", () => {
  const fs = new NodeFileSystem();

  it("filters docs lookup entries by query", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-docs-adapter-"));
    await mkdir(path.join(root, ".sdd"), { recursive: true });
    await writeFile(path.join(root, ".sdd", "docs-lookup.json"), JSON.stringify({
      docs: [
        { title: "Playwright flows", url: "https://example.test/playwright", summary: "UI workflow coverage", tags: ["ui"] },
        { title: "Database verifier", url: "https://example.test/db", summary: "Mutation proof", tags: ["database"] }
      ]
    }));

    const result = await new ConfigDocsLookup(fs, root).findRelevantDocs("playwright coverage");

    expect(result).toEqual([{ title: "Playwright flows", url: "https://example.test/playwright", summary: "UI workflow coverage" }]);
    await rm(root, { recursive: true, force: true });
  });

  it("lists open issue tracker items and omits closed work", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-issue-adapter-"));
    await mkdir(path.join(root, ".sdd"), { recursive: true });
    await writeFile(path.join(root, ".sdd", "issue-tracker.json"), JSON.stringify({
      items: [
        { id: "ISSUE-1", title: "Open policy gap", status: "open", url: "https://example.test/1" },
        { id: "ISSUE-2", title: "Closed policy gap", status: "closed", url: "https://example.test/2" },
        { id: "ISSUE-3", title: "Untriaged policy gap" }
      ]
    }));

    const result = await new ConfigIssueTracker(fs, root).listOpenItems(root);

    expect(result).toEqual([
      { id: "ISSUE-1", title: "Open policy gap", url: "https://example.test/1" },
      { id: "ISSUE-3", title: "Untriaged policy gap", url: undefined }
    ]);
    await rm(root, { recursive: true, force: true });
  });
});
