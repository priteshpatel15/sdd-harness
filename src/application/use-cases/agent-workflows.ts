import { AgentProvider, ReviewLens } from "../../domain/models";
import { AgentProviderPort, ClockPort, TelemetrySink } from "../ports";
import { traceUseCase } from "./common";

export class AgentConfigureUseCase {
  public constructor(
    private readonly agents: AgentProviderPort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly provider: AgentProvider;
    readonly draftCommandTemplate?: string;
    readonly reviewCommandTemplate?: string;
    readonly implementationCommandTemplate?: string;
    readonly requiredReviewLenses?: readonly ReviewLens[];
  }): Promise<{ readonly provider: AgentProvider }> {
    return traceUseCase(this.telemetry, this.clock, "agent configure", input, async () => {
      const config = await this.agents.configure(input);
      return { result: { provider: config.provider }, outputs: { provider: config.provider } };
    });
  }
}

export class AgentDoctorUseCase {
  public constructor(
    private readonly agents: AgentProviderPort,
    private readonly projectRoot: string,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly provider: AgentProvider }): Promise<{ readonly available: boolean; readonly message: string }> {
    return traceUseCase(this.telemetry, this.clock, "agent doctor", input, async () => {
      const result = await this.agents.doctor(this.projectRoot, input.provider);
      const config = await this.agents.readConfig(this.projectRoot, input.provider);
      const configured = config !== undefined;
      const orchestratorReady = result.available && configured;
      const templateSummary = configured
        ? [
            `draft=${config.draftCommandTemplate !== undefined ? "configured" : "default"}`,
            `review=${config.reviewCommandTemplate !== undefined ? "configured" : "default"}`,
            `implementation=${config.implementationCommandTemplate !== undefined ? "configured" : "default"}`,
            `repair=${config.implementationCommandTemplate !== undefined ? "configured" : "default"}`
          ].join(" ")
        : "templates=missing";
      const message = `${result.message}
Provider config: ${configured ? "found" : "missing .sdd/agents.json entry"}.
Orchestrator templates: ${templateSummary}.
Orchestrator readiness: ${orchestratorReady ? "ready" : "not ready"}.`;
      return {
        result: { available: orchestratorReady, message },
        outputs: { ...result, configured, orchestratorReady }
      };
    });
  }
}
