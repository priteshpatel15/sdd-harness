import { describe, expect, it } from "vitest";
import { AgentDoctorUseCase } from "../../src/application/use-cases/agent-workflows";
import { AgentProviderPort, ClockPort, TelemetrySink } from "../../src/application/ports";
import { AgentConfig, AgentDraftRequest, AgentDraftResult, AgentImplementationRequest, AgentImplementationResult, AgentProvider, ReviewLens, RunTrace } from "../../src/domain/models";

describe("agent workflows", () => {
  it("reports orchestrator readiness only when provider config exists", async () => {
    const doctor = new AgentDoctorUseCase(
      fakeAgents({
        providerAvailable: true,
        config: {
          provider: "codex",
          configuredAt: "2026-05-25T00:00:00.000Z",
          draftCommandTemplate: "codex draft",
          reviewCommandTemplate: "codex review",
          implementationCommandTemplate: "codex implement"
        }
      }),
      "/tmp/project",
      noopTelemetry,
      fixedClock
    );

    const result = await doctor.execute({ provider: "codex" });

    expect(result.available).toBe(true);
    expect(result.message).toContain("Orchestrator templates: draft=configured review=configured implementation=configured repair=configured");
    expect(result.message).toContain("Orchestrator readiness: ready");
  });

  it("marks provider doctor not ready when templates are missing", async () => {
    const doctor = new AgentDoctorUseCase(
      fakeAgents({ providerAvailable: true }),
      "/tmp/project",
      noopTelemetry,
      fixedClock
    );

    const result = await doctor.execute({ provider: "codex" });

    expect(result.available).toBe(false);
    expect(result.message).toContain("Provider config: missing");
    expect(result.message).toContain("Orchestrator readiness: not ready");
  });
});

function fakeAgents(input: { readonly providerAvailable: boolean; readonly config?: AgentConfig }): AgentProviderPort {
  return {
    configure: async () => input.config ?? {
      provider: "codex",
      configuredAt: "2026-05-25T00:00:00.000Z"
    },
    readConfig: async () => input.config,
    doctor: async (_projectRoot: string, provider: AgentProvider) => ({
      provider,
      available: input.providerAvailable,
      command: provider,
      message: input.providerAvailable ? `${provider} CLI found.` : `${provider} CLI missing.`
    }),
    draft: async (_request: AgentDraftRequest): Promise<AgentDraftResult> => {
      throw new Error("not used");
    },
    implement: async (_request: AgentImplementationRequest): Promise<AgentImplementationResult> => {
      throw new Error("not used");
    }
  };
}

const noopTelemetry: TelemetrySink = {
  record: async (_event: RunTrace) => undefined,
  recordEvidence: async () => undefined
};

const fixedClock: ClockPort = {
  now: () => new Date("2026-05-25T00:00:00.000Z")
};
