import { UserQuestionPort } from "../../application/ports";
import { InterviewAnswers } from "../../domain/models";
import { ValidationError } from "../../domain/errors";

export class ProvidedQuestionAdapter implements UserQuestionPort {
  public constructor(private readonly answers: InterviewAnswers) {}

  public async askGroupedQuestions(input: {
    readonly workflow: string;
    readonly promptId?: string;
    readonly promptHash?: string;
    readonly questions: readonly { readonly id: keyof InterviewAnswers; readonly prompt: string }[];
  }): Promise<InterviewAnswers> {
    const missing = input.questions
      .map((question) => question.id)
      .filter((id) => {
        const answer = this.answers[id];
        return typeof answer !== "string" || answer.trim().length === 0;
      });

    if (missing.length > 0) {
      throw new ValidationError(`Question capture requires answers for ${input.workflow}: ${missing.join(", ")}.`);
    }

    return Object.fromEntries(input.questions.map((question) => [question.id, this.answers[question.id]])) as InterviewAnswers;
  }
}
