import { AgentProvider, WorkflowState, WorkflowStepId, WorkflowStepState } from "./models";
import { COURSE_STEPS, nextWorkflowStep } from "./workflow";

export type OrchestratorOwner = "human" | "agent" | "harness";
export type OrchestratorRepairOwner = "none" | "agent" | "human";
export type OrchestratorRunStatus = "running" | "paused" | "blocked" | "succeeded" | "failed";
export type OrchestratorProfile = "human-intent-ai-build";
export type OrchestratorTarget = "roadmap-next" | "feature";

export interface OrchestratorStepPolicy {
  readonly owner?: OrchestratorOwner;
  readonly repair?: OrchestratorRepairOwner;
  readonly maxRepairAttempts?: number;
  readonly validationCommands?: readonly string[];
  readonly tddCommand?: string;
  readonly testDatabase?: string;
  readonly testDatabaseEnv?: string;
  readonly waiverReason?: string;
  readonly approvedBy?: string;
  readonly refactorEnabled?: boolean;
  readonly completeNoopGuidedSteps?: boolean;
  readonly autoRecordEmptyReviewDecisions?: boolean;
}

export interface OrchestratorConfig {
  readonly version: 1;
  readonly agentProvider: AgentProvider;
  readonly profile: OrchestratorProfile;
  readonly defaultOwner: OrchestratorOwner;
  readonly maxTotalIterations: number;
  readonly maxRepairAttemptsPerStep: number;
  readonly approvedBy: string;
  readonly steps: Partial<Record<WorkflowStepId, OrchestratorStepPolicy>>;
}

export interface ResolvedOrchestratorStepPolicy {
  readonly owner: OrchestratorOwner;
  readonly repair: OrchestratorRepairOwner;
  readonly maxRepairAttempts: number;
  readonly validationCommands?: readonly string[];
  readonly tddCommand?: string;
  readonly testDatabase?: string;
  readonly testDatabaseEnv?: string;
  readonly waiverReason?: string;
  readonly approvedBy: string;
  readonly refactorEnabled: boolean;
  readonly completeNoopGuidedSteps: boolean;
  readonly autoRecordEmptyReviewDecisions: boolean;
}

export interface OrchestratorRunEvent {
  readonly at: string;
  readonly stepId?: WorkflowStepId;
  readonly status: OrchestratorRunStatus;
  readonly message: string;
  readonly evidence?: readonly string[];
}

export interface OrchestratorRunState {
  readonly version: 1;
  readonly status: OrchestratorRunStatus;
  readonly target: OrchestratorTarget;
  readonly featureId?: string;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly currentStep?: WorkflowStepId;
  readonly iteration: number;
  readonly repairAttempts: Partial<Record<WorkflowStepId, number>>;
  readonly pausedReason?: string;
  readonly nextCommand?: string;
  readonly lastError?: string;
  readonly lastGateFailure?: {
    readonly stepId: WorkflowStepId;
    readonly message: string;
    readonly evidence: readonly string[];
    readonly failedAt: string;
  };
  readonly events: readonly OrchestratorRunEvent[];
}

export function createDefaultOrchestratorConfig(input: {
  readonly agentProvider: AgentProvider;
  readonly profile?: OrchestratorProfile;
  readonly approvedBy?: string;
}): OrchestratorConfig {
  return {
    version: 1,
    agentProvider: input.agentProvider,
    profile: input.profile ?? "human-intent-ai-build",
    defaultOwner: "harness",
    maxTotalIterations: 20,
    maxRepairAttemptsPerStep: 3,
    approvedBy: input.approvedBy ?? "Orchestrator",
    steps: {
      "setup-stakeholder-thoughts": { owner: "human" },
      "create-constitution": { owner: "human" },
      "create-feature-spec": { owner: "human" },
      "create-semantic-contract": { owner: "agent" },
      "implement-feature": { owner: "agent", repair: "agent", refactorEnabled: true },
      "feature-validation": { owner: "harness", repair: "agent" },
      "review-subagent-recommendations": { owner: "human" },
      "mvp-spec-branch": { owner: "human" },
      "validation-of-mvp": { owner: "human" },
      "create-auto-workflow-with-skills": { owner: "harness" }
    }
  };
}

export function resolveOrchestratorStepPolicy(config: OrchestratorConfig, stepId: WorkflowStepId): ResolvedOrchestratorStepPolicy {
  const step = config.steps[stepId] ?? {};
  return {
    owner: step.owner ?? config.defaultOwner,
    repair: step.repair ?? "none",
    maxRepairAttempts: step.maxRepairAttempts ?? config.maxRepairAttemptsPerStep,
    validationCommands: step.validationCommands,
    tddCommand: step.tddCommand,
    testDatabase: step.testDatabase,
    testDatabaseEnv: step.testDatabaseEnv,
    waiverReason: step.waiverReason,
    approvedBy: step.approvedBy ?? config.approvedBy,
    refactorEnabled: step.refactorEnabled ?? false,
    completeNoopGuidedSteps: step.completeNoopGuidedSteps ?? true,
    autoRecordEmptyReviewDecisions: step.autoRecordEmptyReviewDecisions ?? false
  };
}

export function updateOrchestratorStepPolicy(
  config: OrchestratorConfig,
  stepId: WorkflowStepId,
  update: OrchestratorStepPolicy
): OrchestratorConfig {
  const next: OrchestratorConfig = {
    ...config,
    steps: {
      ...config.steps,
      [stepId]: {
        ...(config.steps[stepId] ?? {}),
        ...definedOnly(update)
      }
    }
  };
  validateOrchestratorConfig(next);
  return next;
}

export function validateOrchestratorConfig(config: OrchestratorConfig): void {
  if (config.maxTotalIterations < 1) {
    throw new Error("Orchestrator config maxTotalIterations must be at least 1.");
  }
  if (config.maxRepairAttemptsPerStep < 0) {
    throw new Error("Orchestrator config maxRepairAttemptsPerStep cannot be negative.");
  }
  for (const [stepId, policy] of Object.entries(config.steps) as [WorkflowStepId, OrchestratorStepPolicy][]) {
    if (policy.maxRepairAttempts !== undefined && policy.maxRepairAttempts < 0) {
      throw new Error(`Orchestrator step '${stepId}' maxRepairAttempts cannot be negative.`);
    }
    if (policy.owner === "human" && policy.repair === "agent") {
      throw new Error(`Orchestrator step '${stepId}' cannot use agent repair while the step itself is human-owned.`);
    }
    if (policy.repair === "agent" && JUDGMENT_STEP_IDS.has(stepId)) {
      throw new Error(`Orchestrator step '${stepId}' cannot use agent repair because it requires human judgment.`);
    }
    if (policy.refactorEnabled === true && stepId !== "implement-feature") {
      throw new Error(`Orchestrator refactorEnabled is only valid for implement-feature.`);
    }
    if (policy.waiverReason !== undefined && (policy.approvedBy === undefined || policy.approvedBy.trim().length === 0)) {
      throw new Error(`Orchestrator step '${stepId}' waiverReason requires approvedBy.`);
    }
  }
}

export function parseOrchestratorConfig(value: unknown): OrchestratorConfig {
  const config = requireRecord(value, "Orchestrator config");
  requireLiteral(config.version, 1, "Orchestrator config version");
  requireEnum(config.agentProvider, ["codex", "claude"], "Orchestrator agentProvider");
  requireEnum(config.profile, ["human-intent-ai-build"], "Orchestrator profile");
  requireEnum(config.defaultOwner, ["human", "agent", "harness"], "Orchestrator defaultOwner");
  requireNonNegativeInteger(config.maxTotalIterations, "Orchestrator maxTotalIterations");
  requireNonNegativeInteger(config.maxRepairAttemptsPerStep, "Orchestrator maxRepairAttemptsPerStep");
  requireString(config.approvedBy, "Orchestrator approvedBy");
  const steps = requireRecord(config.steps, "Orchestrator steps");
  for (const [stepId, policy] of Object.entries(steps)) {
    requireKnownStepId(stepId, `Orchestrator step '${stepId}'`);
    parseStepPolicy(policy, stepId);
  }
  validateOrchestratorConfig(config as unknown as OrchestratorConfig);
  return config as unknown as OrchestratorConfig;
}

export function parseOrchestratorRunState(value: unknown): OrchestratorRunState {
  const state = requireRecord(value, "Orchestrator run state");
  requireLiteral(state.version, 1, "Orchestrator run state version");
  requireEnum(state.status, ["running", "paused", "blocked", "succeeded", "failed"], "Orchestrator run status");
  requireEnum(state.target, ["roadmap-next", "feature"], "Orchestrator target");
  requireOptionalString(state.featureId, "Orchestrator featureId");
  requireString(state.startedAt, "Orchestrator startedAt");
  requireString(state.updatedAt, "Orchestrator updatedAt");
  requireOptionalKnownStepId(state.currentStep, "Orchestrator currentStep");
  requireNonNegativeInteger(state.iteration, "Orchestrator iteration");
  const attempts = requireRecord(state.repairAttempts, "Orchestrator repairAttempts");
  for (const [stepId, attemptsValue] of Object.entries(attempts)) {
    requireKnownStepId(stepId, `Orchestrator repairAttempts '${stepId}'`);
    requireNonNegativeInteger(attemptsValue, `Orchestrator repairAttempts '${stepId}'`);
  }
  requireOptionalString(state.pausedReason, "Orchestrator pausedReason");
  requireOptionalString(state.nextCommand, "Orchestrator nextCommand");
  requireOptionalString(state.lastError, "Orchestrator lastError");
  if (state.lastGateFailure !== undefined) {
    parseGateFailure(state.lastGateFailure);
  }
  if (!Array.isArray(state.events)) {
    throw new Error("Orchestrator events must be an array.");
  }
  for (const event of state.events) {
    parseRunEvent(event);
  }
  return state as unknown as OrchestratorRunState;
}

export function createInitialOrchestratorRunState(input: {
  readonly now: string;
  readonly target: OrchestratorTarget;
  readonly featureId?: string;
}): OrchestratorRunState {
  return {
    version: 1,
    status: "running",
    target: input.target,
    featureId: input.featureId,
    startedAt: input.now,
    updatedAt: input.now,
    iteration: 0,
    repairAttempts: {},
    events: []
  };
}

export function nextOrchestratorWorkflowStep(state: WorkflowState, featureId?: string): WorkflowStepState | undefined {
  if (featureId === undefined) {
    return nextWorkflowStep(state);
  }

  const featureSteps = Object.values(state.steps)
    .filter((step) => step.number > 0)
    .filter((step) => step.status !== "complete" && step.status !== "waived")
    .filter((step) => step.featureId === undefined || step.featureId === featureId)
    .sort((left, right) => left.number - right.number);
  return featureSteps[0] ?? nextWorkflowStep(state);
}

export function appendOrchestratorEvent(
  state: OrchestratorRunState,
  event: OrchestratorRunEvent
): OrchestratorRunState {
  return {
    ...state,
    status: event.status,
    currentStep: event.stepId ?? state.currentStep,
    updatedAt: event.at,
    events: [...state.events, event]
  };
}

export function incrementOrchestratorIteration(state: OrchestratorRunState, now: string): OrchestratorRunState {
  return {
    ...state,
    iteration: state.iteration + 1,
    updatedAt: now
  };
}

export function repairAttemptsFor(state: OrchestratorRunState, stepId: WorkflowStepId): number {
  return state.repairAttempts[stepId] ?? 0;
}

export function incrementRepairAttempts(state: OrchestratorRunState, stepId: WorkflowStepId, now: string): OrchestratorRunState {
  return {
    ...state,
    updatedAt: now,
    repairAttempts: {
      ...state.repairAttempts,
      [stepId]: repairAttemptsFor(state, stepId) + 1
    }
  };
}

export function shouldAttemptAgentRepair(
  state: OrchestratorRunState,
  stepId: WorkflowStepId,
  policy: ResolvedOrchestratorStepPolicy
): boolean {
  return policy.repair === "agent" && repairAttemptsFor(state, stepId) < policy.maxRepairAttempts;
}

function definedOnly<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function parseStepPolicy(value: unknown, stepId: string): void {
  const policy = requireRecord(value, `Orchestrator step '${stepId}' policy`);
  requireOptionalEnum(policy.owner, ["human", "agent", "harness"], `Orchestrator step '${stepId}' owner`);
  requireOptionalEnum(policy.repair, ["none", "agent", "human"], `Orchestrator step '${stepId}' repair`);
  requireOptionalNonNegativeInteger(policy.maxRepairAttempts, `Orchestrator step '${stepId}' maxRepairAttempts`);
  requireOptionalStringArray(policy.validationCommands, `Orchestrator step '${stepId}' validationCommands`);
  requireOptionalString(policy.tddCommand, `Orchestrator step '${stepId}' tddCommand`);
  requireOptionalString(policy.testDatabase, `Orchestrator step '${stepId}' testDatabase`);
  requireOptionalString(policy.testDatabaseEnv, `Orchestrator step '${stepId}' testDatabaseEnv`);
  requireOptionalString(policy.waiverReason, `Orchestrator step '${stepId}' waiverReason`);
  requireOptionalString(policy.approvedBy, `Orchestrator step '${stepId}' approvedBy`);
  requireOptionalBoolean(policy.refactorEnabled, `Orchestrator step '${stepId}' refactorEnabled`);
  requireOptionalBoolean(policy.completeNoopGuidedSteps, `Orchestrator step '${stepId}' completeNoopGuidedSteps`);
  requireOptionalBoolean(policy.autoRecordEmptyReviewDecisions, `Orchestrator step '${stepId}' autoRecordEmptyReviewDecisions`);
}

function parseGateFailure(value: unknown): void {
  const failure = requireRecord(value, "Orchestrator lastGateFailure");
  requireKnownStepId(requireString(failure.stepId, "Orchestrator lastGateFailure stepId"), "Orchestrator lastGateFailure stepId");
  requireString(failure.message, "Orchestrator lastGateFailure message");
  requireStringArray(failure.evidence, "Orchestrator lastGateFailure evidence");
  requireString(failure.failedAt, "Orchestrator lastGateFailure failedAt");
}

function parseRunEvent(value: unknown): void {
  const event = requireRecord(value, "Orchestrator event");
  requireString(event.at, "Orchestrator event at");
  requireOptionalKnownStepId(event.stepId, "Orchestrator event stepId");
  requireEnum(event.status, ["running", "paused", "blocked", "succeeded", "failed"], "Orchestrator event status");
  requireString(event.message, "Orchestrator event message");
  requireOptionalStringArray(event.evidence, "Orchestrator event evidence");
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireLiteral(value: unknown, expected: number, label: string): void {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}.`);
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function requireOptionalString(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`${label} must be a string when present.`);
  }
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}

function requireOptionalEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): void {
  if (value !== undefined) {
    requireEnum(value, allowed, label);
  }
}

function requireNonNegativeInteger(value: unknown, label: string): void {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}

function requireOptionalNonNegativeInteger(value: unknown, label: string): void {
  if (value !== undefined) {
    requireNonNegativeInteger(value, label);
  }
}

function requireOptionalBoolean(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean when present.`);
  }
}

function requireStringArray(value: unknown, label: string): void {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }
}

function requireOptionalStringArray(value: unknown, label: string): void {
  if (value !== undefined) {
    requireStringArray(value, label);
  }
}

function requireKnownStepId(value: string, label: string): void {
  if (!KNOWN_STEP_IDS.has(value as WorkflowStepId)) {
    throw new Error(`${label} must be a known workflow step id.`);
  }
}

function requireOptionalKnownStepId(value: unknown, label: string): void {
  if (value !== undefined) {
    requireKnownStepId(requireString(value, label), label);
  }
}

const KNOWN_STEP_IDS = new Set(COURSE_STEPS.map((step) => step.id));
const JUDGMENT_STEP_IDS = new Set<WorkflowStepId>([
  "setup-stakeholder-thoughts",
  "create-constitution",
  "create-feature-spec",
  "review-subagent-recommendations",
  "mvp-spec-branch",
  "validation-of-mvp"
]);
