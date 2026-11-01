import path from "node:path";
import { ClockPort, FileSystemPort, TelemetrySink, WorkflowStatePort } from "../ports";
import { traceUseCase } from "./common";

const SECTION_HEADING = "## Stakeholder Thoughts";

export class SetupStakeholdersUseCase {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly product?: string; readonly thoughts?: readonly string[] }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "stakeholder setup", input, async () => {
      const readmePath = path.join(this.projectRoot, "README.md");
      const existing = (await this.fs.exists(readmePath)) ? await this.fs.readFile(readmePath) : `# ${input.product ?? "Product"}\n`;
      const thoughts = input.thoughts?.length ? input.thoughts : ["Add stakeholder thoughts here before creating the constitution."];
      const section = `${SECTION_HEADING}\n\n${thoughts.map((thought) => `- ${thought}`).join("\n")}\n`;
      const content = existing.includes(SECTION_HEADING)
        ? existing.replace(new RegExp(`${escapeRegExp(SECTION_HEADING)}[\\s\\S]*?(?=\\n##\\s+|$)`), section.trimEnd())
        : `${existing.trimEnd()}\n\n${section}`;

      await this.fs.writeFile(readmePath, content.endsWith("\n") ? content : `${content}\n`);
      await this.workflow.updateStep("setup-stakeholder-thoughts", {
        status: "complete",
        evidence: ["README.md"]
      });
      await this.workflow.updateStep("create-constitution", { status: "ready" });

      return { result: { path: readmePath }, outputs: { path: readmePath } };
    });
  }
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
