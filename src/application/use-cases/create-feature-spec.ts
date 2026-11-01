import { ClockPort, GitPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { BranchActionRecord, QuestionEvidence } from "../../domain/models";
import { validateExperienceAnswer, validateFeatureMarkdown } from "../../domain/spec-validation";
import { requireQuestionEvidence } from "../../domain/workflow";
import { assertAllGatesPass, assertValidationPasses, traceUseCase } from "./common";
import { slugify } from "../../domain/slug";
import { GateError } from "../../domain/errors";

export class CreateFeatureSpecUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly git: GitPort,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly name?: string;
    readonly questionEvidence: QuestionEvidence;
    readonly mvp?: boolean;
    readonly waiverReason?: string;
    readonly approvedBy?: string;
  }): Promise<{ readonly featureId: string }> {
    return traceUseCase(this.telemetry, this.clock, input.mvp === true ? "mvp plan" : "feature create", { name: input.name, mvp: input.mvp, questionEvidenceId: input.questionEvidence.id }, async () => {
      const workflowName = input.mvp === true ? "mvp" : "feature-spec";
      const gates = requireQuestionEvidence(input.questionEvidence, workflowName, ["scope", "decisions", "context", "experience"]);
      assertAllGatesPass(gates);
      if (input.mvp === true) {
        await this.assertMvpConfidence(input.waiverReason);
      }
      const answers = input.questionEvidence.answers;
      const experienceAnswerGates = validateExperienceAnswer({
        scope: answers.scope!,
        decisions: answers.decisions!,
        context: answers.context!,
        experience: answers.experience!
      });
      assertAllGatesPass(experienceAnswerGates);
      const questionEvidencePath = await this.workflow.appendQuestionEvidence(input.questionEvidence);

      const phase = input.mvp === true ? undefined : await this.store.findNextRoadmapPhase();
      const name = input.name ?? phase?.name ?? (input.mvp === true ? "MVP" : "Feature");
      const createdOn = this.clock.now().toISOString().slice(0, 10);
      const featureId = `${createdOn}-${slugify(name)}`;
      await this.assertBranchEvidence({
        purpose: input.mvp === true ? "mvp" : "feature",
        name,
        featureId,
        waiverReason: input.waiverReason,
        approvedBy: input.approvedBy
      });

      await this.store.writeFeatureSpec({
        id: featureId,
        name,
        createdOn,
        answers: {
          scope: answers.scope!,
          decisions: answers.decisions!,
          context: answers.context!,
          experience: answers.experience!
        },
        sourcePhase: phase,
        approved: false,
        mvp: input.mvp === true
      });

      const featureFiles = await this.store.readFeatureFiles(featureId);
      const validationGates = validateFeatureMarkdown({
        ...featureFiles,
        experience: await this.store.readFeatureExperience(featureId)
      });
      assertValidationPasses(validationGates);
      await this.workflow.updateStep(input.mvp === true ? "mvp-spec-branch" : "create-feature-spec", {
        status: "complete",
        featureId,
        evidence: [questionEvidencePath, `specs/${featureId}/requirements.md`, `specs/${featureId}/plan.md`, `specs/${featureId}/validation.md`, `specs/${featureId}/experience.md when UI-facing`]
      });
      await this.workflow.updateStep(input.mvp === true ? "validation-of-mvp" : "iterate-feature-spec", {
        status: "ready",
        featureId
      });
      return {
        result: { featureId },
        gates: [...gates, ...experienceAnswerGates, ...validationGates],
        outputs: { featureId, status: "draft" }
      };
    });
  }

  private async assertMvpConfidence(waiverReason: string | undefined): Promise<void> {
    const metadata = await this.store.readMetadata();
    const constitutionApproved = metadata.constitution?.status === "approved";
    const featureStatuses = Object.values(metadata.features).map((feature) => feature.status);
    const unresolved = featureStatuses.filter((status) => status === "draft" || status === "needs_review");
    if ((!constitutionApproved || unresolved.length > 0) && waiverReason === undefined) {
      throw new GateError("Hard gate: MVP planning requires an approved constitution and no draft/needs-review feature specs, unless --waiver-reason is provided.");
    }
  }

  private async assertBranchEvidence(input: {
    readonly purpose: "feature" | "mvp";
    readonly name: string;
    readonly featureId: string;
    readonly waiverReason?: string;
    readonly approvedBy?: string;
  }): Promise<void> {
    const failure = await this.branchFailure(input.purpose, input.name);
    if (failure === undefined) {
      return;
    }
    if (input.waiverReason === undefined || input.waiverReason.trim().length === 0) {
      throw new GateError(`Hard gate: ${input.purpose} spec creation requires branch evidence from sdd workflow branch --purpose ${input.purpose} --name "${input.name}". ${failure}`);
    }
    if (input.approvedBy === undefined || input.approvedBy.trim().length === 0) {
      throw new GateError(`Hard gate: ${input.purpose} branch waivers require --approved-by.`);
    }
    await this.workflow.appendWaiver({
      id: `waiver-${this.clock.now().toISOString()}`,
      gateId: `${input.purpose}.branch-evidence`,
      featureId: input.featureId,
      reason: input.waiverReason,
      approvedBy: input.approvedBy,
      createdAt: this.clock.now().toISOString()
    });
  }

  private async branchFailure(purpose: "feature" | "mvp", name: string): Promise<string | undefined> {
    const branches = await this.workflow.readArtifacts<BranchActionRecord>("branch-actions");
    const expectedBranch = `${purpose}/${slugify(name)}`;
    const branch = branches
      .filter((record) => record.purpose === purpose)
      .filter((record) => record.name === name || record.branch === expectedBranch)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
    if (branch === undefined) {
      return `No matching branch action was recorded for ${expectedBranch}.`;
    }
    if (!(await this.git.isRepository())) {
      return "The project is not a git repository, so the recorded branch cannot be verified.";
    }
    const currentBranch = await this.git.currentBranch();
    if (currentBranch !== branch.branch) {
      return `Current branch is '${currentBranch ?? "unknown"}', expected '${branch.branch}'.`;
    }
    return undefined;
  }
}
