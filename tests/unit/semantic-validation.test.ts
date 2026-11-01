import { describe, expect, it } from "vitest";
import { SemanticContract } from "../../src/domain/models";
import { semanticMarkdownHash, validateSemanticContract, validateSemanticContractFiles } from "../../src/domain/semantic-validation";

describe("semantic contract validation", () => {
  it("requires scenarios to have oracles and evidence", () => {
    const contract: SemanticContract = {
      ...validContract(),
      scenarios: [{
        id: "SCN-001",
        title: "Primary",
        actorIds: ["ACT-001"],
        preconditions: [],
        steps: ["Prepare", "Do it"],
        expectedDataMutations: [],
        expectedTelemetry: [],
        experienceFlowIds: [],
        oracleIds: [],
        evidence: []
      }]
    };

    expect(validateSemanticContract(contract).filter((gate) => !gate.passed).map((gate) => gate.id)).toContain("semantic.scenario-evidence");
  });

  it("blocks stale semantic JSON when semantics.md changed", () => {
    const markdown = "# Semantics\n\nSource Hash: old\n\nChanged";
    const contract = validContract();
    const gates = validateSemanticContractFiles({
      markdown,
      contract: {
        ...contract,
        sourceHash: semanticMarkdownHash("# Semantics\n\nSource Hash: pending\n\nOriginal")
      }
    });

    expect(gates.find((gate) => gate.id === "semantic.contract.source-hash")?.passed).toBe(false);
  });

  it("requires UI scenario flow ids to exist in experience.md", () => {
    const contract: SemanticContract = {
      ...validContract(),
      scenarios: [{
        ...validContract().scenarios[0]!,
        experienceFlowIds: ["FLOW-404"]
      }]
    };

    expect(validateSemanticContract(contract, "### FLOW-001: Primary").find((gate) => gate.id === "semantic.scenario-evidence")?.passed).toBe(false);
  });

  it("requires entities, commands, architecture claims, and meaningful scenario steps", () => {
    const contract: SemanticContract = {
      ...validContract(),
      entities: [],
      commands: [],
      architectureClaims: [],
      notApplicable: { telemetry: "not applicable" },
      scenarios: [{
        ...validContract().scenarios[0]!,
        steps: ["Primary"]
      }]
    };

    expect(validateSemanticContract(contract).filter((gate) => !gate.passed).map((gate) => gate.id)).toEqual(expect.arrayContaining([
      "semantic.entities",
      "semantic.commands",
      "semantic.scenario-steps",
      "semantic.architecture"
    ]));
  });

  it("rejects vague evidence refs and telemetry file refs", () => {
    const contract: SemanticContract = {
      ...validContract(),
      telemetryEvents: ["feature.saved"],
      notApplicable: {},
      scenarios: [{
        ...validContract().scenarios[0]!,
        evidence: [
          { id: "EVD-001", kind: "unit-test", ref: "tests", required: true },
          { id: "EVD-002", kind: "telemetry-evidence", ref: ".sdd/telemetry.jsonl", required: true }
        ]
      }]
    };

    expect(validateSemanticContract(contract).find((gate) => gate.id === "semantic.evidence-refs")?.passed).toBe(false);
  });
});

function validContract(): SemanticContract {
  return {
    version: 1,
    featureId: "feature",
    sourceHash: "hash",
    createdAt: "2026-05-25T00:00:00.000Z",
    actors: [{ id: "ACT-001", name: "Developer", permissions: [] }],
    outcomes: ["Outcome"],
    entities: [{ id: "ENT-001", name: "Feature", states: ["draft", "approved"] }],
    commands: [{ id: "CMD-001", name: "Create", actorIds: ["ACT-001"], entityIds: ["ENT-001"] }],
    transitions: [],
    invariants: [{
      id: "INV-001",
      statement: "Must hold",
      severity: "blocking",
      verificationMethods: ["unit-test"],
      evidence: [{ id: "EVD-001", kind: "unit-test", ref: "tests/feature.test.ts", required: true }]
    }],
    scenarios: [{
      id: "SCN-001",
      title: "Primary",
      actorIds: ["ACT-001"],
      preconditions: [],
      steps: ["Prepare evidence", "Run validation"],
      expectedDataMutations: ["none"],
      expectedTelemetry: [],
      experienceFlowIds: [],
      oracleIds: ["ORC-001"],
      evidence: [{ id: "EVD-001", kind: "unit-test", ref: "tests/feature.test.ts", required: true }]
    }],
    oracles: [{ id: "ORC-001", statement: "It works", verificationMethods: ["unit-test"] }],
    architectureClaims: [{ id: "ARCH-001", statement: "Clean", verificationMethod: "static-rule" }],
    telemetryEvents: [],
    notApplicable: { telemetry: "not applicable" }
  };
}
