import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { UserQuestionPort } from "../../application/ports";
import { InterviewAnswers } from "../../domain/models";
import { ValidationError } from "../../domain/errors";

export class NodeCliQuestionAdapter implements UserQuestionPort {
  public async askGroupedQuestions(request: {
    readonly workflow: string;
    readonly promptId?: string;
    readonly promptHash?: string;
    readonly questions: readonly { readonly id: keyof InterviewAnswers; readonly prompt: string }[];
  }): Promise<InterviewAnswers> {
    if (!input.isTTY) {
      throw new ValidationError("Question capture requires --answer key=value when stdin is not interactive.");
    }

    const readline = createInterface({ input, output });
    try {
      const answers: Record<string, string> = {};
      for (const question of request.questions) {
        const answer = await readline.question(`${question.prompt}\n> `);
        if (answer.trim().length === 0) {
          throw new ValidationError(`Question capture requires an answer for ${request.workflow}: ${String(question.id)}.`);
        }
        answers[question.id] = answer.trim();
      }
      return answers as InterviewAnswers;
    } finally {
      readline.close();
    }
  }
}
