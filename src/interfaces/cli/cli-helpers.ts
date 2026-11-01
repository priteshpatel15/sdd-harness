import path from "node:path";
import { createHash } from "node:crypto";
import { SddError } from "../../domain/errors";
import { AgentProvider, InterviewAnswers, JTBD, PromptId, QuestionEvidence, QuestionWorkflow, ReviewLens, StakeholderThought, TddEvidencePhase, WorkflowStepId } from "../../domain/models";
import { OrchestratorOwner, OrchestratorProfile, OrchestratorRepairOwner, OrchestratorTarget } from "../../domain/orchestrator";
import { COURSE_STEPS } from "../../domain/workflow";
import { PROMPT_TEMPLATES } from "../../domain/prompt-catalog";
import { createCliContext } from "./context";
import { getStringArrayOption, getStringOption } from "./args";
import { ProvidedQuestionAdapter } from "../../adapters/questions/provided-question-adapter";
import { NodeCliQuestionAdapter } from "../../adapters/questions/node-cli-question-adapter";
import { CommandQuestionAdapter } from "../../adapters/questions/command-question-adapter";
import { CaptureQuestionsUseCase } from "../../application/use-cases/capture-questions";

export async function readQuestionEvidence(
  context: ReturnType<typeof createCliContext>,
  options: Record<string, string | boolean | string[]>,
  workflow: QuestionEvidence["workflow"]
): Promise<QuestionEvidence> {
  const questionPath = getStringOption(options, "questions");
  if (questionPath === undefined) {
    throw new SddError("Missing required option --questions. Persist grouped question evidence before running this command.", "MISSING_OPTION", 2);
  }

  const absolutePath = path.resolve(context.projectRoot, questionPath);
  const parsed = JSON.parse(await context.fs.readFile(absolutePath)) as Partial<QuestionEvidence>;
  const expectedPromptId = promptIdForWorkflow(workflow);
  const expectedPromptHash = hashPromptTemplate(expectedPromptId);
  if (parsed.workflow !== workflow) {
    throw new SddError(`Question evidence workflow mismatch. Expected '${workflow}', received '${parsed.workflow ?? "missing"}'.`, "INVALID_QUESTION_EVIDENCE", 2);
  }
  if (parsed.promptId !== expectedPromptId) {
    throw new SddError(`Question evidence promptId mismatch. Expected '${expectedPromptId}', received '${parsed.promptId ?? "missing"}'.`, "INVALID_QUESTION_EVIDENCE", 2);
  }
  if (parsed.promptHash !== expectedPromptHash) {
    throw new SddError(`Question evidence promptHash mismatch for '${expectedPromptId}'. Re-render the canonical prompt and recapture grouped question evidence.`, "INVALID_QUESTION_EVIDENCE", 2);
  }
  const answers = {
    ...(parsed.answers ?? {}),
    ...Object.fromEntries((parsed.questions ?? []).map((question) => [question.id, question.answer]))
  } as InterviewAnswers;
  return {
    id: parsed.id ?? `questions-${Date.now()}`,
    workflow,
    promptId: expectedPromptId,
    promptHash: expectedPromptHash,
    source: parsed.source ?? "manual",
    createdAt: parsed.createdAt ?? new Date().toISOString(),
    questions: parsed.questions,
    answers
  };
}

export function parseJtbd(options: Record<string, string | boolean | string[]>): JTBD {
  return {
    productName: requireOption(options, "product"),
    shortDescription: getStringOption(options, "description"),
    audience: requireOption(options, "audience"),
    problem: requireOption(options, "problem"),
    job: requireOption(options, "job"),
    situation: getStringOption(options, "situation"),
    motivation: getStringOption(options, "motivation"),
    desiredOutcome: getStringOption(options, "outcome"),
    stakeholders: getStringArrayOption(options, "stakeholder").map(parseStakeholder)
  };
}

export async function captureQuestions(
  context: ReturnType<typeof createCliContext>,
  options: Record<string, string | boolean | string[]>
): Promise<{ readonly path: string }> {
  const providedAnswers = getStringArrayOption(options, "answer");
  const commandAdapter = new CommandQuestionAdapter(context.fs, context.projectRoot);
  const useCommandAdapter = providedAnswers.length === 0 && await commandAdapter.isConfigured();
  const useCase = new CaptureQuestionsUseCase(
    context.fs,
    context.projectRoot,
    context.promptCatalog,
    providedAnswers.length > 0
      ? new ProvidedQuestionAdapter(parseQuestionAnswers(providedAnswers))
      : useCommandAdapter ? commandAdapter : new NodeCliQuestionAdapter(),
    context.workflow,
    context.telemetry,
    context.clock
  );
  return useCase.execute({
    workflow: parseQuestionWorkflow(requireOption(options, "workflow")),
    output: requireOption(options, "output"),
    source: useCommandAdapter ? "agent" : "manual"
  });
}

export function requireOption(options: Record<string, string | boolean | string[]>, key: string): string {
  const value = getStringOption(options, key);
  if (value === undefined || value.trim().length === 0) {
    throw new SddError(`Missing required option --${key}.`, "MISSING_OPTION", 2);
  }
  return value;
}

export function parseReviewDecisions(values: readonly string[]): readonly { readonly finding: string; readonly decision: "accepted" | "rejected" | "deferred"; readonly reason: string; readonly evidence?: readonly string[] }[] {
  return values.map((value) => {
    const [finding, decision, reason, evidenceRaw] = value.split("|");
    if (finding === undefined || decision === undefined || reason === undefined) {
      throw new SddError("--decision must use 'finding|accepted|reason', 'finding|rejected|reason', 'finding|deferred|reason', or append '|evidence/path'.", "INVALID_OPTION", 2);
    }
    if (!["accepted", "rejected", "deferred"].includes(decision)) {
      throw new SddError(`Invalid review decision '${decision}'.`, "INVALID_OPTION", 2);
    }
    return {
      finding,
      decision: decision as "accepted" | "rejected" | "deferred",
      reason,
      evidence: evidenceRaw === undefined ? undefined : evidenceRaw.split(",").map((item) => item.trim()).filter((item) => item.length > 0)
    };
  });
}

export function parseStepId(value: string): WorkflowStepId {
  const ids = new Set(COURSE_STEPS.map((step) => step.id));
  if (!ids.has(value as WorkflowStepId)) {
    throw new SddError(`Unknown workflow step '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as WorkflowStepId;
}

export function parseCheckpointKind(value: string): "context-reset" | "architect-review" | "app-walkthrough" | "merge-decision" | "supervisor-note" | "manual" {
  if (!["context-reset", "architect-review", "app-walkthrough", "merge-decision", "supervisor-note", "manual"].includes(value)) {
    throw new SddError(`Unknown checkpoint kind '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as "context-reset" | "architect-review" | "app-walkthrough" | "merge-decision" | "supervisor-note" | "manual";
}

export function parseBranchPurpose(value: string): "constitution" | "feature" | "replan" | "mvp" | "workflow" {
  if (!["constitution", "feature", "replan", "mvp", "workflow"].includes(value)) {
    throw new SddError(`Unknown branch purpose '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as "constitution" | "feature" | "replan" | "mvp" | "workflow";
}

export function parseTddEvidencePhase(value: string): TddEvidencePhase {
  if (!["red", "green", "refactor"].includes(value)) {
    throw new SddError(`Unknown TDD phase '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as TddEvidencePhase;
}

export function parseAgentProvider(value: string): AgentProvider {
  if (!["codex", "claude"].includes(value)) {
    throw new SddError(`Unknown agent provider '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as AgentProvider;
}

export function parseGreenfieldThrough(value: string): "constitution" | "feature" | "mvp" {
  if (!["constitution", "feature", "mvp"].includes(value)) {
    throw new SddError(`Unknown greenfield target '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as "constitution" | "feature" | "mvp";
}

export function parseOrchestratorProfile(value: string): OrchestratorProfile {
  if (value !== "human-intent-ai-build") {
    throw new SddError(`Unknown orchestrator profile '${value}'.`, "INVALID_OPTION", 2);
  }
  return value;
}

export function parseOrchestratorTarget(value: string): OrchestratorTarget {
  if (!["roadmap-next", "feature"].includes(value)) {
    throw new SddError(`Unknown orchestrator target '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as OrchestratorTarget;
}

export function parseOrchestratorOwner(value: string): OrchestratorOwner {
  if (!["human", "agent", "harness"].includes(value)) {
    throw new SddError(`Unknown orchestrator owner '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as OrchestratorOwner;
}

export function parseOrchestratorRepairOwner(value: string): OrchestratorRepairOwner {
  if (!["none", "agent", "human"].includes(value)) {
    throw new SddError(`Unknown orchestrator repair owner '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as OrchestratorRepairOwner;
}

export function parseNonNegativeInteger(value: string, optionName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || `${parsed}` !== value.trim()) {
    throw new SddError(`--${optionName} must be a non-negative integer.`, "INVALID_OPTION", 2);
  }
  return parsed;
}

export function parseReviewLenses(values: readonly string[]): readonly ReviewLens[] | undefined {
  if (values.length === 0) return undefined;
  return values.map((value) => {
    if (!["architecture", "spec-alignment", "test-and-qa", "experience-and-playwright"].includes(value)) {
      throw new SddError(`Unknown review lens '${value}'.`, "INVALID_OPTION", 2);
    }
    return value as ReviewLens;
  });
}

export function parsePromptId(value: string): PromptId {
  const ids = new Set(PROMPT_TEMPLATES.map((prompt) => prompt.id));
  if (!ids.has(value as PromptId)) {
    throw new SddError(`Unknown prompt id '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as PromptId;
}

export function parseQuestionWorkflow(value: string): QuestionWorkflow {
  if (!["constitution", "feature-spec", "semantic-contract", "mvp"].includes(value)) {
    throw new SddError(`Unknown question workflow '${value}'.`, "INVALID_OPTION", 2);
  }
  return value as QuestionWorkflow;
}

export function parseQuestionAnswers(values: readonly string[]): InterviewAnswers {
  const answers: Record<string, string> = {};
  for (const value of values) {
    const [key, ...answerParts] = value.split("=");
    const answer = answerParts.join("=");
    if (key === undefined || key.trim().length === 0 || answer.trim().length === 0) {
      throw new SddError("--answer must use key=value.", "INVALID_OPTION", 2);
    }
    answers[key.trim()] = answer.trim();
  }
  return answers as InterviewAnswers;
}

export function helpText(): string {
  return `SDD Harness

Usage: sdd <group> <command> [--project path]

Commands:
  stakeholder setup
  jtbd intake
  constitution create|validate|approve
  brownfield discover
  questions capture --workflow <workflow> --output <file> [--answer key=value]
  feature create|revise|semantics|validate-spec|approve|plan-tdd|implement|record-tdd|complete-task-group|run-validation|deep-review|semantic-verify|review-decisions|complete
  replan create|impact
  changelog update
  mvp plan|retro
  workflow status|next|doctor|checkpoint|branch|greenfield
  orchestrator init|configure|run|status|resume
  agent configure|doctor
  prompt list|show|render
  skill validate|scaffold
  export openspec|speckit
  research backlog

Spec-writing commands require persisted grouped question evidence via --questions. Use questions capture to create that evidence through the harness. Hard quality gates are enforced by default.

Orchestrator examples:
  sdd orchestrator init --agent codex --profile human-intent-ai-build
  sdd orchestrator configure --step create-semantic-contract --owner agent
  sdd orchestrator configure --step implement-feature --owner agent --tdd-command "npm test"
  sdd orchestrator configure --step feature-validation --owner harness --validation-command "npm run qa" --repair agent
  sdd orchestrator configure --step review-subagent-recommendations --owner harness --auto-record-empty-review-decisions
  sdd orchestrator configure --step semantic-verification --owner harness --waiver-reason "Accepted deterministic fixture risk" --approved-by Architect
  sdd orchestrator run --target roadmap-next
  sdd orchestrator resume

The human-intent-ai-build profile keeps stakeholder intent, constitution creation, feature-spec creation, review decisions, and MVP judgment steps human-owned by default. It delegates bounded semantic drafting, implementation, refactor, and repair packets to the configured agent, while harness-owned gates run existing CLI use cases. Agents cannot approve specs, accept review findings, or mark features complete directly.

Compatibility flags:
  --compat-tdd requires --waiver-reason and --approved-by for legacy task completion without command-backed red/green TDD records.
  --compat-playwright allows title-only Playwright stdout when JSON reporter evidence is unavailable.`;
}

function promptIdForWorkflow(workflow: QuestionEvidence["workflow"]): PromptId {
  if (workflow === "constitution") return "constitution.create";
  if (workflow === "semantic-contract") return "feature.semantics";
  if (workflow === "mvp") return "mvp.plan";
  return "feature.create";
}

function hashPromptTemplate(promptId: PromptId): string {
  const template = PROMPT_TEMPLATES.find((prompt) => prompt.id === promptId);
  return createHash("sha256").update(JSON.stringify(template ?? promptId)).digest("hex");
}

function parseStakeholder(input: string): StakeholderThought {
  const [nameAndRole = "Stakeholder", ...thoughtParts] = input.split("=");
  const thought = thoughtParts.join("=").trim();
  const roleMatch = /^(.*?)\((.*?)\)$/.exec(nameAndRole.trim());
  return {
    name: roleMatch?.[1]?.trim() || nameAndRole.trim(),
    role: roleMatch?.[2]?.trim(),
    thought: thought.length > 0 ? thought : "No thought provided."
  };
}
