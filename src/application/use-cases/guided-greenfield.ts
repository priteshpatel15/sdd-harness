import path from "node:path";
import { createHash } from "node:crypto";
import { GUIDED_DRAFT_SCHEMA } from "../../domain/agent-schemas";
import {
  AgentProvider,
  GuidedDraft,
  InterviewAnswers,
  JTBD,
  QuestionEvidence,
  StakeholderThought
} from "../../domain/models";
import {
  AgentProviderPort,
  ClockPort,
  FileSystemPort,
  PromptCatalogPort,
  SpecStorePort,
  TelemetrySink,
  WorkflowStatePort
} from "../ports";
import { ValidationError } from "../../domain/errors";
import { traceUseCase } from "./common";
import { SetupStakeholdersUseCase } from "./setup-stakeholders";
import { IntakeJtbdUseCase } from "./intake-jtbd";
import { CreateConstitutionUseCase } from "./create-constitution";
import { ValidateSpecUseCase } from "./validate-spec";
import { ApproveSpecUseCase } from "./approve-spec";
import { WorkflowCheckpointUseCase } from "./workflow-control";
import { CreateFeatureSpecUseCase } from "./create-feature-spec";
import { CreateSemanticContractUseCase } from "./create-semantic-contract";
import { PlanTddUseCase } from "./plan-tdd";
import { ImplementTaskGroupUseCase } from "./implement-task-group";

export type GreenfieldThrough = "constitution" | "feature" | "mvp";

export class GuidedGreenfieldUseCase {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly store: SpecStorePort,
    private readonly workflow: WorkflowStatePort,
    private readonly promptCatalog: PromptCatalogPort,
    private readonly agents: AgentProviderPort,
    private readonly projectRoot: string,
    private readonly setupStakeholders: SetupStakeholdersUseCase,
    private readonly intakeJtbd: IntakeJtbdUseCase,
    private readonly createConstitution: CreateConstitutionUseCase,
    private readonly validateSpec: ValidateSpecUseCase,
    private readonly approveSpec: ApproveSpecUseCase,
    private readonly checkpoint: WorkflowCheckpointUseCase,
    private readonly createFeatureSpec: CreateFeatureSpecUseCase,
    private readonly createSemanticContract: CreateSemanticContractUseCase,
    private readonly planTdd: PlanTddUseCase,
    private readonly implementTaskGroup: ImplementTaskGroupUseCase,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly agent?: AgentProvider;
    readonly through: GreenfieldThrough;
    readonly draftOnly?: boolean;
    readonly reviewer?: string;
    readonly product?: string;
    readonly description?: string;
    readonly audience?: string;
    readonly problem?: string;
    readonly job?: string;
    readonly situation?: string;
    readonly motivation?: string;
    readonly outcome?: string;
    readonly thoughts?: readonly string[];
    readonly featureName?: string;
  }): Promise<{ readonly completedThrough: GreenfieldThrough; readonly featureId?: string; readonly artifacts: readonly string[] }> {
    return traceUseCase<{ readonly completedThrough: GreenfieldThrough; readonly featureId?: string; readonly artifacts: readonly string[] }>(this.telemetry, this.clock, "workflow greenfield", input, async () => {
      const provider = await this.resolveProvider(input.agent);
      const artifacts: string[] = [];

      if (input.product !== undefined || input.thoughts !== undefined || !(await this.fs.exists(path.join(this.projectRoot, "README.md")))) {
        const result = await this.setupStakeholders.execute({
          product: input.product,
          thoughts: input.thoughts
        });
        artifacts.push(result.path);
      }

      await this.ensureJtbd(provider, input, artifacts);
      await this.draftAndCreateConstitution(provider, input, artifacts);
      if (input.draftOnly === true || input.through === "constitution") {
        return { result: { completedThrough: "constitution", artifacts }, outputs: { completedThrough: "constitution", artifacts } };
      }

      await this.checkpoint.execute({
        stepId: "clear-context-before-feature-spec",
        kind: "context-reset",
        notes: "Guided workflow reset before feature spec creation."
      });

      const featureId = await this.draftAndCreateFeature(provider, input, artifacts, false);
      if (input.through === "feature") {
        return { result: { completedThrough: "feature", featureId, artifacts }, outputs: { completedThrough: "feature", featureId, artifacts } };
      }

      const mvpFeatureId = await this.draftAndCreateFeature(provider, input, artifacts, true);
      return { result: { completedThrough: "mvp", featureId: mvpFeatureId, artifacts }, outputs: { completedThrough: "mvp", featureId: mvpFeatureId, artifacts } };
    });
  }

  private async ensureJtbd(provider: AgentProvider, input: Parameters<GuidedGreenfieldUseCase["execute"]>[0], artifacts: string[]): Promise<void> {
    if (await this.store.readJtbd() !== undefined) {
      return;
    }

    const jtbd = hasJtbdInput(input)
      ? parseJtbdInput(input)
      : await this.draftJtbd(provider, artifacts);
    await this.intakeJtbd.execute(jtbd);
    artifacts.push(path.join(this.projectRoot, "specs", "jtbd.md"));
  }

  private async draftJtbd(provider: AgentProvider, artifacts: string[]): Promise<JTBD> {
    const draft = await this.agentDraft<{ productName: string; shortDescription?: string; audience: string; problem: string; job: string; situation?: string; motivation?: string; desiredOutcome?: string }>(
      provider,
      "jtbd",
      await this.renderDraftPrompt("jtbd", "Create JTBD intake from stakeholder notes without writing files."),
      artifacts
    );
    return {
      productName: requireString(draft.answers.productName, "jtbd.answers.productName"),
      shortDescription: draft.answers.shortDescription,
      audience: requireString(draft.answers.audience, "jtbd.answers.audience"),
      problem: requireString(draft.answers.problem, "jtbd.answers.problem"),
      job: requireString(draft.answers.job, "jtbd.answers.job"),
      situation: draft.answers.situation,
      motivation: draft.answers.motivation,
      desiredOutcome: draft.answers.desiredOutcome,
      stakeholders: []
    };
  }

  private async draftAndCreateConstitution(provider: AgentProvider, input: Parameters<GuidedGreenfieldUseCase["execute"]>[0], artifacts: string[]): Promise<void> {
    const metadata = await this.store.readMetadata();
    if (metadata.constitution?.status === "approved") {
      return;
    }
    const draft = await this.agentDraft<Required<Pick<InterviewAnswers, "mission" | "targetAudience" | "techStack" | "roadmap">>>(
      provider,
      "constitution",
      await this.renderDraftPrompt("constitution", "Draft constitution answers from README.md and specs/jtbd.md. Do not ask for stakeholder thoughts again; ask only for missing mission, target audience, tech stack, and roadmap decisions."),
      artifacts
    );
    const evidence = this.questionEvidence("constitution", "constitution.create", {
      mission: requireString(draft.answers.mission, "constitution.answers.mission"),
      targetAudience: requireString(draft.answers.targetAudience, "constitution.answers.targetAudience"),
      techStack: requireString(draft.answers.techStack, "constitution.answers.techStack"),
      roadmap: requireString(draft.answers.roadmap, "constitution.answers.roadmap")
    });
    artifacts.push(await this.writeQuestionDraft("constitution-questions.json", evidence));
    if (input.draftOnly === true) {
      return;
    }
    await this.createConstitution.execute(evidence);
    await this.validateSpec.execute({});
    await this.approveSpec.execute({ target: "constitution", reviewer: input.reviewer ?? "Guided Workflow" });
  }

  private async draftAndCreateFeature(provider: AgentProvider, input: Parameters<GuidedGreenfieldUseCase["execute"]>[0], artifacts: string[], mvp: boolean): Promise<string> {
    const draft = await this.agentDraft<Required<Pick<InterviewAnswers, "scope" | "decisions" | "context" | "experience">>>(
      provider,
      mvp ? "mvp" : "feature",
      await this.renderDraftPrompt(mvp ? "mvp" : "feature", "Draft feature answers. Always include experience. For UI work, experience must be valid FLOW-* markdown with Role, Route or Screen, Happy Path, Expected Visible Outcome, and Playwright mapping. For non-UI work, say exactly: No UI-facing experience; no experience.md required."),
      artifacts
    );
    const workflow = mvp ? "mvp" : "feature-spec";
    const evidence = this.questionEvidence(workflow, mvp ? "mvp.plan" : "feature.create", {
      scope: requireString(draft.answers.scope, `${workflow}.answers.scope`),
      decisions: requireString(draft.answers.decisions, `${workflow}.answers.decisions`),
      context: requireString(draft.answers.context, `${workflow}.answers.context`),
      experience: requireString(draft.answers.experience, `${workflow}.answers.experience`)
    });
    artifacts.push(await this.writeQuestionDraft(mvp ? "mvp-questions.json" : "feature-questions.json", evidence));
    if (input.draftOnly === true) {
      return "";
    }
    const result = await this.createFeatureSpec.execute({
      name: mvp ? input.featureName ?? "MVP" : input.featureName,
      questionEvidence: evidence,
      mvp,
      waiverReason: "Guided workflow branch evidence is waived because this runner may operate before a git repository is available.",
      approvedBy: input.reviewer ?? "Guided Workflow"
    });
    const semanticEvidence = this.questionEvidence("semantic-contract", "feature.semantics", {
      actors: "Developer",
      outcomes: "Feature behavior matches the approved SDD spec",
      entities: "FeatureSpec",
      commands: "Create, validate, and implement feature",
      states: "draft -> approved",
      invariants: "Approved features require validation evidence before completion",
      scenarios: draft.answers.experience?.includes("FLOW-001") === true
        ? "Primary workflow FLOW-001: open the mapped route -> observe the expected visible outcome -> confirm validation evidence"
        : "Primary semantic workflow: review the approved spec -> run validation -> record completion evidence",
      oracles: "Validation evidence proves the semantic scenario",
      data: "not applicable",
      telemetry: "not applicable",
      architecture: "Domain and application logic remain decoupled from adapters"
    });
    artifacts.push(await this.writeQuestionDraft(`semantic-${result.featureId}.json`, semanticEvidence));
    await this.createSemanticContract.execute({ featureId: result.featureId, questionEvidence: semanticEvidence });
    await this.validateSpec.execute({ featureId: result.featureId });
    await this.approveSpec.execute({ target: "feature", featureId: result.featureId, reviewer: input.reviewer ?? "Guided Workflow" });
    await this.checkpoint.execute({
      stepId: "clear-context-before-implementation",
      kind: "context-reset",
      featureId: result.featureId,
      notes: "Guided workflow reset before implementation planning."
    });
    await this.planTdd.execute(result.featureId);
    await this.implementTaskGroup.execute({ featureId: result.featureId });
    return result.featureId;
  }

  private async agentDraft<TAnswers extends Record<string, string | undefined>>(provider: AgentProvider, purpose: "jtbd" | "constitution" | "feature" | "mvp", prompt: string, artifacts: string[]): Promise<GuidedDraft<TAnswers>> {
    const result = await this.agents.draft({
      provider,
      purpose,
      prompt,
      schema: GUIDED_DRAFT_SCHEMA[purpose],
      projectRoot: this.projectRoot
    });
    const draft = parseGuidedDraft<TAnswers>(result.parsed, purpose);
    artifacts.push(result.promptPath, result.schemaPath, result.outputPath);
    artifacts.push(await this.writeThinking(purpose, draft));
    return draft;
  }

  private async renderDraftPrompt(purpose: "jtbd" | "constitution" | "feature" | "mvp", instruction: string): Promise<string> {
    const promptId = purpose === "constitution" ? "constitution.create" : purpose === "feature" ? "feature.create" : purpose === "mvp" ? "mvp.plan" : "jtbd.intake";
    const template = this.promptCatalog.get(promptId);
    const context = [
      "README.md",
      "TODO.md",
      "specs/jtbd.md",
      "specs/mission.md",
      "specs/tech-stack.md",
      "specs/roadmap.md"
    ];
    return `# Guided ${purpose} Draft

${instruction}

## Canonical Prompt

${template?.instruction ?? "No canonical prompt found."}

## Required Output

Return only JSON matching the provided schema. Include written thinking, unresolved questions, risks, and final answers.

## Context

${(await Promise.all(context.map(async (file) => `### ${file}\n\n${await this.readContext(file)}`))).join("\n\n")}
`;
  }

  private async readContext(file: string): Promise<string> {
    const filePath = path.join(this.projectRoot, file);
    return (await this.fs.exists(filePath)) ? this.fs.readFile(filePath) : "Not found.";
  }

  private async writeThinking(purpose: string, draft: GuidedDraft<Record<string, string | undefined>>): Promise<string> {
    const outputPath = path.join(this.projectRoot, ".sdd", "thinking", `${this.clock.now().toISOString().slice(0, 10)}-${purpose}.md`);
    await this.fs.writeFile(outputPath, `# Guided Thinking: ${purpose}

## Thinking

${draft.thinking}

## Unresolved Questions

${(draft.questions ?? []).map((question) => `- ${question}`).join("\n") || "- None"}

## Risks

${(draft.risks ?? []).map((risk) => `- ${risk}`).join("\n") || "- None"}

## Answers

${Object.entries(draft.answers).map(([key, value]) => `### ${key}\n\n${value ?? ""}`).join("\n\n")}
`);
    return outputPath;
  }

  private questionEvidence(workflow: QuestionEvidence["workflow"], promptId: QuestionEvidence["promptId"], answers: InterviewAnswers): QuestionEvidence {
    return {
      id: `${workflow}-questions-${this.clock.now().toISOString()}`,
      workflow,
      promptId,
      promptHash: this.promptHash(promptId),
      source: "agent",
      createdAt: this.clock.now().toISOString(),
      answers
    };
  }

  private promptHash(promptId: QuestionEvidence["promptId"]): string | undefined {
    if (promptId === undefined) {
      return undefined;
    }
    return createHash("sha256").update(JSON.stringify(this.promptCatalog.get(promptId) ?? promptId)).digest("hex");
  }

  private async writeQuestionDraft(fileName: string, evidence: QuestionEvidence): Promise<string> {
    const outputPath = path.join(this.projectRoot, ".sdd", "question-drafts", fileName);
    await this.fs.writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
    return outputPath;
  }

  private async resolveProvider(inputProvider: AgentProvider | undefined): Promise<AgentProvider> {
    if (inputProvider !== undefined) {
      return inputProvider;
    }
    const config = await this.agents.readConfig(this.projectRoot);
    if (config === undefined) {
      throw new ValidationError("Guided workflow requires --agent codex|claude or a configured default from sdd agent configure.");
    }
    return config.provider;
  }
}

function hasJtbdInput(input: Parameters<GuidedGreenfieldUseCase["execute"]>[0]): boolean {
  return input.product !== undefined && input.audience !== undefined && input.problem !== undefined && input.job !== undefined;
}

function parseJtbdInput(input: Parameters<GuidedGreenfieldUseCase["execute"]>[0]): JTBD {
  return {
    productName: requireString(input.product, "product"),
    shortDescription: input.description,
    audience: requireString(input.audience, "audience"),
    problem: requireString(input.problem, "problem"),
    job: requireString(input.job, "job"),
    situation: input.situation,
    motivation: input.motivation,
    desiredOutcome: input.outcome,
    stakeholders: (input.thoughts ?? []).map(parseThought)
  };
}

function parseThought(input: string): StakeholderThought {
  const [name = "Stakeholder", ...thoughtParts] = input.split("=");
  return {
    name,
    thought: thoughtParts.join("=").trim() || input
  };
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

function requireString(value: string | undefined, field: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new ValidationError(`Guided workflow draft is missing ${field}.`);
  }
  return value;
}
