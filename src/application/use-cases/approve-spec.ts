import path from "node:path";
import { createHash } from "node:crypto";
import { ApprovalRecord } from "../../domain/models";
import { ClockPort, FileSystemPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { traceUseCase } from "./common";
import { validateConstitutionMarkdown, validateFeatureMarkdown } from "../../domain/spec-validation";
import { validateSemanticContractFiles } from "../../domain/semantic-validation";
import { assertValidationPasses } from "./common";
import { ValidationError } from "../../domain/errors";

export class ApproveSpecUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly target: "constitution" | "feature";
    readonly featureId?: string;
    readonly reviewer: string;
    readonly notes?: string;
  }): Promise<{ readonly approvalPath: string }> {
    return traceUseCase(this.telemetry, this.clock, `${input.target} approve`, input, async () => {
      const files = input.target === "constitution"
        ? await this.constitutionFiles()
        : await this.featureFiles(requireFeatureId(input.featureId));

      const gates = input.target === "constitution"
        ? validateConstitutionMarkdown(await this.store.readConstitutionFiles())
        : [
            ...validateFeatureMarkdown({
              ...(await this.store.readFeatureFiles(input.featureId!)),
              experience: await this.store.readFeatureExperience(input.featureId!)
            }),
            ...validateSemanticContractFiles({
              ...(await this.store.readFeatureSemanticFiles(input.featureId!)),
              experienceMarkdown: await this.store.readFeatureExperience(input.featureId!)
            })
          ];
      assertValidationPasses(gates);

      const record: ApprovalRecord = {
        id: `approval-${this.clock.now().toISOString()}`,
        target: input.target,
        featureId: input.featureId,
        reviewer: input.reviewer,
        notes: input.notes,
        approvedAt: this.clock.now().toISOString(),
        fileHashes: await this.hashFiles(files)
      };
      const approvalPath = await this.workflow.appendApproval(record);

      if (input.target === "constitution") {
        await this.store.updateConstitutionStatus("approved");
        await this.workflow.updateStep("validate-constitution", {
          status: "complete",
          evidence: [approvalPath, ...files.map((file) => path.relative(this.projectRoot, file))]
        });
        await this.workflow.updateStep("clear-context-before-feature-spec", { status: "ready" });
      } else {
        await this.store.updateFeatureStatus(input.featureId!, "approved");
        await this.workflow.updateStep("validate-final-feature-spec", {
          status: "complete",
          featureId: input.featureId,
          evidence: [approvalPath, ...files.map((file) => path.relative(this.projectRoot, file))]
        });
        await this.workflow.updateStep("clear-context-before-implementation", { status: "ready", featureId: input.featureId });
      }

      return { result: { approvalPath }, gates, outputs: { approvalPath } };
    });
  }

  private async constitutionFiles(): Promise<readonly string[]> {
    return ["mission.md", "tech-stack.md", "roadmap.md"].map((file) => path.join(this.projectRoot, "specs", file));
  }

  private async featureFiles(featureId: string): Promise<readonly string[]> {
    const featurePath = await this.store.resolveFeaturePath(featureId);
    const files = ["requirements.md", "plan.md", "validation.md"].map((file) => path.join(featurePath, file));
    const experiencePath = path.join(featurePath, "experience.md");
    const semanticsPath = path.join(featurePath, "semantics.md");
    return [
      ...files,
      ...((await this.fs.exists(experiencePath)) ? [experiencePath] : []),
      ...((await this.fs.exists(semanticsPath)) ? [semanticsPath] : [])
    ];
  }

  private async hashFiles(files: readonly string[]): Promise<Record<string, string>> {
    const hashes: Record<string, string> = {};
    for (const file of files) {
      const content = await this.fs.readFile(file);
      hashes[path.relative(this.projectRoot, file)] = createHash("sha256").update(content).digest("hex");
    }
    return hashes;
  }
}

function requireFeatureId(featureId: string | undefined): string {
  if (featureId === undefined || featureId.trim().length === 0) {
    throw new ValidationError("Feature approval requires --feature.");
  }
  return featureId;
}
