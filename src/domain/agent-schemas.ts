import { AgentDraftPurpose } from "./models";

export const GUIDED_DRAFT_SCHEMA: Record<AgentDraftPurpose, Record<string, unknown>> = {
  jtbd: objectSchema({
    thinking: { type: "string" },
    questions: stringArraySchema(),
    risks: stringArraySchema(),
    answers: objectSchema({
      productName: { type: "string" },
      shortDescription: { type: "string" },
      audience: { type: "string" },
      problem: { type: "string" },
      job: { type: "string" },
      situation: { type: "string" },
      motivation: { type: "string" },
      desiredOutcome: { type: "string" }
    }, ["productName", "audience", "problem", "job"])
  }, ["thinking", "answers"]),
  constitution: objectSchema({
    thinking: { type: "string" },
    questions: stringArraySchema(),
    risks: stringArraySchema(),
    answers: objectSchema({
      mission: { type: "string" },
      targetAudience: { type: "string" },
      techStack: { type: "string" },
      roadmap: { type: "string" }
    }, ["mission", "targetAudience", "techStack", "roadmap"])
  }, ["thinking", "answers"]),
  feature: objectSchema({
    thinking: { type: "string" },
    questions: stringArraySchema(),
    risks: stringArraySchema(),
    answers: objectSchema({
      scope: { type: "string" },
      decisions: { type: "string" },
      context: { type: "string" },
      experience: { type: "string" }
    }, ["scope", "decisions", "context", "experience"])
  }, ["thinking", "answers"]),
  semantic: objectSchema({
    thinking: { type: "string" },
    questions: stringArraySchema(),
    risks: stringArraySchema(),
    answers: objectSchema({
      actors: { type: "string" },
      outcomes: { type: "string" },
      entities: { type: "string" },
      commands: { type: "string" },
      states: { type: "string" },
      invariants: { type: "string" },
      scenarios: { type: "string" },
      oracles: { type: "string" },
      data: { type: "string" },
      telemetry: { type: "string" },
      architecture: { type: "string" }
    }, ["actors", "outcomes", "entities", "commands", "states", "invariants", "scenarios", "oracles", "data", "telemetry", "architecture"])
  }, ["thinking", "answers"]),
  mvp: objectSchema({
    thinking: { type: "string" },
    questions: stringArraySchema(),
    risks: stringArraySchema(),
    answers: objectSchema({
      scope: { type: "string" },
      decisions: { type: "string" },
      context: { type: "string" },
      experience: { type: "string" }
    }, ["scope", "decisions", "context", "experience"])
  }, ["thinking", "answers"]),
  review: objectSchema({
    findings: {
      type: "array",
      items: objectSchema({
        id: { type: "string" },
        severity: { type: "string", enum: ["info", "warning", "blocking"] },
        summary: { type: "string" },
        recommendation: { type: "string" },
        source: { type: "string" },
        evidenceRefs: stringArraySchema()
      }, ["id", "severity", "summary", "recommendation"])
    }
  }, ["findings"])
};

function objectSchema(properties: Record<string, unknown>, required: readonly string[] = Object.keys(properties)): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
}

function stringArraySchema(): Record<string, unknown> {
  return {
    type: "array",
    items: { type: "string" }
  };
}
