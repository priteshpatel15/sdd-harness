import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempProject, TempProject } from "../helpers/temp-project";
import { runCli } from "../../src/interfaces/cli/main";

describe("brownfield discovery and changelog", () => {
  let project: TempProject;
  let stdout: string[];
  let stderr: string[];

  beforeEach(async () => {
    project = await createTempProject();
    stdout = [];
    stderr = [];
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it("discovers brownfield project signals", async () => {
    await project.write("README.md", "# Legacy App\n\nStakeholder notes");
    await project.write("TODO.md", "- Feedback form");
    await project.write("package.json", JSON.stringify({ scripts: { test: "vitest", "test:e2e": "playwright test --reporter=json" } }));
    await project.write("src/routes/home.tsx", "export const home = true;");
    await project.write("src/db/migrations/001.sql", "create table test(id integer);");
    await project.write("tests/app.test.ts", "test('x', () => {});");

    const exitCode = await runCli(["brownfield", "discover", "--project", project.root], io());

    expect(exitCode).toBe(0);
    const profile = JSON.parse(await project.read(".sdd/brownfield-profile.json")) as {
      languages: string[];
      routes: string[];
      databaseFiles: string[];
      packageScriptCommands?: Record<string, string>;
      testCommandCandidates?: { name: string; command: string }[];
      routeSummaries?: { path: string; summary: string }[];
      databaseSchemaSummaries?: { path: string; summary: string }[];
      uiEntryCandidates?: string[];
    };
    expect(profile.languages).toContain("TypeScript");
    expect(profile.routes).toContain("src/routes/home.tsx");
    expect(profile.databaseFiles).toContain("src/db/migrations/001.sql");
    expect(profile.packageScriptCommands?.["test:e2e"]).toBe("playwright test --reporter=json");
    expect(profile.testCommandCandidates?.map((candidate) => candidate.name)).toContain("test:e2e");
    expect(profile.routeSummaries?.map((summary) => summary.path)).toContain("src/routes/home.tsx");
    expect(profile.databaseSchemaSummaries?.map((summary) => summary.path)).toContain("src/db/migrations/001.sql");
  });

  it("builds changelog from telemetry when git history is unavailable", async () => {
    await runCli([
      "jtbd", "intake",
      "--project", project.root,
      "--product", "SpecPilot",
      "--audience", "Developers",
      "--problem", "Specs drift",
      "--job", "Keep specs and code aligned"
    ], io());

    const exitCode = await runCli(["changelog", "update", "--project", project.root], io());

    expect(exitCode).toBe(0);
    await expect(project.read("CHANGELOG.md")).resolves.toContain("Run jtbd intake");
  });

  it("creates research backlog artifacts", async () => {
    const exitCode = await runCli([
      "research", "backlog",
      "--project", project.root,
      "--question", "Should we expose an ACP adapter?",
      "--context", "Agent portability matters",
      "--priority", "high"
    ], io());

    expect(exitCode).toBe(0);
    expect(stdout.join("\n")).toContain("Created research backlog item");
  });

  function io() {
    return {
      cwd: process.cwd(),
      stdout: (message: string) => stdout.push(message),
      stderr: (message: string) => stderr.push(message)
    };
  }
});
