import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

describe("close harness gaps evidence", () => {
  const root = process.cwd();
  const featureId = "2026-05-25-close-harness-gaps";

  it("group-1-dogfood-artifacts keeps real spec and semantic artifacts", async () => {
    const contract = JSON.parse(await readFile(path.join(root, ".sdd", "semantic-contracts", `${featureId}.json`), "utf8")) as {
      readonly sourceHash?: string;
    };
    const semantics = await readFile(path.join(root, "specs", featureId, "semantics.md"), "utf8");

    expect(contract.sourceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(semantics).toContain(`# Semantics: ${featureId}`);
    expect(semantics).not.toContain("Source Hash: pending");
  });

  it("group-2-strict-gates has strict validation and local command-backed adapters", async () => {
    const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as {
      readonly scripts?: Record<string, string>;
    };
    const reviewAgents = JSON.parse(await readFile(path.join(root, ".sdd", "review-agents.json"), "utf8")) as {
      readonly commandTemplate?: string;
    };
    const semanticVerifiers = JSON.parse(await readFile(path.join(root, ".sdd", "semantic-verifiers.json"), "utf8")) as {
      readonly commandTemplate?: string;
    };
    const databaseVerifier = JSON.parse(await readFile(path.join(root, ".sdd", "database-mutation-verifier.json"), "utf8")) as {
      readonly commandTemplate?: string;
    };

    expect(packageJson.scripts?.["test:e2e"]).toContain("playwright test");
    expect(reviewAgents.commandTemplate).toContain("scripts/sdd-review-agent.mjs");
    expect(semanticVerifiers.commandTemplate).toContain("scripts/sdd-semantic-verifier.mjs");
    expect(databaseVerifier.commandTemplate).toContain("scripts/sdd-database-mutation-verifier.mjs");
  });

  it("group-3-quality-policies records current approvals with real SHA-256 hashes", async () => {
    const approvals = (await readFile(path.join(root, ".sdd", "approvals.jsonl"), "utf8"))
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line) as {
        readonly target?: string;
        readonly featureId?: string;
        readonly fileHashes?: Record<string, string>;
      })
      .filter((record) => record.target === "feature" && record.featureId === featureId);

    const latest = approvals.at(-1);
    const hashes = Object.values(latest?.fileHashes ?? {});
    expect(latest).toBeDefined();
    expect(hashes.length).toBeGreaterThan(0);
    expect(hashes.every((hash) => /^[a-f0-9]{64}$/.test(hash))).toBe(true);
  });

  it("remaining gap closure documents adapter contracts and completes phase 2", async () => {
    const contracts = await readFile(path.join(root, "docs", "adapter-contracts.md"), "utf8");
    const roadmap = await readFile(path.join(root, "specs", "roadmap.md"), "utf8");

    expect(contracts).toContain(".sdd/ui-inventory.json");
    expect(contracts).toContain("SDD_EXPECTED_MUTATIONS_FILE");
    expect(roadmap).toContain("- [x] Continue extracting reusable adapter utilities behind ports");
    expect(roadmap).toContain("- [x] Document compatibility contracts for adapter authors");
  });
});
