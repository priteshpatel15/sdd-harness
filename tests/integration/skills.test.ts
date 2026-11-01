import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createTempProject, TempProject } from "../helpers/temp-project";
import { runCli } from "../../src/interfaces/cli/main";

const skillNames = [
  "sdd-operator",
  "jtbd-intake",
  "constitution",
  "brownfield-discovery",
  "feature-spec",
  "semantic-contract",
  "spec-validator",
  "tdd-implement",
  "validation-runner",
  "deep-review",
  "semantic-verify",
  "replan",
  "changelog",
  "mvp-planner",
  "research-backlog"
];

describe("project-local skills", () => {
  let project: TempProject;

  beforeEach(async () => {
    project = await createTempProject();
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it("are thin wrappers over the sdd CLI", async () => {
    for (const skillName of skillNames) {
      const content = await readFile(path.join(process.cwd(), "skills", skillName, "SKILL.md"), "utf8");
      expect(content).toContain(`name: ${skillName}`);
      expect(content).toContain("sdd ");
      expect(content).not.toContain("[TODO");
    }
  });

  it("validates skill wrappers through the CLI", async () => {
    for (const skillName of skillNames) {
      await project.write(path.join("skills", skillName, "SKILL.md"), `---\nname: ${skillName}\n---\n\nRun \`sdd workflow status\`.\n`);
    }

    const stdout: string[] = [];
    const stderr: string[] = [];
    const exitCode = await runCli(["skill", "validate", "--project", project.root], {
      cwd: process.cwd(),
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message)
    });

    expect(stderr).toEqual([]);
    expect(exitCode).toBe(0);
    expect(stdout.join("\n")).toContain("Validated 15 skill wrapper");
    await expect(project.read(".sdd/workflow-state.json")).resolves.toContain("create-auto-workflow-with-skills");
  });
});
