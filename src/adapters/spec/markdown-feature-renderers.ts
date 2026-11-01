import { FeatureSpec, InterviewAnswers, Requirement, RoadmapPhase, TaskGroup, ValidationCase } from "../../domain/models";
import { detectDataMutationWork, featureAnswersRequireExperience } from "../../domain/spec-validation";

export function buildTaskGroups(
  name: string,
  answers: Required<Pick<InterviewAnswers, "scope" | "decisions" | "context">>,
  sourcePhase: RoadmapPhase | undefined,
  mvp: boolean
): TaskGroup[] {
  const roadmapTasks = sourcePhase?.items.map((item, index) => ({
    id: `task-roadmap-${index + 1}`,
    text: `Deliver roadmap item: ${item.text}`,
    done: false,
    requirementIds: ["REQ-001"],
    validationIds: ["VAL-001"]
  })) ?? [];
  const decisionTasks = statementTasks("task-decision", "Apply decision", answers.decisions, "REQ-002", "VAL-002");
  const contextTasks = statementTasks("task-context", "Honor context", answers.context, "REQ-003", "VAL-002");

  return [
    {
      id: "group-1-tests-first",
      title: "Tests First",
      tasks: [
        { id: "task-1-1", text: `Write unit and module tests for ${name}.`, done: false, requirementIds: ["REQ-001"], validationIds: ["VAL-001"] },
        { id: "task-1-2", text: "Add integration tests for changed adapters, persistence, or CLI behavior.", done: false, requirementIds: ["REQ-002"], validationIds: ["VAL-002"] },
        { id: "task-1-3", text: "Add Playwright workflow tests if UI behavior is in scope.", done: false, requirementIds: ["REQ-003"], validationIds: ["VAL-003"] }
      ]
    },
    {
      id: "group-2-implementation",
      title: mvp ? "MVP Implementation" : "Implementation",
      tasks: roadmapTasks.length > 0
        ? [...roadmapTasks, ...decisionTasks.slice(0, 2), ...contextTasks.slice(0, 1)]
        : [
            { id: "task-2-1", text: `Implement the scope: ${answers.scope}`, done: false, requirementIds: ["REQ-001"], validationIds: ["VAL-001"] },
            ...(decisionTasks.length > 0 ? decisionTasks : [{ id: "task-2-2", text: `Apply decisions: ${answers.decisions}`, done: false, requirementIds: ["REQ-002"], validationIds: ["VAL-002"] }]),
            ...contextTasks
          ]
    },
    {
      id: "group-3-validation",
      title: "Validation And Evidence",
      tasks: [
        { id: "task-3-1", text: "Run typecheck, unit tests, integration tests, and build.", done: false, requirementIds: ["REQ-001"], validationIds: ["VAL-001", "VAL-002"] },
        { id: "task-3-2", text: "Run UI/e2e tests against an isolated test database copy when applicable.", done: false, requirementIds: ["REQ-003"], validationIds: ["VAL-003"] },
        { id: "task-3-3", text: "Record telemetry, review findings, and final acceptance evidence.", done: false, requirementIds: ["REQ-004"], validationIds: ["VAL-004"] }
      ]
    }
  ];
}

export function buildValidationCases(name: string, answers: Required<Pick<InterviewAnswers, "scope" | "decisions" | "context" | "experience">>): ValidationCase[] {
  const requirements = buildRequirementList(answers);
  const combined = `${answers.scope}\n${answers.decisions}\n${answers.context}`;
  const uiFacing = featureAnswersRequireExperience(answers, combined);
  const dataMutating = detectDataMutationWork(combined);
  return [
    { id: "VAL-001", kind: "unit", description: `Unit and module tests prove ${requirements[0]?.id ?? "REQ-001"} for ${name}.`, command: "npm test" },
    { id: "VAL-002", kind: "typecheck", description: `Typecheck/build constraints prove ${requirements[1]?.id ?? "REQ-002"} and architecture assumptions.`, command: "npm run typecheck" },
    {
      id: "VAL-003",
      kind: uiFacing ? "ui" : dataMutating ? "integration" : "manual",
      description: uiFacing
        ? `Playwright JSON reporter evidence proves ${requirements.find((item) => /experience|ui|database/i.test(item.statement))?.id ?? "REQ-003"} for mapped UI flows.`
        : dataMutating
          ? "Integration validation proves expected data mutations against an isolated test database copy."
          : "If UI or data behavior is later touched, add mapped Playwright or isolated data validation before completion.",
      command: uiFacing ? "npm run test:e2e" : dataMutating ? "npm test" : undefined
    },
    { id: "VAL-004", kind: "manual", description: `Manual acceptance confirms ${requirements.map((requirement) => requirement.id).join(", ")}.` }
  ];
}

export function renderFeatureRequirements(feature: FeatureSpec): string {
  const requirements = buildRequirementList(feature);
  return `# Requirements: ${feature.name}

## Scope

${feature.scope}

## Decisions

${feature.decisions}

## Context

${feature.context}

## Experience Intent

${feature.experience ?? "No experience answer recorded."}

## Requirements

${requirements.map((requirement) => `- **${requirement.id}:** ${requirement.statement}`).join("\n")}
`;
}

export function renderFeaturePlan(feature: FeatureSpec): string {
  return `# Plan: ${feature.name}

${feature.taskGroups
    .map((group, groupIndex) => `## ${groupIndex + 1}. ${group.title}

Group ID: \`${group.id}\`

${group.tasks.map((task, taskIndex) => `${taskIndex + 1}. [ ] ${task.text} (Requirements: ${task.requirementIds.join(", ")}; Validation: ${task.validationIds.join(", ")})`).join("\n")}`)
    .join("\n\n")}
`;
}

export function renderFeatureValidation(feature: FeatureSpec): string {
  return `# Validation: ${feature.name}

## Automated

${feature.validationCases
    .filter((validationCase) => validationCase.kind !== "manual")
    .map((validationCase) => `- **${validationCase.id}:** ${validationCase.description}${validationCase.command ? ` Command: \`${validationCase.command}\`.` : ""}`)
    .join("\n")}

## Manual

${feature.validationCases
    .filter((validationCase) => validationCase.kind === "manual")
    .map((validationCase) => `- **${validationCase.id}:** ${validationCase.description}`)
    .join("\n")}

## Definition Of Done

- All automated checks pass.
- Manual acceptance matches \`requirements.md\`.
- UI work has Playwright workflow coverage.
- Database changes use an isolated test copy for validation.
- Telemetry and evidence are recorded under \`.sdd/\`.
`;
}

export function renderFeatureExperience(feature: FeatureSpec): string {
  const experience = normalizeExperienceAnswer(feature.experience ?? "");
  return `# Experience: ${feature.name}

${experience}

## Coverage Mapping Rules

- Every \`FLOW-*\` entry must include a non-TODO \`Playwright:\` reference.
- Every \`FLOW-*\` entry must include \`Database Mutations:\`; read-only flows must say \`Database Mutations: None\`.
- The Playwright reference must identify a Playwright test file and test title with \`path::title\`.
- Data-changing workflows must run against an isolated test database copy.
`;
}

function buildRequirementList(answers: Pick<FeatureSpec, "scope" | "decisions" | "context"> & { readonly experience?: string }): Requirement[] {
  const uiFacing = featureAnswersRequireExperience({
    scope: answers.scope,
    decisions: answers.decisions,
    context: answers.context,
    experience: answers.experience
  });
  return [
    { id: "REQ-001", statement: `Scope: deliver ${singleLine(answers.scope)}.` },
    { id: "REQ-002", statement: `Decision: preserve ${singleLine(answers.decisions)}.` },
    { id: "REQ-003", statement: `Context: honor ${singleLine(answers.context)}.` },
    {
      id: "REQ-004",
      statement: uiFacing
        ? "Experience and data: implement the UI/data flows recorded in experience.md with Playwright coverage and isolated test data when mutations occur."
        : "Experience and data: preserve the explicit non-UI rationale and avoid adding unvalidated browser or database workflows."
    },
    { id: "REQ-005", statement: "Evidence: record validation, review, semantic verification, and telemetry evidence under .sdd/." }
  ];
}

function statementTasks(prefix: string, verb: string, value: string, requirementId: string, validationId: string): TaskGroup["tasks"] {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter((item) => item.length > 0)
    .map((item, index) => ({
      id: `${prefix}-${index + 1}`,
      text: `${verb}: ${item}`,
      done: false,
      requirementIds: [requirementId],
      validationIds: [validationId]
    }));
}

function normalizeExperienceAnswer(experience: string): string {
  const trimmed = experience.trim().replace(/^#\s+Experience:.*(?:\r?\n)+/i, "").trim();
  if (/^##\s+/m.test(trimmed)) return trimmed;
  if (/^###\s+FLOW-[A-Za-z0-9_-]+/im.test(trimmed)) return `## Experience Flows\n\n${trimmed}`;
  return `## Experience Flows\n\n### FLOW-001: Primary workflow\n\n${trimmed}`;
}

function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
