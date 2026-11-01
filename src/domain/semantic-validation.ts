import { createHash } from "node:crypto";
import { QualityGate, SemanticContract, SemanticVerificationFinding } from "./models";

export function validateSemanticContractFiles(input: {
  readonly markdown?: string;
  readonly contract?: SemanticContract;
  readonly experienceMarkdown?: string;
}): QualityGate[] {
  const gates: QualityGate[] = [
    gate("semantic.contract.markdown", "semantics.md exists", input.markdown !== undefined),
    gate("semantic.contract.json", "semantic contract JSON exists", input.contract !== undefined)
  ];

  if (input.markdown !== undefined && input.contract !== undefined) {
    gates.push(gate(
      "semantic.contract.source-hash",
      "Semantic contract JSON matches semantics.md",
      semanticMarkdownHash(input.markdown) === input.contract.sourceHash
    ));
    gates.push(...validateSemanticContract(input.contract, input.experienceMarkdown));
  }

  return gates;
}

export function validateSemanticContract(contract: SemanticContract, experienceMarkdown?: string): QualityGate[] {
  const experienceFlowIds = parseExperienceFlowIds(experienceMarkdown ?? "");
  const scenarioFieldIssues = contract.scenarios.flatMap((scenario) => {
    const issues: string[] = [];
    if (scenario.oracleIds.length === 0) issues.push(`${scenario.id}.oracles`);
    if (scenario.evidence.filter((item) => item.required).length === 0) issues.push(`${scenario.id}.evidence`);
    for (const flowId of scenario.experienceFlowIds) {
      if (!experienceFlowIds.has(flowId)) {
        issues.push(`${scenario.id}.experience.${flowId}`);
      }
    }
    if (scenario.expectedDataMutations.some((mutation) => !isNone(mutation)) && !scenario.evidence.some((item) => item.kind === "database-evidence")) {
      issues.push(`${scenario.id}.database-evidence`);
    }
    return issues;
  });
  const invariantIssues = contract.invariants
    .filter((invariant) => invariant.verificationMethods.length === 0 || invariant.evidence.filter((item) => item.required).length === 0)
    .map((invariant) => invariant.id);
  const scenarioStepIssues = contract.scenarios
    .filter((scenario) => !hasMeaningfulScenarioSteps(scenario.title, scenario.steps))
    .map((scenario) => scenario.id);
  const evidenceRefIssues = contract.scenarios
    .flatMap((scenario) => scenario.evidence.map((evidence) => `${scenario.id}.${evidence.id}:${evidence.kind}:${evidence.ref}`))
    .concat(contract.invariants.flatMap((invariant) => invariant.evidence.map((evidence) => `${invariant.id}.${evidence.id}:${evidence.kind}:${evidence.ref}`)))
    .filter((entry) => {
      const [, kind = "", ref = ""] = /^([^:]+):([^:]+):(.+)$/.exec(entry)?.slice(1) ?? [];
      return vagueEvidenceRef(kind, ref);
    });

  return [
    gate("semantic.contract.feature-id", "Semantic contract has feature id", contract.featureId.trim().length > 0),
    gate("semantic.contract.no-placeholders", "Semantic contract has no TODO placeholders", !containsPlaceholder(JSON.stringify(contract))),
    gate("semantic.actors", "Semantic contract records actors or explicit not-applicable reason", contract.actors.length > 0 || nonEmpty(contract.notApplicable.actors)),
    gate("semantic.entities", "Semantic contract records entities or explicit not-applicable reason", contract.entities.length > 0 || nonEmpty(contract.notApplicable.entities)),
    gate("semantic.commands", "Semantic contract records commands or explicit not-applicable reason", contract.commands.length > 0 || nonEmpty(contract.notApplicable.commands)),
    gate("semantic.outcomes", "Semantic contract records jobs/outcomes", contract.outcomes.length > 0),
    gate("semantic.scenarios", "Semantic contract records scenarios", contract.scenarios.length > 0),
    gate("semantic.scenario-steps", "Every semantic scenario records meaningful ordered steps", scenarioStepIssues.length === 0, scenarioStepIssues),
    gate("semantic.oracles", "Semantic contract records oracles", contract.oracles.length > 0),
    gate("semantic.scenario-evidence", "Every semantic scenario has oracle and evidence mappings", scenarioFieldIssues.length === 0, scenarioFieldIssues),
    gate("semantic.invariant-evidence", "Every invariant has verification methods and evidence", invariantIssues.length === 0, invariantIssues),
    gate("semantic.evidence-refs", "Required semantic evidence refs identify concrete files or structured telemetry events", evidenceRefIssues.length === 0, evidenceRefIssues),
    gate("semantic.architecture", "Semantic contract records architecture claims or explicit not-applicable reason", contract.architectureClaims.length > 0 || nonEmpty(contract.notApplicable.architecture)),
    gate("semantic.telemetry", "Semantic contract records telemetry expectations or explicit not-applicable reason", contract.telemetryEvents.length > 0 || nonEmpty(contract.notApplicable.telemetry))
  ];
}

export function semanticMarkdownHash(markdown: string): string {
  return createHash("sha256").update(markdown.replace(/^Source Hash:\s+.*$/im, "Source Hash: pending")).digest("hex");
}

export function deterministicFinding(id: string, claimId: string, severity: "info" | "warning" | "blocking", summary: string, evidenceRefs: readonly string[], requiredFix: string): SemanticVerificationFinding {
  return {
    id,
    claimId,
    dimension: "deterministic",
    severity,
    summary,
    evidenceRefs,
    requiredFix,
    source: "deterministic"
  };
}

function gate(id: string, name: string, passed: boolean, details: readonly string[] = []): QualityGate {
  return {
    id,
    name,
    severity: "blocking",
    passed,
    message: passed ? `${name} passed.` : `${name} failed.${details.length > 0 ? ` ${details.join(", ")}` : ""}`
  };
}

function nonEmpty(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function containsPlaceholder(value: string): boolean {
  return /\bTODO\b|placeholder|TBD/i.test(value);
}

function hasMeaningfulScenarioSteps(title: string, steps: readonly string[]): boolean {
  const meaningful = steps.map((step) => step.trim()).filter((step) => step.length > 0 && !containsPlaceholder(step));
  return meaningful.length > 1 && meaningful.some((step) => step.toLowerCase() !== title.trim().toLowerCase());
}

function parseExperienceFlowIds(markdown: string): Set<string> {
  return new Set(Array.from(markdown.matchAll(/^###\s+(FLOW-[A-Za-z0-9_-]+):?.*$/gim)).map((match) => match[1] ?? ""));
}

function isNone(value: string): boolean {
  return /^(none|n\/a|not applicable|no mutation|no database mutation)$/i.test(value.trim());
}

function vagueEvidenceRef(kind: string, ref: string): boolean {
  const normalized = ref.trim();
  if (normalized.length === 0 || /^TODO\b/i.test(normalized)) {
    return true;
  }
  if (/^(tests?|tests\/e2e|e2e)$/i.test(normalized)) {
    return true;
  }
  if (kind === "telemetry-evidence" && (normalized.includes("/") || /\.jsonl?$/i.test(normalized))) {
    return true;
  }
  return false;
}
