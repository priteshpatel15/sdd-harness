import { describe, expect, it } from "vitest";
import { PROMPT_TEMPLATES, renderPromptTemplate } from "../../src/domain/prompt-catalog";
import { PromptId } from "../../src/domain/models";

const expectedPromptIds: readonly PromptId[] = [
  "stakeholder.setup",
  "jtbd.intake",
  "constitution.create",
  "constitution.validate",
  "brownfield.discover",
  "feature.create",
  "feature.iterate",
  "feature.semantics",
  "feature.validate-final",
  "feature.implement",
  "feature.validation",
  "feature.deep-review",
  "feature.semantic-verify",
  "feature.review-decisions",
  "replan.create",
  "skill.create",
  "changelog.update",
  "research.backlog",
  "mvp.plan",
  "mvp.retro"
];

describe("canonical prompt catalog", () => {
  it("contains every required SDD prompt id", () => {
    expect(PROMPT_TEMPLATES.map((prompt) => prompt.id).sort()).toEqual([...expectedPromptIds].sort());
  });

  it("records grouped questions for constitution, feature, and MVP creation", () => {
    expect(PROMPT_TEMPLATES.find((prompt) => prompt.id === "constitution.create")?.requiredGroupedQuestions).toEqual(["mission", "targetAudience", "techStack", "roadmap"]);
    expect(PROMPT_TEMPLATES.find((prompt) => prompt.id === "feature.create")?.requiredGroupedQuestions).toEqual(["scope", "decisions", "context", "experience"]);
    expect(PROMPT_TEMPLATES.find((prompt) => prompt.id === "feature.semantics")?.requiredGroupedQuestions).toEqual(["actors", "outcomes", "entities", "commands", "states", "invariants", "scenarios", "oracles", "data", "telemetry", "architecture"]);
    expect(PROMPT_TEMPLATES.find((prompt) => prompt.id === "mvp.plan")?.requiredGroupedQuestions).toEqual(["scope", "decisions", "context", "experience"]);
  });

  it("renders core instruction, gates, command, and context", () => {
    const template = PROMPT_TEMPLATES.find((prompt) => prompt.id === "feature.create")!;

    const rendered = renderPromptTemplate(template, {
      promptId: "feature.create",
      contextFiles: {
        "specs/roadmap.md": "# Roadmap"
      }
    });

    expect(rendered).toContain("Find the next phase");
    expect(rendered).toContain("No feature spec writes without grouped question evidence");
    expect(rendered).toContain("sdd feature create --questions feature-questions.json");
    expect(rendered).toContain("# Roadmap");
  });
});
