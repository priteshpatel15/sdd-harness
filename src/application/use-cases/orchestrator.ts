import { GateError, ValidationError } from "../../domain/errors";
import { WorkflowStepId } from "../../domain/models";
import {
  OrchestratorProfile,
  OrchestratorRunState,
  OrchestratorStepPolicy,
  OrchestratorTarget,
  ResolvedOrchestratorStepPolicy,
  appendOrchestratorEvent,
  createDefaultOrchestratorConfig,
  createInitialOrchestratorRunState,
  incrementOrchestratorIteration,
  incrementRepairAttempts,
  nextOrchestratorWorkflowStep,
  resolveOrchestratorStepPolicy,
  shouldAttemptAgentRepair
} from "../../domain/orchestrator";
import {
  ClockPort,
  OrchestratorStorePort,
  SpecStorePort,
  TelemetrySink,
  WorkflowStatePort
} from "../ports";
import { traceUseCase } from "./common";
import { OrchestratorStepExecutor } from "./orchestrator-step-executor";

export class OrchestratorUseCase {
  public constructor(
    private readonly orchestratorStore: OrchestratorStorePort,
    private readonly store: SpecStorePort,
    private readonly workflow: WorkflowStatePort,
    private readonly stepExecutor: OrchestratorStepExecutor,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async init(input: {
    readonly agentProvider: "codex" | "claude";
    readonly profile?: OrchestratorProfile;
    readonly approvedBy?: string;
    readonly force?: boolean;
  }): Promise<{ readonly configPath: string }> {
    return traceUseCase(this.telemetry, this.clock, "orchestrator init", input, async () => {
      if (input.force !== true && await this.orchestratorStore.readConfig() !== undefined) {
        throw new ValidationError("Orchestrator config already exists. Pass --force to replace .sdd/orchestrator.json.");
      }
      const config = createDefaultOrchestratorConfig({
        agentProvider: input.agentProvider,
        profile: input.profile,
        approvedBy: input.approvedBy
      });
      const configPath = await this.orchestratorStore.writeConfig(config);
      return { result: { configPath }, outputs: { configPath } };
    });
  }

  public async configure(input: {
    readonly stepId: WorkflowStepId;
    readonly policy: OrchestratorStepPolicy;
  }): Promise<{ readonly configPath: string; readonly stepId: WorkflowStepId; readonly policy: ResolvedOrchestratorStepPolicy }> {
    return traceUseCase(this.telemetry, this.clock, "orchestrator configure", input, async () => {
      await this.requireConfig();
      try {
        const result = await this.orchestratorStore.updateStepPolicy(input.stepId, input.policy);
        const policy = resolveOrchestratorStepPolicy(result.config, input.stepId);
        return {
          result: { configPath: result.path, stepId: input.stepId, policy },
          outputs: { configPath: result.path, stepId: input.stepId, owner: policy.owner, repair: policy.repair }
        };
      } catch (error) {
        throw new ValidationError(error instanceof Error ? error.message : String(error));
      }
    });
  }

  public async status(): Promise<{ readonly lines: readonly string[]; readonly state?: OrchestratorRunState }> {
    return traceUseCase(this.telemetry, this.clock, "orchestrator status", {}, async () => {
      const config = await this.requireConfig();
      const state = await this.orchestratorStore.readState();
      const workflowState = await this.workflow.read();
      const terminal = state?.featureId === undefined ? undefined : await this.featureTerminalState(state.featureId);
      const currentPolicy = state?.currentStep === undefined ? undefined : resolveOrchestratorStepPolicy(config, state.currentStep);
      const currentWorkflowStep = state?.currentStep === undefined ? undefined : workflowState.steps[state.currentStep];
      const lines = [
        `Config: ${config.profile} using ${config.agentProvider}`,
        state === undefined ? "State: not started" : `State: ${state.status}${terminal !== undefined && state.status !== "succeeded" ? " (stale: target feature is complete)" : ""}`,
        ...(state === undefined ? [] : [
          `Target: ${state.target}${state.featureId !== undefined ? ` (${state.featureId})` : ""}`,
          terminal !== undefined ? `Feature terminal: ${terminal}` : undefined,
          `Iteration: ${state.iteration}`,
          state.currentStep !== undefined ? `Current step: ${state.currentStep}` : "Current step: none",
          currentWorkflowStep !== undefined ? `Workflow step status: ${currentWorkflowStep.status}` : undefined,
          currentPolicy !== undefined ? `Current policy: owner=${currentPolicy.owner} repair=${currentPolicy.repair}` : undefined,
          state.pausedReason !== undefined ? `Paused reason: ${state.pausedReason}` : undefined,
          state.nextCommand !== undefined ? `Next command: ${state.nextCommand}` : undefined,
          terminal !== undefined && state.status !== "succeeded" ? "Reconcile command: sdd orchestrator resume" : undefined,
          state.lastError !== undefined ? `Last error: ${state.lastError}` : undefined
        ].filter((line): line is string => line !== undefined))
      ];
      return { result: { lines, state }, outputs: { status: terminal !== undefined ? "succeeded" : state?.status ?? "not_started" } };
    });
  }

  public async run(input: {
    readonly target?: OrchestratorTarget;
    readonly featureId?: string;
  }): Promise<{ readonly status: OrchestratorRunState["status"]; readonly message: string; readonly statePath: string }> {
    return this.runLoop({ ...input, resume: false });
  }

  public async resume(): Promise<{ readonly status: OrchestratorRunState["status"]; readonly message: string; readonly statePath: string }> {
    return this.runLoop({ resume: true });
  }

  private async runLoop(input: {
    readonly target?: OrchestratorTarget;
    readonly featureId?: string;
    readonly resume: boolean;
  }): Promise<{ readonly status: OrchestratorRunState["status"]; readonly message: string; readonly statePath: string }> {
    return traceUseCase(this.telemetry, this.clock, input.resume ? "orchestrator resume" : "orchestrator run", input, async () => {
      const config = await this.requireConfig();
      let state = input.resume ? await this.orchestratorStore.readState() : undefined;
      if (state === undefined || input.resume !== true) {
        state = createInitialOrchestratorRunState({
          now: this.now(),
          target: input.featureId !== undefined ? "feature" : input.target ?? "roadmap-next",
          featureId: input.featureId
        });
      } else {
        state = { ...state, status: "running", updatedAt: this.now(), lastError: undefined, pausedReason: undefined };
      }

      for (let index = 0; index < config.maxTotalIterations; index += 1) {
        state = incrementOrchestratorIteration(state, this.now());
        const terminal = await this.featureTerminalState(state.featureId);
        if (terminal !== undefined) {
          state = appendOrchestratorEvent(state, { at: this.now(), status: "succeeded", message: terminal });
          const statePath = await this.orchestratorStore.writeState(state);
          return { result: { status: state.status, message: terminal, statePath }, outputs: { status: state.status, statePath } };
        }

        const workflowState = await this.workflow.read();
        const nextStep = nextOrchestratorWorkflowStep(workflowState, state.featureId);
        if (nextStep === undefined) {
          state = appendOrchestratorEvent(state, { at: this.now(), status: "succeeded", message: "Workflow is complete." });
          const statePath = await this.orchestratorStore.writeState(state);
          return { result: { status: state.status, message: "Workflow is complete.", statePath }, outputs: { status: state.status, statePath } };
        }

        const policy = resolveOrchestratorStepPolicy(config, nextStep.id);
        const featureId = await this.resolveFeatureId(state.featureId, nextStep.featureId);
        state = { ...state, currentStep: nextStep.id, featureId: featureId ?? state.featureId, updatedAt: this.now() };
        await this.orchestratorStore.writeState(state);

        if (policy.owner === "human") {
          const paused = this.pauseState(state, nextStep.id, `Human-owned step '${nextStep.title}' is waiting for input.`, humanCommandForStep(nextStep.id, featureId));
          const statePath = await this.orchestratorStore.writeState(paused);
          return { result: { status: paused.status, message: paused.pausedReason ?? "Paused.", statePath }, outputs: { status: paused.status, statePath } };
        }

        try {
          const evidence = await this.stepExecutor.execute({ stepId: nextStep.id, policy, config, featureId });
          state = appendOrchestratorEvent(state, {
            at: this.now(),
            stepId: nextStep.id,
            status: "running",
            message: `Completed orchestrator step ${nextStep.id}.`,
            evidence
          });
          state = { ...state, lastGateFailure: undefined, lastError: undefined };
          await this.orchestratorStore.writeState(state);
        } catch (error) {
          const handled = await this.handleStepFailure(state, nextStep.id, policy, config.agentProvider, featureId, error);
          if (handled.continueLoop) {
            state = handled.state;
            continue;
          }
          return handled.result;
        }
      }

      const message = `Stopped after ${config.maxTotalIterations} orchestration iteration(s) at ${state.currentStep ?? "unknown step"}.`;
      state = { ...appendOrchestratorEvent(state, { at: this.now(), status: "failed", message }), lastError: message };
      const statePath = await this.orchestratorStore.writeState(state);
      return { result: { status: state.status, message, statePath }, outputs: { status: state.status, statePath } };
    });
  }

  private async handleStepFailure(
    state: OrchestratorRunState,
    stepId: WorkflowStepId,
    policy: ResolvedOrchestratorStepPolicy,
    provider: "codex" | "claude",
    featureId: string | undefined,
    error: unknown
  ): Promise<{
    readonly continueLoop: true;
    readonly state: OrchestratorRunState;
  } | {
    readonly continueLoop: false;
    readonly result: { readonly result: { readonly status: OrchestratorRunState["status"]; readonly message: string; readonly statePath: string }; readonly outputs: { readonly status: OrchestratorRunState["status"]; readonly statePath: string } };
  }> {
    const message = error instanceof Error ? error.message : String(error);
    const failureEvidence = evidenceFromError(error);
    state = {
      ...state,
      lastGateFailure: { stepId, message, evidence: failureEvidence, failedAt: this.now() },
      lastError: message
    };
    await this.orchestratorStore.writeState(state);

    if (isBlockedAutomationError(error)) {
      state = { ...appendOrchestratorEvent(state, { at: this.now(), stepId, status: "blocked", message }), lastError: message };
      return this.terminalFailure(state, message);
    }

    if (featureId !== undefined && shouldAttemptAgentRepair(state, stepId, policy)) {
      return this.attemptAgentRepair(state, stepId, provider, featureId, message, failureEvidence);
    }

    state = {
      ...appendOrchestratorEvent(state, {
        at: this.now(),
        stepId,
        status: policy.repair === "human" ? "paused" : policy.repair === "agent" ? "failed" : "blocked",
        message
      }),
      pausedReason: policy.repair === "human" ? message : undefined,
      nextCommand: policy.repair === "human" ? humanCommandForStep(stepId, featureId) : undefined,
      lastError: message
    };
    return this.terminalFailure(state, message);
  }

  private async attemptAgentRepair(
    state: OrchestratorRunState,
    stepId: WorkflowStepId,
    provider: "codex" | "claude",
    featureId: string,
    message: string,
    failureEvidence: readonly string[]
  ): Promise<{
    readonly continueLoop: true;
    readonly state: OrchestratorRunState;
  } | {
    readonly continueLoop: false;
    readonly result: { readonly result: { readonly status: OrchestratorRunState["status"]; readonly message: string; readonly statePath: string }; readonly outputs: { readonly status: OrchestratorRunState["status"]; readonly statePath: string } };
  }> {
    state = incrementRepairAttempts(state, stepId, this.now());
    await this.orchestratorStore.writeState(state);
    try {
      const evidence = await this.stepExecutor.repair({ provider, featureId, stepId, errorMessage: message, evidencePaths: failureEvidence });
      state = appendOrchestratorEvent(state, {
        at: this.now(),
        stepId,
        status: "running",
        message: `Repair attempt ${state.repairAttempts[stepId] ?? 0} completed for ${stepId}.`,
        evidence
      });
      await this.orchestratorStore.writeState(state);
      return { continueLoop: true, state };
    } catch (repairError) {
      const repairMessage = repairError instanceof Error ? repairError.message : String(repairError);
      state = {
        ...appendOrchestratorEvent(state, {
          at: this.now(),
          stepId,
          status: isBlockedAutomationError(repairError) ? "blocked" : "running",
          message: `Repair attempt ${state.repairAttempts[stepId] ?? 0} failed for ${stepId}: ${repairMessage}`
        }),
        lastError: repairMessage
      };
      if (state.status === "blocked") {
        return this.terminalFailure(state, repairMessage);
      }
      await this.orchestratorStore.writeState(state);
      return { continueLoop: true, state };
    }
  }

  private async terminalFailure(state: OrchestratorRunState, message: string): Promise<{
    readonly continueLoop: false;
    readonly result: { readonly result: { readonly status: OrchestratorRunState["status"]; readonly message: string; readonly statePath: string }; readonly outputs: { readonly status: OrchestratorRunState["status"]; readonly statePath: string } };
  }> {
    const statePath = await this.orchestratorStore.writeState(state);
    return { continueLoop: false, result: { result: { status: state.status, message, statePath }, outputs: { status: state.status, statePath } } };
  }

  private pauseState(
    state: OrchestratorRunState,
    stepId: WorkflowStepId,
    reason: string,
    nextCommand: string
  ): OrchestratorRunState {
    return {
      ...appendOrchestratorEvent(state, { at: this.now(), stepId, status: "paused", message: reason }),
      pausedReason: reason,
      nextCommand
    };
  }

  private async resolveFeatureId(current: string | undefined, stepFeatureId: string | undefined): Promise<string | undefined> {
    if (current !== undefined) return current;
    if (stepFeatureId !== undefined) return stepFeatureId;
    const metadata = await this.store.readMetadata();
    const active = Object.entries(metadata.features)
      .filter(([, feature]) => feature.status !== "merged")
      .sort((left, right) => right[1].createdAt.localeCompare(left[1].createdAt))[0];
    return active?.[0];
  }

  private async featureTerminalState(featureId: string | undefined): Promise<string | undefined> {
    if (featureId === undefined) {
      return undefined;
    }
    const metadata = await this.store.readMetadata();
    return metadata.features[featureId]?.status === "merged" ? `Feature ${featureId} is complete.` : undefined;
  }

  private async requireConfig() {
    const config = await this.orchestratorStore.readConfig();
    if (config === undefined) {
      throw new ValidationError("Orchestrator is not initialized. Run sdd orchestrator init --agent codex --profile human-intent-ai-build.");
    }
    return config;
  }

  private now(): string {
    return this.clock.now().toISOString();
  }
}

function humanCommandForStep(stepId: WorkflowStepId, featureId: string | undefined): string {
  if (stepId === "setup-stakeholder-thoughts") {
    return "sdd stakeholder setup --product <product-name> --thought <name=thought> && sdd jtbd intake --product <product-name> --audience <audience> --problem <problem> --job <job>";
  }
  if (stepId === "create-constitution") {
    return "sdd questions capture --workflow constitution --output constitution-questions.json && sdd constitution create --questions constitution-questions.json";
  }
  if (stepId === "create-feature-spec") {
    return "sdd workflow branch --purpose feature --name \"<feature-name>\" && sdd questions capture --workflow feature-spec --output feature-questions.json && sdd feature create --questions feature-questions.json";
  }
  if (stepId === "create-semantic-contract") {
    return `sdd questions capture --workflow semantic-contract --output semantic-questions.json && sdd feature semantics --feature ${featureId ?? "<feature-id>"} --questions semantic-questions.json`;
  }
  if (stepId === "mvp-spec-branch") {
    return "sdd workflow branch --purpose mvp --name MVP && sdd questions capture --workflow mvp --output mvp-questions.json && sdd mvp plan --questions mvp-questions.json";
  }
  if (stepId === "validation-of-mvp") {
    return `sdd mvp retro --feature ${featureId ?? "<feature-id>"} --findings "<findings>"`;
  }
  if (stepId === "review-subagent-recommendations") {
    return `sdd feature review-decisions --feature ${featureId ?? "<feature-id>"} --decision "finding-id|accepted|reason|evidence/path"`;
  }
  if (stepId === "create-auto-workflow-with-skills") {
    return "sdd skill validate";
  }
  return featureId !== undefined ? `sdd workflow next && sdd <command> --feature ${featureId}` : "sdd workflow next";
}

function evidenceFromError(error: unknown): readonly string[] {
  if (error instanceof GateError || error instanceof ValidationError) {
    return error.gates.map((gate) => gate.evidencePath).filter((value): value is string => value !== undefined && value.trim().length > 0);
  }
  return [];
}

function isBlockedAutomationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /does not have .*automated action|requires agent ownership|harness-owned gate|requires --feature|not configured|completeNoopGuidedSteps is disabled/i.test(message);
}
