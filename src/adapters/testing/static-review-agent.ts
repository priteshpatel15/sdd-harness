import { ReviewAgentPort } from "../../application/ports";
import { ReviewLens, SubagentReviewRequest, SubagentReviewResult } from "../../domain/models";

export class StaticReviewAgent implements ReviewAgentPort {
  public async requiredLenses(): Promise<readonly ReviewLens[]> {
    return ["architecture", "spec-alignment", "test-and-qa"];
  }

  public async review(input: SubagentReviewRequest): Promise<SubagentReviewResult> {
    const feature = input.featureId ?? "project";
    return {
      lens: input.lens,
      status: "passed",
      findings: [
        {
          id: `${input.lens}-static`,
          severity: "info",
          summary: `Review ${feature} for ${input.lens} consistency before merging.`,
          recommendation: "Verify the implementation, specs, tests, and telemetry evidence agree."
        }
      ],
      evidencePaths: []
    };
  }
}
