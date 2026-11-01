import path from "node:path";
import { ClockPort, FileSystemPort, TelemetrySink, WorkflowStatePort } from "../ports";
import { ValidationError } from "../../domain/errors";
import { traceUseCase } from "./common";

const REQUIRED_SKILLS = [
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

export class SkillValidateUseCase {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(): Promise<{ readonly checked: number }> {
    return traceUseCase(this.telemetry, this.clock, "skill validate", {}, async () => {
      const missing: string[] = [];
      const notDelegating: string[] = [];
      for (const skill of REQUIRED_SKILLS) {
        const skillPath = path.join(this.projectRoot, "skills", skill, "SKILL.md");
        if (!(await this.fs.exists(skillPath))) {
          missing.push(skill);
          continue;
        }
        const content = await this.fs.readFile(skillPath);
        if (!/\bsdd\s+/.test(content)) {
          notDelegating.push(skill);
        }
      }

      if (missing.length > 0 || notDelegating.length > 0) {
        throw new ValidationError(`Skill validation failed. Missing: ${missing.join(", ") || "none"}. Not delegating to sdd: ${notDelegating.join(", ") || "none"}.`);
      }

      await this.workflow.updateStep("create-auto-workflow-with-skills", {
        status: "complete",
        evidence: REQUIRED_SKILLS.map((skill) => `skills/${skill}/SKILL.md`)
      });
      return { result: { checked: REQUIRED_SKILLS.length }, outputs: { checked: REQUIRED_SKILLS.length } };
    });
  }
}

export class SkillScaffoldUseCase {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly name: string; readonly command: string; readonly description?: string }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "skill scaffold", input, async () => {
      if (input.name.trim().length === 0 || input.command.trim().length === 0) {
        throw new ValidationError("Skill scaffold requires --name and --command.");
      }
      const skillPath = path.join(this.projectRoot, "skills", input.name, "SKILL.md");
      const content = `# ${input.name}

${input.description ?? "Thin SDD workflow wrapper."}

## Workflow

1. Gather only the context needed for this workflow.
2. Persist grouped question evidence when the workflow requires it.
3. Delegate business rules to the CLI:

\`\`\`bash
${input.command}
\`\`\`

Do not reimplement SDD gates inside the skill. The \`sdd\` command owns validation, telemetry, workflow state, and evidence.
`;
      await this.fs.writeFile(skillPath, content);
      await this.workflow.updateStep("new-idea-skill", {
        status: "complete",
        evidence: [skillPath]
      });
      return { result: { path: skillPath }, outputs: { path: skillPath } };
    });
  }
}
