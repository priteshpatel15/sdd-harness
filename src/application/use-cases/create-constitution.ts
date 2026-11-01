import { validateConstitutionMarkdown } from "../../domain/spec-validation";
import { requireQuestionEvidence } from "../../domain/workflow";
import { ClockPort, FileSystemPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { assertAllGatesPass, assertValidationPasses, traceUseCase } from "./common";
import path from "node:path";
import { QuestionEvidence as QuestionEvidenceModel } from "../../domain/models";

export class CreateConstitutionUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(questionEvidence: QuestionEvidenceModel): Promise<void> {
    await traceUseCase(this.telemetry, this.clock, "constitution create", { questionEvidenceId: questionEvidence.id }, async () => {
      const gates = requireQuestionEvidence(questionEvidence, "constitution", ["mission", "targetAudience", "techStack", "roadmap"]);
      assertAllGatesPass(gates);
      const answers = questionEvidence.answers;
      const questionEvidencePath = await this.workflow.appendQuestionEvidence(questionEvidence);

      await this.store.writeConstitution({
        answers: {
          mission: answers.mission!,
          targetAudience: answers.targetAudience!,
          techStack: answers.techStack!,
          roadmap: answers.roadmap!
        },
        stakeholderNotes: await this.readStakeholderNotes(),
        packageSummary: await this.readPackageSummary()
      });

      const validationGates = validateConstitutionMarkdown(await this.store.readConstitutionFiles());
      assertValidationPasses(validationGates);
      await this.workflow.updateStep("create-constitution", {
        status: "complete",
        evidence: [questionEvidencePath, "specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md"]
      });
      await this.workflow.updateStep("validate-constitution", { status: "ready" });
      return { result: undefined, gates: [...gates, ...validationGates], outputs: { wrote: ["specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md"] } };
    });
  }

  private async readStakeholderNotes(): Promise<string> {
    const readmePath = path.join(this.projectRoot, "README.md");
    const todoPath = path.join(this.projectRoot, "TODO.md");
    const chunks: string[] = [];
    if (await this.fs.exists(readmePath)) {
      chunks.push(await this.fs.readFile(readmePath));
    }
    if (await this.fs.exists(todoPath)) {
      chunks.push(await this.fs.readFile(todoPath));
    }
    return chunks.join("\n\n");
  }

  private async readPackageSummary(): Promise<string> {
    const packagePath = path.join(this.projectRoot, "package.json");
    if (!(await this.fs.exists(packagePath))) {
      return "";
    }

    const parsed = JSON.parse(await this.fs.readFile(packagePath)) as {
      readonly scripts?: Record<string, string>;
      readonly dependencies?: Record<string, string>;
      readonly devDependencies?: Record<string, string>;
    };
    return [
      parsed.scripts !== undefined ? `Scripts: ${Object.keys(parsed.scripts).join(", ")}` : "",
      parsed.dependencies !== undefined ? `Dependencies: ${Object.keys(parsed.dependencies).join(", ")}` : "",
      parsed.devDependencies !== undefined ? `Dev dependencies: ${Object.keys(parsed.devDependencies).join(", ")}` : ""
    ].filter(Boolean).join("\n");
  }
}
