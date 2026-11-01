import path from "node:path";
import { PromptId, PromptTemplate, ReviewLens } from "../../domain/models";
import { ClockPort, FileSystemPort, PromptCatalogPort, SpecStorePort, TelemetrySink } from "../ports";
import { ValidationError } from "../../domain/errors";
import { traceUseCase } from "./common";
import { slugify } from "../../domain/slug";

export class PromptUseCase {
  public constructor(
    private readonly catalog: PromptCatalogPort,
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public list(): readonly PromptTemplate[] {
    return this.catalog.list();
  }

  public show(id: PromptId): PromptTemplate {
    const template = this.catalog.get(id);
    if (template === undefined) {
      throw new ValidationError(`Unknown prompt id '${id}'.`);
    }
    return template;
  }

  public async render(input: { readonly id: PromptId; readonly featureId?: string; readonly lens?: ReviewLens | string }): Promise<{ readonly path: string; readonly content: string }> {
    return traceUseCase(this.telemetry, this.clock, "prompt render", input, async () => {
      const content = this.catalog.render({
        promptId: input.id,
        featureId: input.featureId,
        lens: input.lens as ReviewLens | undefined,
        contextFiles: await this.contextFiles(input.id, input.featureId)
      });
      const fileName = `${input.id.replace(/\./g, "-")}${input.featureId ? `-${slugify(input.featureId)}` : ""}${input.lens ? `-${slugify(input.lens)}` : ""}.md`;
      const outputPath = path.join(this.projectRoot, ".sdd", "prompts", fileName);
      await this.fs.writeFile(outputPath, content);
      return { result: { path: outputPath, content }, outputs: { path: outputPath, promptId: input.id } };
    });
  }

  private async contextFiles(id: PromptId, featureId: string | undefined): Promise<Record<string, string | undefined>> {
    const context: Record<string, string | undefined> = {};
    for (const file of ["README.md", "TODO.md", "specs/jtbd.md", "specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md", ".sdd/brownfield-profile.json", ".sdd/validation-summaries.jsonl"]) {
      context[file] = await this.readOptional(path.join(this.projectRoot, file));
    }

    if (featureId !== undefined) {
      const files = await this.store.readFeatureFiles(featureId);
      context[`specs/${featureId}/requirements.md`] = files.requirements;
      context[`specs/${featureId}/plan.md`] = files.plan;
      context[`specs/${featureId}/validation.md`] = files.validation;
      context[`specs/${featureId}/experience.md`] = await this.store.readFeatureExperience(featureId);
      const semanticFiles = await this.store.readFeatureSemanticFiles(featureId);
      context[`specs/${featureId}/semantics.md`] = semanticFiles.markdown;
      context[`.sdd/semantic-contracts/${featureId}.json`] = semanticFiles.contract === undefined ? undefined : JSON.stringify(semanticFiles.contract, null, 2);
      context[`.sdd/implementation-packets/${featureId}.md`] = await this.readOptional(path.join(this.projectRoot, ".sdd", "implementation-packets", `${featureId}.md`));
    }

    if (id === "changelog.update") {
      context["CHANGELOG.md"] = await this.readOptional(path.join(this.projectRoot, "CHANGELOG.md"));
    }

    return context;
  }

  private async readOptional(filePath: string): Promise<string | undefined> {
    return (await this.fs.exists(filePath)) ? this.fs.readFile(filePath) : undefined;
  }
}
