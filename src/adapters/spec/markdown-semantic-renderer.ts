import { SemanticContract } from "../../domain/models";

export function renderSemanticContract(contract: SemanticContract): string {
  return `# Semantics: ${contract.featureId}

Source Hash: ${contract.sourceHash || "pending"}

## Actors

${contract.actors.length > 0
    ? contract.actors.map((actor) => `- **${actor.id}:** ${actor.name}${actor.context ? ` (${actor.context})` : ""}${actor.permissions.length > 0 ? ` Permissions: ${actor.permissions.join(", ")}` : ""}`).join("\n")
    : `Not applicable: ${contract.notApplicable.actors ?? "No actor justification recorded."}`}

## Outcomes

${contract.outcomes.map((outcome) => `- ${outcome}`).join("\n") || "- No outcomes recorded."}

## Entities

${renderSemanticEntities(contract)}

## Commands

${renderSemanticCommands(contract)}

## State Transitions

${contract.transitions.map((transition) => `- **${transition.id}:** ${transition.entityId} ${transition.from} -> ${transition.to} via ${transition.trigger}`).join("\n") || "- No transitions recorded."}

## Invariants

${contract.invariants.map((invariant) => `- **${invariant.id}:** ${invariant.statement} Severity: ${invariant.severity}. Methods: ${invariant.verificationMethods.join(", ")}`).join("\n") || "- No invariants recorded."}

## Oracles

${contract.oracles.map((oracle) => `- **${oracle.id}:** ${oracle.statement} Methods: ${oracle.verificationMethods.join(", ")}`).join("\n") || "- No oracles recorded."}

## Scenarios

${contract.scenarios.map((scenario) => `### ${scenario.id}: ${scenario.title}

- Actors: ${scenario.actorIds.join(", ") || "none"}
- Preconditions: ${scenario.preconditions.join("; ") || "none"}
- Steps: ${scenario.steps.join("; ") || "none"}
- Expected Visible Outcome: ${scenario.expectedVisibleOutcome ?? "none"}
- Expected Data Mutations: ${scenario.expectedDataMutations.join("; ") || "none"}
- Expected Telemetry: ${scenario.expectedTelemetry.join("; ") || "none"}
- Experience Flows: ${scenario.experienceFlowIds.join(", ") || "none"}
- Oracles: ${scenario.oracleIds.join(", ") || "none"}
- Evidence: ${scenario.evidence.map((item) => `${item.id}:${item.kind}:${item.ref}`).join("; ") || "none"}`).join("\n\n") || "No scenarios recorded."}

## Architecture Claims

${renderSemanticArchitectureClaims(contract)}

## Telemetry

${contract.telemetryEvents.length > 0 ? contract.telemetryEvents.map((event) => `- ${event}`).join("\n") : `Not applicable: ${contract.notApplicable.telemetry ?? "No telemetry justification recorded."}`}
`;
}

function renderSemanticEntities(contract: SemanticContract): string {
  if (contract.entities.length > 0) {
    return contract.entities.map((entity) => `- **${entity.id}:** ${entity.name}${entity.states.length > 0 ? ` States: ${entity.states.join(", ")}` : ""}`).join("\n");
  }
  return semanticNotApplicableFallback(contract.notApplicable.entities, "No entities recorded.");
}

function renderSemanticCommands(contract: SemanticContract): string {
  if (contract.commands.length > 0) {
    return contract.commands.map((command) => `- **${command.id}:** ${command.name} Actors: ${command.actorIds.join(", ") || "none"} Entities: ${command.entityIds.join(", ") || "none"}`).join("\n");
  }
  return semanticNotApplicableFallback(contract.notApplicable.commands, "No commands recorded.");
}

function renderSemanticArchitectureClaims(contract: SemanticContract): string {
  if (contract.architectureClaims.length > 0) {
    return contract.architectureClaims.map((claim) => `- **${claim.id}:** ${claim.statement} Method: ${claim.verificationMethod}`).join("\n");
  }
  return semanticNotApplicableFallback(contract.notApplicable.architecture, "No architecture claims recorded.");
}

function semanticNotApplicableFallback(reason: string | undefined, fallback: string): string {
  return reason !== undefined && reason.trim().length > 0 ? `Not applicable: ${reason}` : `- ${fallback}`;
}
