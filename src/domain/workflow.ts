import {
  AutomationLevel,
  InterviewAnswers,
  QuestionEvidence,
  QualityGate,
  WorkflowState,
  WorkflowStepDefinition,
  WorkflowStepId,
  WorkflowStepState,
  WorkflowStepStatus
} from "./models";

export const COURSE_STEPS: readonly WorkflowStepDefinition[] = [
  step("setup-stakeholder-thoughts", 1, "Setup & Stakeholder Thoughts", "guided", "sdd stakeholder setup", ["README stakeholder thoughts"]),
  step("create-constitution", 2, "Create Constitution", "enforced", "sdd constitution create", ["grouped constitution question evidence", "specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md"]),
  step("validate-constitution", 3, "Validate Constitution", "enforced", "sdd constitution validate", ["constitution validation gates", "constitution approval record"]),
  step("clear-context-before-feature-spec", 4, "Clear Context Before Feature Spec", "manual_checkpoint", "sdd workflow checkpoint --kind context-reset", ["context reset checkpoint"]),
  step("create-feature-spec", 5, "Create Feature Spec", "enforced", "sdd feature create", ["grouped feature question evidence including experience", "requirements.md", "plan.md", "validation.md", "experience.md when UI-facing"]),
  step("iterate-feature-spec", 6, "Iterate On Feature Spec", "guided", "sdd feature revise", ["revision notes or no-change checkpoint"]),
  step("create-semantic-contract", 6.5, "Create Semantic Contract", "enforced", "sdd feature semantics", ["grouped semantic question evidence", "semantics.md", "semantic contract JSON"]),
  step("validate-final-feature-spec", 7, "Validate Final Feature Spec", "enforced", "sdd feature validate-spec && sdd feature approve", ["feature validation gates including experience completeness", "feature approval record"]),
  step("clear-context-before-implementation", 8, "Clear Context Before Implementation", "manual_checkpoint", "sdd workflow checkpoint --kind context-reset", ["context reset checkpoint"]),
  step("implement-feature", 9, "Implement Feature", "enforced", "sdd feature implement", ["implementation packet", "task group progress"]),
  step("feature-validation", 10, "Feature Validation", "enforced", "sdd feature run-validation", ["validation summary", "evidence logs"]),
  step("replanning", 11, "Replanning", "guided", "sdd replan create", ["replan artifact", "impact review"]),
  step("new-idea-skill", 12, "New Idea: Skill", "guided", "sdd skill scaffold", ["skill artifact", "skill validation"]),
  step("repeat-feature-step", 13, "Repeat Feature Step", "guided", "sdd workflow next", ["next feature selection"]),
  step("further-validation", 14, "Further Validation", "enforced", "sdd feature run-validation", ["additional validation evidence"]),
  step("validate-not-lied-to", 15, "Validate Not Lied To", "enforced", "sdd feature deep-review", ["deep review packet"]),
  step("semantic-verification", 15.5, "Semantic Verification", "enforced", "sdd feature semantic-verify", ["semantic verification summary", "semantic evidence packet"]),
  step("review-subagent-recommendations", 16, "Review Subagent Recommendations", "enforced", "sdd feature review-decisions", ["review decision record"]),
  step("run-changelog-skill", 17, "Run Changelog Skill", "enforced", "sdd changelog update", ["CHANGELOG.md evidence"]),
  step("mvp-spec-branch", 18, "MVP Spec On Branch", "enforced", "sdd mvp plan", ["MVP confidence gates", "MVP feature spec"]),
  step("validation-of-mvp", 19, "Validation Of MVP", "enforced", "sdd mvp retro", ["MVP retrospective"]),
  step("create-auto-workflow-with-skills", 20, "Create Auto Workflow With Skills", "guided", "sdd skill validate", ["validated skill wrappers"]),
  step("brownfield-discovery", 0, "Brownfield Discovery", "guided", "sdd brownfield discover", ["brownfield profile"])
];

export function createInitialWorkflowState(now: string): WorkflowState {
  const steps = {} as Record<WorkflowStepId, WorkflowStepState>;
  for (const definition of COURSE_STEPS) {
    steps[definition.id] = {
      ...definition,
      status: definition.id === "setup-stakeholder-thoughts" || definition.id === "brownfield-discovery" ? "ready" : "not_started",
      evidence: [],
      blockers: [],
      updatedAt: now
    };
  }

  return {
    version: 1,
    initializedAt: now,
    updatedAt: now,
    steps
  };
}

export function mergeWorkflowStep(
  state: WorkflowState,
  stepId: WorkflowStepId,
  now: string,
  update: {
    readonly status?: WorkflowStepStatus;
    readonly evidence?: readonly string[];
    readonly blockers?: readonly string[];
    readonly branch?: string;
    readonly featureId?: string;
    readonly waiver?: WorkflowStepState["waiver"];
  }
): WorkflowState {
  const current = state.steps[stepId] ?? createInitialWorkflowState(now).steps[stepId];
  const nextStep: WorkflowStepState = {
    ...current,
    status: update.status ?? current.status,
    evidence: unique([...(current.evidence ?? []), ...(update.evidence ?? [])]),
    blockers: update.blockers ?? current.blockers,
    branch: update.branch ?? current.branch,
    featureId: update.featureId ?? current.featureId,
    waiver: update.waiver ?? current.waiver,
    updatedAt: now
  };

  return {
    ...state,
    updatedAt: now,
    steps: {
      ...state.steps,
      [stepId]: nextStep
    }
  };
}

export function nextWorkflowStep(state: WorkflowState): WorkflowStepState | undefined {
  return COURSE_STEPS
    .filter((stepDefinition) => stepDefinition.number > 0)
    .map((stepDefinition) => state.steps[stepDefinition.id])
    .find((stepState) => stepState.status !== "complete" && stepState.status !== "waived");
}

export function requireQuestionEvidence(
  evidence: QuestionEvidence | undefined,
  workflow: QuestionEvidence["workflow"],
  requiredKeys: readonly (keyof InterviewAnswers)[]
): QualityGate[] {
  return requiredKeys.map((key) => {
    const value = evidence?.answers[key] ?? evidence?.questions?.find((question) => question.id === key)?.answer;
    const passed = evidence?.workflow === workflow && typeof value === "string" && value.trim().length > 0;
    return {
      id: `${workflow}.questions.${String(key)}`,
      name: `${workflow} grouped question: ${String(key)}`,
      severity: "blocking",
      passed,
      message: passed
        ? `Grouped question evidence captured '${String(key)}'.`
        : `Hard gate: '${String(key)}' must be present in persisted grouped question evidence before writing ${workflow} artifacts.`
    };
  });
}

function step(
  id: WorkflowStepId,
  number: number,
  title: string,
  automationLevel: AutomationLevel,
  command: string,
  requiredEvidence: readonly string[]
): WorkflowStepDefinition {
  return { id, number, title, automationLevel, command, requiredEvidence };
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}
