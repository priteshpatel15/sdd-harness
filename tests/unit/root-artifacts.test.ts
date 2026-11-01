import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateConstitutionMarkdown, validateFeatureMarkdown } from "../../src/domain/spec-validation";

describe("root SDD artifacts", () => {
  it("keeps canonical project and close-gaps feature specs present and valid", async () => {
    const root = process.cwd();
    const mission = await readFile(path.join(root, "specs", "mission.md"), "utf8");
    const techStack = await readFile(path.join(root, "specs", "tech-stack.md"), "utf8");
    const roadmap = await readFile(path.join(root, "specs", "roadmap.md"), "utf8");
    const requirements = await readFile(path.join(root, "specs", "2026-05-25-close-harness-gaps", "requirements.md"), "utf8");
    const plan = await readFile(path.join(root, "specs", "2026-05-25-close-harness-gaps", "plan.md"), "utf8");
    const validation = await readFile(path.join(root, "specs", "2026-05-25-close-harness-gaps", "validation.md"), "utf8");

    expect(await readFile(path.join(root, "README.md"), "utf8")).toContain("SDD Harness");
    expect(await readFile(path.join(root, "CHANGELOG.md"), "utf8")).toContain("2026-05-25");
    expect(validateConstitutionMarkdown({ mission, techStack, roadmap }).every((gate) => gate.passed)).toBe(true);
    expect(validateFeatureMarkdown({ requirements, plan, validation }).every((gate) => gate.passed)).toBe(true);
  });
});
