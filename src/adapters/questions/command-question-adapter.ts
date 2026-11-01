import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { FileSystemPort, UserQuestionPort } from "../../application/ports";
import { InterviewAnswers } from "../../domain/models";
import { ValidationError } from "../../domain/errors";
import { renderCommandTemplate, parseAgentJson } from "../commands/command-utils";
import { slugify } from "../../domain/slug";

const execAsync = promisify(exec);

interface QuestionAdapterConfig {
  readonly commandTemplate?: string;
  readonly timeoutMs?: number;
}

export class CommandQuestionAdapter implements UserQuestionPort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string
  ) {}

  public async isConfigured(): Promise<boolean> {
    const config = await this.readConfig();
    return config.commandTemplate !== undefined && config.commandTemplate.trim().length > 0;
  }

  public async askGroupedQuestions(input: {
    readonly workflow: string;
    readonly promptId?: string;
    readonly promptHash?: string;
    readonly questions: readonly { readonly id: keyof InterviewAnswers; readonly prompt: string }[];
  }): Promise<InterviewAnswers> {
    const config = await this.readConfig();
    if (config.commandTemplate === undefined || config.commandTemplate.trim().length === 0) {
      throw new ValidationError("Question adapter is not configured. Add .sdd/user-question-adapter.json.");
    }

    const runRoot = path.join(this.projectRoot, ".sdd", "question-capture", `${Date.now()}-${slugify(input.workflow)}`);
    const promptFile = path.join(runRoot, "prompt.json");
    const outputFile = path.join(runRoot, "answers.json");
    await this.fs.writeFile(promptFile, `${JSON.stringify({
      workflow: input.workflow,
      promptId: input.promptId,
      promptHash: input.promptHash,
      questions: input.questions
    }, null, 2)}\n`);

    const command = renderCommandTemplate(config.commandTemplate, {
      workflow: input.workflow,
      promptFile,
      outputFile,
      projectRoot: this.projectRoot,
      promptId: input.promptId ?? ""
    });

    try {
      await execAsync(command, {
        cwd: this.projectRoot,
        timeout: config.timeoutMs ?? 600000,
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (error) {
      const execError = error as { readonly code?: number; readonly stdout?: string; readonly stderr?: string; readonly message?: string };
      throw new ValidationError(`Question adapter command failed with exit code ${execError.code ?? 1}: ${execError.stderr || execError.stdout || execError.message || "unknown error"}`);
    }

    const rawOutput = await this.readOutput(outputFile);
    const parsed = parseAgentJson(rawOutput) as { readonly answers?: InterviewAnswers };
    const answers = parsed.answers;
    if (answers === undefined || typeof answers !== "object") {
      throw new ValidationError("Question adapter output must be JSON with an answers object.");
    }
    const missing = input.questions
      .map((question) => question.id)
      .filter((id) => {
        const answer = answers[id];
        return typeof answer !== "string" || answer.trim().length === 0;
      });
    if (missing.length > 0) {
      throw new ValidationError(`Question adapter output is missing required answers for ${input.workflow}: ${missing.join(", ")}.`);
    }
    return Object.fromEntries(input.questions.map((question) => [question.id, answers[question.id]])) as InterviewAnswers;
  }

  private async readOutput(outputFile: string): Promise<string> {
    if (!(await this.fs.exists(outputFile))) {
      throw new ValidationError(`Question adapter did not write output file: ${path.relative(this.projectRoot, outputFile)}.`);
    }
    return this.fs.readFile(outputFile);
  }

  private async readConfig(): Promise<QuestionAdapterConfig> {
    const configPath = path.join(this.projectRoot, ".sdd", "user-question-adapter.json");
    if (!(await this.fs.exists(configPath))) {
      return {};
    }
    return JSON.parse(await this.fs.readFile(configPath)) as QuestionAdapterConfig;
  }
}
