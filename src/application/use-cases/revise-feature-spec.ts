import path from "node:path";
import { ClockPort, FileSystemPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { ValidationError } from "../../domain/errors";
import { traceUseCase } from "./common";
import { slugify } from "../../domain/slug";

export class ReviseFeatureSpecUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly featureId: string; readonly request: string }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "feature revise", input, async () => {
      if (input.request.trim().length === 0) {
        throw new ValidationError("Feature revision requires --request.");
      }
      const featurePath = await this.store.resolveFeaturePath(input.featureId);
      const outputPath = path.join(this.projectRoot, ".sdd", "revisions", `${this.clock.now().toISOString().slice(0, 10)}-${slugify(input.featureId)}.md`);
      const content = `# Feature Spec Revision

Feature: ${input.featureId}
Spec path: ${path.relative(this.projectRoot, featurePath)}

## Requested Change

${input.request}

## Required Follow-up

- Update \`requirements.md\`, \`plan.md\`, and \`validation.md\` together.
- Re-run \`sdd feature validate-spec --feature ${input.featureId}\`.
- Re-approve the feature before implementation.
`;
      await this.fs.writeFile(outputPath, content);
      await this.store.updateFeatureStatus(input.featureId, "needs_review");
      await this.workflow.updateStep("iterate-feature-spec", {
        status: "complete",
        featureId: input.featureId,
        evidence: [outputPath]
      });
      await this.workflow.updateStep("validate-final-feature-spec", { status: "ready", featureId: input.featureId });
      return { result: { path: outputPath }, outputs: { path: outputPath } };
    });
  }
}
