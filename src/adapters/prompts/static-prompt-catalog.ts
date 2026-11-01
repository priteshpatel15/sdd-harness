import { PromptCatalogPort } from "../../application/ports";
import { PromptId, PromptRenderContext, PromptTemplate } from "../../domain/models";
import { getPromptTemplate, PROMPT_TEMPLATES, renderPromptTemplate } from "../../domain/prompt-catalog";

export class StaticPromptCatalog implements PromptCatalogPort {
  public list(): readonly PromptTemplate[] {
    return PROMPT_TEMPLATES;
  }

  public get(id: PromptId): PromptTemplate | undefined {
    return getPromptTemplate(id);
  }

  public render(input: PromptRenderContext): string {
    const template = this.get(input.promptId);
    if (template === undefined) {
      throw new Error(`Unknown prompt '${input.promptId}'.`);
    }
    return renderPromptTemplate(template, input);
  }
}
