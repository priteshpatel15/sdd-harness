import { MvpRetrospective } from "../../domain/models";
import { ClockPort, TelemetrySink, WorkflowStatePort } from "../ports";
import { ValidationError } from "../../domain/errors";
import { traceUseCase } from "./common";

export class MvpRetroUseCase {
  public constructor(
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly featureId: string; readonly findings: string; readonly specClarificationsNeeded: boolean }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "mvp retro", input, async () => {
      if (input.findings.trim().length === 0) {
        throw new ValidationError("MVP retro requires --findings.");
      }
      const record: MvpRetrospective = {
        id: `mvp-retro-${this.clock.now().toISOString()}`,
        featureId: input.featureId,
        findings: input.findings,
        specClarificationsNeeded: input.specClarificationsNeeded,
        createdAt: this.clock.now().toISOString()
      };
      const path = await this.workflow.appendMvpRetrospective(record);
      await this.workflow.updateStep("validation-of-mvp", {
        status: "complete",
        featureId: input.featureId,
        evidence: [path]
      });
      return { result: { path }, outputs: { path } };
    });
  }
}
