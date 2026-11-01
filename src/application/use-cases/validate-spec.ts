import { ClockPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { validateConstitutionMarkdown, validateFeatureMarkdown } from "../../domain/spec-validation";
import { validateSemanticContractFiles } from "../../domain/semantic-validation";
import { assertValidationPasses, traceUseCase } from "./common";

export class ValidateSpecUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly featureId?: string }): Promise<{ readonly passed: true }> {
    return traceUseCase(this.telemetry, this.clock, input.featureId === undefined ? "constitution validate" : "feature validate-spec", input, async () => {
      const gates = input.featureId === undefined
        ? validateConstitutionMarkdown(await this.store.readConstitutionFiles())
        : [
            ...validateFeatureMarkdown({
              ...(await this.store.readFeatureFiles(input.featureId)),
              experience: await this.store.readFeatureExperience(input.featureId)
            }),
            ...validateSemanticContractFiles({
              ...(await this.store.readFeatureSemanticFiles(input.featureId)),
              experienceMarkdown: await this.store.readFeatureExperience(input.featureId)
            })
          ];

      assertValidationPasses(gates);
      await this.workflow.updateStep(input.featureId === undefined ? "validate-constitution" : "validate-final-feature-spec", {
        status: "ready",
        featureId: input.featureId,
        evidence: gates.map((gate) => gate.id)
      });

      return {
        result: { passed: true },
        gates,
        outputs: { passed: true }
      };
    });
  }
}
