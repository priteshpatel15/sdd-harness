import { JTBD } from "../../domain/models";
import { ClockPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { traceUseCase } from "./common";
import { ValidationError } from "../../domain/errors";

export class IntakeJtbdUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(jtbd: JTBD): Promise<void> {
    await traceUseCase(this.telemetry, this.clock, "jtbd intake", { productName: jtbd.productName }, async () => {
      validateJtbd(jtbd);
      await this.store.writeJtbd(jtbd);
      await this.workflow.updateStep("setup-stakeholder-thoughts", {
        status: "complete",
        evidence: ["README.md", "specs/jtbd.md"]
      });
      await this.workflow.updateStep("create-constitution", { status: "ready" });
      return { result: undefined, outputs: { wrote: ["README.md", "specs/jtbd.md"] } };
    });
  }
}

function validateJtbd(jtbd: JTBD): void {
  const missing = [
    ["productName", jtbd.productName],
    ["audience", jtbd.audience],
    ["problem", jtbd.problem],
    ["job", jtbd.job]
  ].filter(([, value]) => String(value).trim().length === 0);

  if (missing.length > 0) {
    throw new ValidationError(`JTBD intake requires: ${missing.map(([name]) => name).join(", ")}.`);
  }
}
