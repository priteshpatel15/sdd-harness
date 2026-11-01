import path from "node:path";
import { createHash } from "node:crypto";
import { GUIDED_DRAFT_SCHEMA } from "../../domain/agent-schemas";
import { GateError, ValidationError } from "../../domain/errors";
import { AgentImplementationResult, AgentProvider, GuidedDraft, InterviewAnswers, QuestionEvidence, TaskGroupProgress } from "../../domain/models";
import { evaluateAgentChangeScope, evaluateGuidedDraftSchema, evaluateTddSourceEvidence, isRealTestFilePath, normalizeChangedFiles } from "../../domain/orchestrator-policy";
import { OrchestratorConfig, ResolvedOrchestratorStepPolicy } from "../../domain/orchestrator";
import { parsePlanTaskGroups } from "../../domain/spec-validation";
import { AgentProviderPort, ClockPort, FileSystemPort, PromptCatalogPort, SpecStorePort, WorkflowStatePort } from "../ports";
import { CompleteTaskGroupUseCase } from "./complete-task-group";
import { CreateFeatureSpecUseCase } from "./create-feature-spec";
import { CreateSemanticContractUseCase } from "./create-semantic-contract";
import { ImplementTaskGroupUseCase } from "./implement-task-group";
import { PlanTddUseCase } from "./plan-tdd";
import { RecordTddEvidenceUseCase } from "./record-tdd-evidence";

export class OrchestratorAgentWorkflows {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly store: SpecStorePort,
    private readonly workflow: WorkflowStatePort,
    private readonly promptCatalog: PromptCatalogPort,
    private readonly agentProvider: AgentProviderPort,
    private readonly projectRoot: string,
    private readonly createFeatureSpecUseCase: CreateFeatureSpecUseCase,
    private readonly createSemanticContractUseCase: CreateSemanticContractUseCase,
    private readonly planTdd: PlanTddUseCase,
    private readonly implementTaskGroup: ImplementTaskGroupUseCase,
    private readonly recordTddEvidence: RecordTddEvidenceUseCase,
    private readonly completeTaskGroup: CompleteTaskGroupUseCase,
    private readonly clock: ClockPort
  ) {}

  public async createFeatureSpec(policy: ResolvedOrchestratorStepPolicy, config: OrchestratorConfig): Promise<readonly string[]> {
    const draft = await this.agentDraft<Required<Pick<InterviewAnswers, "scope" | "decisions" | "context" | "experience">>>(
      config.agentProvider,
      "feature",
      await this.renderFeatureDraftPrompt()
    );
    const evidence = this.questionEvidence("feature-spec", "feature.create", {
      scope: requireAnswer(draft.answers.scope, "feature.answers.scope"),
      decisions: requireAnswer(draft.answers.decisions, "feature.answers.decisions"),
      context: requireAnswer(draft.answers.context, "feature.answers.context"),
      experience: requireAnswer(draft.answers.experience, "feature.answers.experience")
    });
    const draftPath = await this.writeQuestionDraft(`feature-${safeTimestamp(this.now())}.json`, evidence);
    const result = await this.createFeatureSpecUseCase.execute({
      questionEvidence: evidence,
      waiverReason: policy.waiverReason,
      approvedBy: policy.approvedBy
    });
    return [
      draft.promptPath,
      draft.schemaPath,
      draft.outputPath,
      draft.thinkingPath,
      draftPath,
      `specs/${result.featureId}/requirements.md`,
      `specs/${result.featureId}/plan.md`,
      `specs/${result.featureId}/validation.md`
    ];
  }

  public async createSemanticContract(featureId: string, provider: AgentProvider): Promise<readonly string[]> {
    const draft = await this.agentDraft<Required<Pick<InterviewAnswers, "actors" | "outcomes" | "entities" | "commands" | "states" | "invariants" | "scenarios" | "oracles" | "data" | "telemetry" | "architecture">>>(
      provider,
      "semantic",
      await this.renderSemanticDraftPrompt(featureId),
      featureId
    );
    const evidence: QuestionEvidence = this.questionEvidence("semantic-contract", "feature.semantics", {
      actors: requireAnswer(draft.answers.actors, "semantic.answers.actors"),
      outcomes: requireAnswer(draft.answers.outcomes, "semantic.answers.outcomes"),
      entities: requireAnswer(draft.answers.entities, "semantic.answers.entities"),
      commands: requireAnswer(draft.answers.commands, "semantic.answers.commands"),
      states: requireAnswer(draft.answers.states, "semantic.answers.states"),
      invariants: requireAnswer(draft.answers.invariants, "semantic.answers.invariants"),
      scenarios: requireAnswer(draft.answers.scenarios, "semantic.answers.scenarios"),
      oracles: requireAnswer(draft.answers.oracles, "semantic.answers.oracles"),
      data: requireAnswer(draft.answers.data, "semantic.answers.data"),
      telemetry: requireAnswer(draft.answers.telemetry, "semantic.answers.telemetry"),
      architecture: requireAnswer(draft.answers.architecture, "semantic.answers.architecture")
    });
    const draftPath = await this.writeQuestionDraft(`semantic-${featureId}.json`, evidence);
    const result = await this.createSemanticContractUseCase.execute({ featureId, questionEvidence: evidence });
    return [draft.promptPath, draft.schemaPath, draft.outputPath, draft.thinkingPath, draftPath, result.path, `.sdd/semantic-contracts/${featureId}.json`];
  }

  public async implementFeature(
    featureId: string,
    policy: ResolvedOrchestratorStepPolicy,
    provider: AgentProvider
  ): Promise<readonly string[]> {
    await this.planTdd.execute(featureId);
    const packet = await this.implementTaskGroup.execute({ featureId });
    const files = await this.store.readFeatureFiles(featureId);
    const plannedGroups = parsePlanTaskGroups(files.plan);
    const progress = await this.workflow.readArtifacts<TaskGroupProgress>("task-groups");
    const complete = new Set(progress.filter((item) => item.featureId === featureId && (item.status === "complete" || item.status === "waived")).map((item) => item.taskGroup));
    const evidencePaths: string[] = packet.packetPath !== undefined ? [packet.packetPath] : [];
    const tddCommand = policy.tddCommand ?? "npm test";

    for (const group of plannedGroups.filter((item) => !complete.has(item.id))) {
      const red = await this.runImplementationPhase(provider, featureId, group.id, "red", "Create or update only failing tests and test evidence for this task group. Do not implement the production fix yet.");
      this.assertAgentChangeScope(red);
      this.assertRedPhaseTouchedRealTestFile(red);
      const redTestRefs = tddTestRefs(red.changedFilesAfter, group.id);
      const redEvidence = await this.writeTddEvidenceFile(featureId, group.id, "red", [red.evidencePath]);
      const redRef = `${path.relative(this.projectRoot, redEvidence)}::${group.id}::VAL-001`;
      await this.recordTddEvidence.execute({ featureId, taskGroup: group.id, phase: "red", evidence: [...redTestRefs, redRef], command: tddCommand });

      const green = await this.runImplementationPhase(provider, featureId, group.id, "green", "Implement the smallest production change that makes the recorded red test pass, then update the same test evidence.");
      this.assertAgentChangeScope(green);
      const sourceEvidence = evaluateTddSourceEvidence({
        taskGroup: group.id,
        redChangedFiles: red.changedFilesAfter,
        greenChangedFiles: green.changedFilesAfter
      });
      assertTddSourceEvidence(sourceEvidence, green.evidencePath);
      const sharedTestRefs = sourceEvidence.sharedTestFiles.map((file) => `${file}::${group.id}::VAL-001`);
      const greenEvidence = await this.writeTddEvidenceFile(featureId, group.id, "green", [red.evidencePath, green.evidencePath]);
      const greenRef = `${path.relative(this.projectRoot, greenEvidence)}::${group.id}::VAL-001`;
      await this.recordTddEvidence.execute({ featureId, taskGroup: group.id, phase: "green", evidence: [...sharedTestRefs, greenRef], command: tddCommand });

      let implementationEvidencePath = green.evidencePath;
      const testEvidence = sharedTestRefs;
      if (policy.refactorEnabled) {
        const refactor = await this.runImplementationPhase(provider, featureId, group.id, "refactor", "Refactor the task-group implementation without changing approved behavior. Keep the green test passing and update evidence if needed.");
        this.assertAgentChangeScope(refactor);
        const refactorSourceEvidence = evaluateTddSourceEvidence({
          taskGroup: group.id,
          redChangedFiles: red.changedFilesAfter,
          greenChangedFiles: green.changedFilesAfter,
          refactorChangedFiles: refactor.changedFilesAfter
        });
        assertTddSourceEvidence(refactorSourceEvidence, refactor.evidencePath);
        const refactorEvidence = await this.writeTddEvidenceFile(featureId, group.id, "refactor", [red.evidencePath, green.evidencePath, refactor.evidencePath]);
        const refactorRef = `${path.relative(this.projectRoot, refactorEvidence)}::${group.id}::VAL-001`;
        await this.recordTddEvidence.execute({ featureId, taskGroup: group.id, phase: "refactor", evidence: [...sharedTestRefs, refactorRef], command: tddCommand });
        implementationEvidencePath = refactor.evidencePath;
        evidencePaths.push(refactor.evidencePath, refactorEvidence);
      }

      await this.completeTaskGroup.execute({
        featureId,
        taskGroup: group.id,
        implementationEvidence: [`${path.relative(this.projectRoot, implementationEvidencePath)}::${group.id}`],
        testEvidence,
        strictTdd: true
      });
      complete.add(group.id);
      evidencePaths.push(red.evidencePath, green.evidencePath, redEvidence, greenEvidence, ...sourceEvidence.sharedTestFiles);
    }

    await this.assertAllPlannedGroupsComplete(featureId, plannedGroups.map((group) => group.id));
    await this.workflow.updateStep("implement-feature", { status: "complete", featureId, evidence: evidencePaths });
    await this.workflow.updateStep("feature-validation", { status: "ready", featureId });
    return evidencePaths;
  }

  public async repair(provider: AgentProvider, featureId: string, stepId: string, errorMessage: string, evidencePaths: readonly string[]): Promise<readonly string[]> {
    const result = await this.agentProvider.implement({
      provider,
      phase: "repair",
      projectRoot: this.projectRoot,
      featureId,
      taskGroup: stepId,
      prompt: repairPrompt(featureId, stepId, errorMessage, evidencePaths)
    });
    if (result.exitCode !== 0) {
      throw new GateError(`Agent repair failed for ${stepId} with exit code ${result.exitCode}.`);
    }
    return [result.evidencePath];
  }

  private async runImplementationPhase(provider: AgentProvider, featureId: string, taskGroup: string, phase: "red" | "green" | "refactor", instruction: string): Promise<AgentImplementationResult> {
    const result = await this.agentProvider.implement({
      provider,
      phase,
      projectRoot: this.projectRoot,
      featureId,
      taskGroup,
      prompt: implementationPrompt(featureId, taskGroup, phase, instruction)
    });
    if (result.exitCode !== 0) {
      throw new GateError(`Agent ${phase} phase failed for ${taskGroup} with exit code ${result.exitCode}.`);
    }
    return result;
  }

  private assertAgentChangeScope(result: AgentImplementationResult): void {
    const scope = evaluateAgentChangeScope({
      featureId: result.featureId,
      taskGroup: result.taskGroup ?? result.featureId,
      phase: result.phase,
      changedFiles: result.changedFilesAfter
    });
    if (!scope.passed) {
      const message = scope.findings.map((finding) => `${finding.message} Files: ${finding.files.join(", ") || "none"}`).join(" ");
      throw new GateError(`Hard gate: ${message}`, "GATE_FAILED", [{
        id: "orchestrator.agent.scope",
        name: "Agent change scope",
        severity: "blocking",
        passed: false,
        message,
        evidencePath: result.evidencePath
      }]);
    }
  }

  private assertRedPhaseTouchedRealTestFile(result: AgentImplementationResult): void {
    const testFiles = normalizeChangedFiles(result.changedFilesAfter).filter(isRealTestFilePath);
    if (testFiles.length === 0) {
      const message = `Red phase for '${result.taskGroup ?? result.featureId}' must create or modify a real test source file. Changed files: ${normalizeChangedFiles(result.changedFilesAfter).join(", ") || "none"}.`;
      throw new GateError(`Hard gate: ${message}`, "GATE_FAILED", [{
        id: "orchestrator.tdd.red-real-test",
        name: "Red phase real test source",
        severity: "blocking",
        passed: false,
        message,
        evidencePath: result.evidencePath
      }]);
    }
  }

  private async assertAllPlannedGroupsComplete(featureId: string, plannedGroupIds: readonly string[]): Promise<void> {
    const progress = await this.workflow.readArtifacts<TaskGroupProgress>("task-groups");
    const completedGroups = new Set(progress.filter((item) => item.featureId === featureId && (item.status === "complete" || item.status === "waived")).map((item) => item.taskGroup));
    const missing = plannedGroupIds.filter((groupId) => !completedGroups.has(groupId));
    if (missing.length > 0) {
      throw new GateError(`Orchestrator implementation did not complete planned task groups: ${missing.join(", ")}.`);
    }
  }

  private async agentDraft<TAnswers extends Record<string, string | undefined>>(provider: AgentProvider, purpose: "feature" | "semantic", prompt: string, featureId?: string): Promise<GuidedDraft<TAnswers> & { readonly promptPath: string; readonly schemaPath: string; readonly outputPath: string; readonly thinkingPath: string }> {
    const result = await this.agentProvider.draft({ provider, purpose, prompt, schema: GUIDED_DRAFT_SCHEMA[purpose], projectRoot: this.projectRoot, featureId });
    const schemaResult = evaluateGuidedDraftSchema({ schema: GUIDED_DRAFT_SCHEMA[purpose], value: result.parsed, label: purpose });
    if (!schemaResult.passed) {
      const message = schemaResult.findings.map((finding) => `${finding.path}: ${finding.message}`).join("; ");
      throw new ValidationError(`Agent ${purpose} draft failed schema validation: ${message}`);
    }
    const draft = parseGuidedDraft<TAnswers>(result.parsed, purpose);
    const thinkingPath = await this.writeThinking(purpose, draft, featureId);
    return { ...draft, promptPath: result.promptPath, schemaPath: result.schemaPath, outputPath: result.outputPath, thinkingPath };
  }

  private async renderFeatureDraftPrompt(): Promise<string> {
    const template = this.promptCatalog.get("feature.create");
    const context = ["README.md", "specs/jtbd.md", "specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md"];
    return `# Agent Feature Spec Draft

Draft only grouped feature-spec question answers. Return JSON matching the provided schema. The harness will write feature files; do not edit files directly.

## Canonical Prompt

${template?.instruction ?? "Create a feature spec from the roadmap."}

## Context

${(await Promise.all(context.map(async (file) => `### ${file}\n\n${await this.readContext(file)}`))).join("\n\n")}
`;
  }

  private async renderSemanticDraftPrompt(featureId: string): Promise<string> {
    const template = this.promptCatalog.get("feature.semantics");
    const contextFiles = [`specs/${featureId}/requirements.md`, `specs/${featureId}/plan.md`, `specs/${featureId}/validation.md`, `specs/${featureId}/experience.md`];
    return `# Agent Semantic Contract Draft

Feature: ${featureId}

Draft semantic-contract grouped question answers. Return only JSON matching the provided schema. The harness will validate and write the semantic contract; do not edit files directly.

## Canonical Prompt

${template?.instruction ?? "Create a semantic contract for the feature before approval."}

## Context

${(await Promise.all(contextFiles.map(async (file) => `### ${file}\n\n${await this.readContext(file)}`))).join("\n\n")}
`;
  }

  private async readContext(file: string): Promise<string> {
    const filePath = path.join(this.projectRoot, file);
    return (await this.fs.exists(filePath)) ? this.fs.readFile(filePath) : "Not found.";
  }

  private questionEvidence(workflow: QuestionEvidence["workflow"], promptId: QuestionEvidence["promptId"], answers: InterviewAnswers): QuestionEvidence {
    return { id: `${workflow}-questions-${this.now()}`, workflow, promptId, promptHash: this.promptHash(promptId), source: "agent", createdAt: this.now(), answers };
  }

  private promptHash(promptId: QuestionEvidence["promptId"]): string | undefined {
    return promptId === undefined ? undefined : createHash("sha256").update(JSON.stringify(this.promptCatalog.get(promptId) ?? promptId)).digest("hex");
  }

  private async writeQuestionDraft(fileName: string, evidence: QuestionEvidence): Promise<string> {
    const outputPath = path.join(this.projectRoot, ".sdd", "question-drafts", fileName);
    await this.fs.writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
    return outputPath;
  }

  private async writeThinking(purpose: string, draft: GuidedDraft<Record<string, string | undefined>>, featureId?: string): Promise<string> {
    const suffix = featureId ?? "project";
    const outputPath = path.join(this.projectRoot, ".sdd", "thinking", `${safeTimestamp(this.now())}-${purpose}-${suffix}.md`);
    await this.fs.writeFile(outputPath, `# Orchestrator Agent Thinking: ${purpose}

## Thinking

${draft.thinking}

## Unresolved Questions

${(draft.questions ?? []).map((question) => `- ${question}`).join("\n") || "- None"}

## Risks

${(draft.risks ?? []).map((risk) => `- ${risk}`).join("\n") || "- None"}
`);
    return outputPath;
  }

  private async writeTddEvidenceFile(featureId: string, taskGroup: string, phase: "red" | "green" | "refactor", evidencePaths: readonly string[]): Promise<string> {
    const outputPath = path.join(this.projectRoot, ".sdd", "orchestrator-evidence", featureId, `${taskGroup}-${phase}.md`);
    await this.fs.writeFile(outputPath, `# Orchestrator TDD Evidence

Feature: ${featureId}
Task group: ${taskGroup}
Phase: ${phase}
Validation: VAL-001

## Agent Evidence

${evidencePaths.map((item) => `- ${path.relative(this.projectRoot, item)}`).join("\n")}
`);
    return outputPath;
  }

  private now(): string {
    return this.clock.now().toISOString();
  }
}

function parseGuidedDraft<TAnswers extends Record<string, string | undefined>>(value: unknown, purpose: string): GuidedDraft<TAnswers> {
  if (typeof value !== "object" || value === null || !("answers" in value)) {
    throw new ValidationError(`Agent ${purpose} draft did not include answers.`);
  }
  const draft = value as Partial<GuidedDraft<TAnswers>>;
  if (typeof draft.thinking !== "string" || draft.thinking.trim().length === 0) {
    throw new ValidationError(`Agent ${purpose} draft did not include written thinking.`);
  }
  if (typeof draft.answers !== "object" || draft.answers === null) {
    throw new ValidationError(`Agent ${purpose} draft answers were invalid.`);
  }
  return {
    thinking: draft.thinking,
    questions: Array.isArray(draft.questions) ? draft.questions : [],
    risks: Array.isArray(draft.risks) ? draft.risks : [],
    answers: draft.answers
  };
}

function requireAnswer(value: string | undefined, field: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new ValidationError(`Agent draft is missing ${field}.`);
  }
  return value;
}

function tddTestRefs(changedFiles: readonly string[], taskGroup: string): readonly string[] {
  return normalizeChangedFiles(changedFiles)
    .filter(isRealTestFilePath)
    .map((file) => `${file}::${taskGroup}::VAL-001`);
}

function assertTddSourceEvidence(result: ReturnType<typeof evaluateTddSourceEvidence>, evidencePath: string): void {
  if (result.passed) {
    return;
  }
  const message = result.findings.map((finding) => `${finding.message} Files: ${finding.files.join(", ") || "none"}`).join(" ");
  throw new GateError(`Hard gate: ${message}`, "GATE_FAILED", [{
    id: "orchestrator.tdd.source-files",
    name: "Real TDD source-file proof",
    severity: "blocking",
    passed: false,
    message,
    evidencePath
  }]);
}

function implementationPrompt(featureId: string, taskGroup: string, phase: string, instruction: string): string {
  return `# Orchestrated Implementation

Feature: ${featureId}
Task group: ${taskGroup}
Phase: ${phase}

## Instruction

${instruction}

## Required Harness Contract

- Keep changes scoped to this task group.
- Maintain Clean Architecture and SOLID boundaries.
- Ensure the command configured for TDD proves the phase.
- Preserve approved specs unless the harness explicitly asks for a spec revision.
- Write substantive test/evidence content; placeholder files are rejected.
`;
}

function repairPrompt(featureId: string, stepId: string, errorMessage: string, evidencePaths: readonly string[]): string {
  return `# Orchestrator Repair Packet

Feature: ${featureId}
Failed step: ${stepId}

## Failure

${errorMessage}

## Evidence Paths

${evidencePaths.length > 0 ? evidencePaths.map((item) => `- ${item}`).join("\n") : "- No gate evidence paths were reported."}

## Rerun Target

sdd orchestrator resume

## Instruction

Fix only the concrete failure above. Preserve the approved specs, Clean Architecture boundaries, TDD evidence, UI Playwright coverage, isolated test database behavior, and telemetry evidence. The harness will rerun the failed gate after this repair attempt.
`;
}

function safeTimestamp(value: string): string {
  return value.replace(/[:.]/g, "-");
}
