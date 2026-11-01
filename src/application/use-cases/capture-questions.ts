import path from "node:path";
import { createHash } from "node:crypto";
import { ClockPort, FileSystemPort, PromptCatalogPort, TelemetrySink, UserQuestionPort, WorkflowStatePort } from "../ports";
import { InterviewAnswers, PromptId, QuestionEvidence, QuestionWorkflow } from "../../domain/models";
import { getPromptTemplate } from "../../domain/prompt-catalog";
import { ValidationError } from "../../domain/errors";
import { traceUseCase } from "./common";

export class CaptureQuestionsUseCase {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly promptCatalog: PromptCatalogPort,
    private readonly questions: UserQuestionPort,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly workflow: QuestionWorkflow;
    readonly output: string;
    readonly source?: QuestionEvidence["source"];
  }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "questions capture", input, async () => {
      const promptId = promptIdForWorkflow(input.workflow);
      const template = this.promptCatalog.get(promptId) ?? getPromptTemplate(promptId);
      if (template === undefined) {
        throw new ValidationError(`No canonical prompt exists for workflow '${input.workflow}'.`);
      }
      if (template.requiredGroupedQuestions.length === 0) {
        throw new ValidationError(`Workflow '${input.workflow}' does not define grouped questions.`);
      }

      const answers = await this.questions.askGroupedQuestions({
        workflow: input.workflow,
        promptId,
        promptHash: hashPromptTemplate(template),
        questions: template.requiredGroupedQuestions.map((id) => ({
          id,
          prompt: `${template.title}: ${String(id)}`
        }))
      });
      const evidence: QuestionEvidence = {
        id: `${input.workflow}-questions-${this.clock.now().toISOString()}`,
        workflow: input.workflow,
        promptId,
        promptHash: hashPromptTemplate(template),
        source: input.source ?? "manual",
        createdAt: this.clock.now().toISOString(),
        questions: template.requiredGroupedQuestions.map((id) => ({
          id,
          prompt: `${template.title}: ${String(id)}`,
          answer: String(answers[id] ?? "")
        })),
        answers: answersFor(template.requiredGroupedQuestions, answers)
      };

      const outputPath = path.resolve(this.projectRoot, input.output);
      await this.fs.writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
      await this.workflow.appendQuestionEvidence(evidence);
      return {
        result: { path: outputPath },
        outputs: { path: outputPath, workflow: input.workflow, promptId }
      };
    });
  }
}

function answersFor(keys: readonly (keyof InterviewAnswers)[], answers: InterviewAnswers): InterviewAnswers {
  return Object.fromEntries(keys.map((key) => [key, answers[key]])) as InterviewAnswers;
}

function promptIdForWorkflow(workflow: QuestionWorkflow): PromptId {
  if (workflow === "constitution") return "constitution.create";
  if (workflow === "semantic-contract") return "feature.semantics";
  if (workflow === "mvp") return "mvp.plan";
  return "feature.create";
}

function hashPromptTemplate(template: unknown): string {
  return createHash("sha256").update(JSON.stringify(template)).digest("hex");
}
