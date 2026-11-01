import { ClockPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import {
  QuestionEvidence,
  SemanticContract,
  SemanticEvidenceRequirement,
  SemanticVerificationMethod
} from "../../domain/models";
import { requireQuestionEvidence } from "../../domain/workflow";
import { validateSemanticContract } from "../../domain/semantic-validation";
import { assertAllGatesPass, assertValidationPasses, traceUseCase } from "./common";

const REQUIRED_SEMANTIC_KEYS = ["actors", "outcomes", "entities", "commands", "states", "invariants", "scenarios", "oracles", "data", "telemetry", "architecture"] as const;

export class CreateSemanticContractUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly featureId: string; readonly questionEvidence: QuestionEvidence }): Promise<{ readonly featureId: string; readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "feature semantics", { featureId: input.featureId, questionEvidenceId: input.questionEvidence.id }, async () => {
      const gates = requireQuestionEvidence(input.questionEvidence, "semantic-contract", REQUIRED_SEMANTIC_KEYS);
      assertAllGatesPass(gates);

      const experience = await this.store.readFeatureExperience(input.featureId);
      const contract = buildSemanticContract(input.featureId, input.questionEvidence, experience, this.clock.now().toISOString());
      const validationGates = validateSemanticContract(contract, experience);
      assertValidationPasses(validationGates);
      const evidencePath = await this.workflow.appendQuestionEvidence(input.questionEvidence);
      const persisted = await this.store.writeSemanticContract(input.featureId, contract);
      const outputPath = `specs/${input.featureId}/semantics.md`;

      await this.workflow.updateStep("create-semantic-contract", {
        status: "complete",
        featureId: input.featureId,
        evidence: [evidencePath, outputPath, `.sdd/semantic-contracts/${input.featureId}.json`]
      });
      await this.workflow.updateStep("validate-final-feature-spec", { status: "ready", featureId: input.featureId });

      return {
        result: { featureId: input.featureId, path: outputPath },
        gates: [...gates, ...validationGates],
        outputs: { featureId: input.featureId, sourceHash: persisted.sourceHash }
      };
    });
  }
}

function buildSemanticContract(featureId: string, evidence: QuestionEvidence, experienceMarkdown: string | undefined, createdAt: string): SemanticContract {
  const answers = evidence.answers;
  const actors = parseApplicableList(answers.actors).map((name, index) => ({
    id: id("ACT", index),
    name,
    permissions: parsePermissions(name)
  }));
  const entities = parseApplicableList(answers.entities).map((name, index) => ({
    id: id("ENT", index),
    name,
    states: parseList(answers.states)
  }));
  const commands = parseApplicableList(answers.commands).map((name, index) => ({
    id: id("CMD", index),
    name,
    actorIds: actors.length > 0 ? [actors[0]!.id] : [],
    entityIds: entities.length > 0 ? [entities[0]!.id] : []
  }));
  const telemetryEvents = isNotApplicable(answers.telemetry) ? [] : parseList(answers.telemetry);
  const oracles = parseList(answers.oracles).map((statement, index) => ({
    id: id("ORC", index),
    statement,
    verificationMethods: inferVerificationMethods(statement, experienceMarkdown, answers.data, telemetryEvents)
  }));
  const scenarioLines = parseList(answers.scenarios);
  const scenarios = scenarioLines.map((line, index) => {
    const parsedScenario = parseScenarioLine(line);
    const flowIds = parseFlowIds(`${line}\n${experienceMarkdown ?? ""}`);
    const dataMutations = isNotApplicable(answers.data) ? ["none"] : parseList(answers.data);
    const expectedTelemetry = telemetryEvents;
    return {
      id: id("SCN", index),
      title: parsedScenario.title,
      actorIds: actors.length > 0 ? [actors[0]!.id] : [],
      preconditions: [],
      steps: parsedScenario.steps,
      expectedVisibleOutcome: flowIds.length > 0 ? parsedScenario.title : undefined,
      expectedDataMutations: dataMutations,
      expectedTelemetry,
      experienceFlowIds: flowIds,
      oracleIds: oracles.length > 0 ? [oracles[Math.min(index, oracles.length - 1)]!.id] : [],
      evidence: buildScenarioEvidence(index, flowIds, dataMutations, expectedTelemetry, experienceMarkdown)
    };
  });
  const invariantStatements = parseApplicableList(answers.invariants);

  return {
    version: 1,
    featureId,
    sourceHash: "",
    createdAt,
    actors,
    outcomes: parseList(answers.outcomes),
    entities,
    commands,
    transitions: parseTransitions(answers.states, entities[0]?.id),
    invariants: invariantStatements.map((statement, index) => {
      const verificationMethods = inferVerificationMethods(statement, experienceMarkdown, answers.data, telemetryEvents);
      return {
        id: id("INV", index),
        statement,
        severity: "blocking" as const,
        verificationMethods,
        evidence: verificationMethods.map((method, evidenceIndex) => evidenceRequirement(`INV-${index + 1}-EVD-${evidenceIndex + 1}`, method, defaultRefFor(method, experienceMarkdown, telemetryEvents), true))
      };
    }),
    scenarios,
    oracles,
    architectureClaims: parseApplicableList(answers.architecture).map((statement, index) => ({
      id: id("ARCH", index),
      statement,
      verificationMethod: "static-rule"
    })),
    telemetryEvents,
    notApplicable: {
      actors: actors.length === 0 ? answers.actors : undefined,
      entities: entities.length === 0 ? answers.entities : undefined,
      commands: commands.length === 0 ? answers.commands : undefined,
      telemetry: telemetryEvents.length === 0 ? answers.telemetry : undefined,
      architecture: parseApplicableList(answers.architecture).length === 0 ? answers.architecture : undefined
    }
  };
}

function buildScenarioEvidence(index: number, flowIds: readonly string[], dataMutations: readonly string[], telemetryEvents: readonly string[], experienceMarkdown: string | undefined): SemanticEvidenceRequirement[] {
  const evidence: SemanticEvidenceRequirement[] = [];
  if (flowIds.length > 0) {
    evidence.push(evidenceRequirement(id("EVD-UI", index), "playwright-flow", playwrightRefForFlow(flowIds[0]!, experienceMarkdown), true));
  } else {
    evidence.push(evidenceRequirement(id("EVD-TST", index), "unit-test", "tests/feature.test.ts", true));
  }
  if (dataMutations.some((item) => !isNotApplicable(item))) {
    evidence.push(evidenceRequirement(id("EVD-DB", index), "database-evidence", ".sdd/test-db", true));
  }
  for (const event of telemetryEvents) {
    evidence.push(evidenceRequirement(id("EVD-TEL", index), "telemetry-evidence", event, true));
  }
  return evidence;
}

function evidenceRequirement(idValue: string, kind: SemanticVerificationMethod, ref: string, required: boolean): SemanticEvidenceRequirement {
  return { id: idValue, kind, ref, required };
}

function inferVerificationMethods(text: string, experienceMarkdown: string | undefined, data: string | undefined, telemetryEvents: readonly string[]): SemanticVerificationMethod[] {
  const methods: SemanticVerificationMethod[] = [];
  if (parseFlowIds(experienceMarkdown ?? "").length > 0 || /\b(ui|screen|page|browser|route|flow)\b/i.test(text)) {
    methods.push("playwright-flow");
  } else {
    methods.push("unit-test");
  }
  if (!isNotApplicable(data)) methods.push("database-evidence");
  if (telemetryEvents.length > 0) methods.push("telemetry-evidence");
  return [...new Set(methods)];
}

function defaultRefFor(method: SemanticVerificationMethod, experienceMarkdown: string | undefined, telemetryEvents: readonly string[]): string {
  if (method === "playwright-flow") return playwrightRefForFlow(parseFlowIds(experienceMarkdown ?? "")[0] ?? "FLOW-001", experienceMarkdown);
  if (method === "database-evidence") return ".sdd/test-db";
  if (method === "telemetry-evidence") return telemetryEvents[0] ?? ".sdd/telemetry.jsonl";
  return "tests/feature.test.ts";
}

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function parseApplicableList(value: string | undefined): string[] {
  return isNotApplicable(value) ? [] : parseList(value);
}

function parseScenarioLine(value: string): { readonly title: string; readonly steps: readonly string[] } {
  const [titlePart = value, ...detailParts] = value.split(":");
  const title = titlePart.trim() || value.trim();
  const detail = detailParts.join(":").trim();
  if (detail.length === 0) {
    return { title, steps: [title] };
  }
  const steps = detail
    .split(/\s*(?:->|=>)\s*|;\s*|,\s*/)
    .map((step) => step.trim())
    .filter((step) => step.length > 0);
  return { title, steps: steps.length > 0 ? steps : [title] };
}

function parsePermissions(value: string): string[] {
  return value.includes(":") ? value.split(":").slice(1).join(":").split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function parseTransitions(value: string | undefined, entityId: string | undefined) {
  if (entityId === undefined) return [];
  return parseList(value)
    .filter((line) => /->/.test(line))
    .map((line, index) => {
      const [from = "unknown", to = "unknown"] = line.split("->").map((item) => item.trim());
      return { id: id("TRN", index), entityId, from, to, trigger: "semantic contract" };
    });
}

function parseFlowIds(value: string): string[] {
  return [...new Set(Array.from(value.matchAll(/\bFLOW-[A-Za-z0-9_-]+\b/g)).map((match) => match[0]))];
}

function playwrightRefForFlow(flowId: string, experienceMarkdown: string | undefined): string {
  const markdown = experienceMarkdown ?? "";
  const flowPattern = new RegExp(`^###\\s+${flowId}[^\\r\\n]*\\r?\\n([\\s\\S]*?)(?=^###\\s+FLOW-|(?![\\s\\S]))`, "im");
  const flow = flowPattern.exec(markdown)?.[1] ?? markdown;
  return /^-\s*Playwright:\s*(.*)$/im.exec(flow)?.[1]?.trim() || "tests/e2e";
}

function isNotApplicable(value: string | undefined): boolean {
  if (value === undefined) return true;
  return /^(none|n\/a|not applicable|no|no telemetry|no data|no database|no mutation)$/i.test(value.trim());
}

function id(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}
