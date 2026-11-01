import { PromptId, PromptRenderContext, PromptTemplate } from "./models";

export const PROMPT_TEMPLATES: readonly PromptTemplate[] = [
  prompt("stakeholder.setup", "Setup & Stakeholder Thoughts", "Put stakeholder thoughts in README.md before creating the constitution.", ["README.md"], [], ["README.md"], ["Stakeholder thoughts must be captured before constitution work."], "sdd stakeholder setup"),
  prompt("jtbd.intake", "JTBD Intake", "Capture the product name, audience, problem, job, stakeholder thoughts, and desired outcome so mission and roadmap start from what and why.", ["README.md"], [], ["README.md", "specs/jtbd.md"], ["Do not create constitution files from this step."], "sdd jtbd intake"),
  prompt("constitution.create", "Create Constitution", "We are creating the product described in README.md. Create a constitution in specs with mission.md, tech-stack.md, and roadmap.md. You must ask grouped questions for mission, target audience, tech stack, and roadmap before writing to disk.", ["README.md", "TODO.md", "specs/jtbd.md", ".sdd/brownfield-profile.json"], ["mission", "targetAudience", "techStack", "roadmap"], ["specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md"], ["No constitution writes without grouped question evidence.", "Roadmap phases must be small and checklist-based."], "sdd constitution create --questions constitution-questions.json"),
  prompt("constitution.validate", "Validate Constitution", "Read the constitution documents and verify nothing important is missing. If the target audience or success criteria are missing, call that out before approval.", ["specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md"], [], [".sdd/approvals.jsonl"], ["Do not approve until mission, audience, success criteria, tech stack, testing posture, and roadmap structure are present."], "sdd constitution validate && sdd constitution approve --reviewer \"<reviewer>\""),
  prompt("brownfield.discover", "Brownfield Discovery", "Inventory an existing codebase before inventing a constitution. Use README, TODO/issues, package files, tests, architecture, data stores, routes, UI flows, and deployment assumptions.", ["README.md", "TODO.md", "package.json"], [], [".sdd/brownfield-profile.json"], ["Ask only for gaps that cannot be inferred from the repository."], "sdd brownfield discover"),
  prompt("feature.create", "Create Feature Spec", "Find the next phase on specs/roadmap.md, ask grouped questions about the feature spec, then create requirements.md, plan.md, validation.md, and experience.md when UI is in scope under specs/YYYY-MM-DD-feature-name. Include approach, sequence of work, validation, and the intended user experience. For the experience group, ask for user roles, screens/routes, happy-path workflows, edge/error workflows, data setup, database mutations, expected visible outcomes, and Playwright coverage mapping intent. Non-UI features must explicitly answer that no UI-facing experience exists.", ["specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md"], ["scope", "decisions", "context", "experience"], ["specs/<feature>/requirements.md", "specs/<feature>/plan.md", "specs/<feature>/validation.md", "specs/<feature>/experience.md when UI is in scope"], ["No feature spec writes without grouped question evidence.", "The experience question must be answered before feature spec writes.", "UI feature specs require FLOW-* experience entries before approval.", "Validation must be written before implementation."], "sdd feature create --questions feature-questions.json"),
  prompt("feature.iterate", "Iterate Feature Spec", "Review requirements, plan, and validation together. Clarify conflicts, update validation, and keep the documents synchronized.", ["specs/<feature>/requirements.md", "specs/<feature>/plan.md", "specs/<feature>/validation.md"], [], [".sdd/revisions/*.md", "specs/<feature>/*.md"], ["Do not speed through validation review.", "Do not oversteer into variable-level design."], "sdd feature revise --feature <feature-id> --request \"<change>\""),
  prompt("feature.semantics", "Create Semantic Contract", "Create a semantic contract for the feature before approval. Capture actors, jobs/outcomes, domain entities, commands/events, states/transitions, invariants, scenarios, oracles, data effects, telemetry expectations, and architecture claims. Each scenario and invariant must name how it will be verified.", ["specs/<feature>/requirements.md", "specs/<feature>/plan.md", "specs/<feature>/validation.md", "specs/<feature>/experience.md"], ["actors", "outcomes", "entities", "commands", "states", "invariants", "scenarios", "oracles", "data", "telemetry", "architecture"], ["specs/<feature>/semantics.md", ".sdd/semantic-contracts/<feature>.json"], ["No final spec approval without a semantic contract.", "Every semantic scenario needs an oracle and evidence method.", "UI/data/telemetry semantics must map to evidence or explicit not-applicable reasons."], "sdd feature semantics --feature <feature-id> --questions semantics-questions.json"),
  prompt("feature.validate-final", "Validate Final Feature Spec", "Verify the final feature spec is complete and can guide implementation. Approve only after requirements, plan, validation, and experience flows are coherent.", ["specs/<feature>/requirements.md", "specs/<feature>/plan.md", "specs/<feature>/validation.md", "specs/<feature>/experience.md"], [], [".sdd/approvals.jsonl"], ["No implementation before approved spec."], "sdd feature validate-spec --feature <feature-id> && sdd feature approve --feature <feature-id> --reviewer \"<reviewer>\""),
  prompt("feature.implement", "Implement Feature", "Implement approved task groups with TDD. Keep edits scoped to the spec, review what the agent is doing, and collect implementation evidence.", ["specs/<feature>/*.md", "specs/mission.md", "specs/tech-stack.md"], [], [".sdd/implementation-packets/<feature>.md", ".sdd/task-groups.jsonl"], ["Feature must be approved.", "Tasks cannot be complete without command-backed red and green TDD evidence unless --compat-tdd includes waiver reason and approver."], "sdd feature implement --feature <feature-id>"),
  prompt("feature.validation", "Feature Validation", "Run the app and validation commands. Focus on whether the feature works and matches the spec. UI work requires Playwright JSON reporter execution proof for mapped flows, and any data mutation requires isolated test data plus expected mutation verification.", ["specs/<feature>/validation.md", "specs/<feature>/experience.md", "package.json"], [], [".sdd/validation-summaries.jsonl", ".sdd/evidence/*.log"], ["All automated checks must pass.", "Every experience flow must map to Playwright coverage and appear as passed or expected in successful Playwright JSON reporter evidence.", "Any expected data mutation must use --test-database or .sdd/database-sandbox.json and .sdd/database-mutation-verifier.json."], "sdd feature run-validation --feature <feature-id>"),
  prompt("feature.deep-review", "Validate Not Lied To", "Do a deep review using independent review agents. Check architecture, spec alignment, tests/QA, and experience/Playwright coverage. Report anything that does not make sense or could be better.", ["specs/<feature>/*.md", ".sdd/implementation-packets/<feature>.md", ".sdd/validation-summaries.jsonl"], [], [".sdd/reviews/<feature>/*.json", ".sdd/reviews/<feature>/*.md"], ["All required review lenses must complete unless explicitly waived."], "sdd feature deep-review --feature <feature-id>"),
  prompt("feature.semantic-verify", "Semantic Verification", "Verify the implementation against the semantic contract. Run deterministic evidence checks first, then ask model/human verifiers to falsify claims with concrete citations. Telemetry evidence must name exact structured event or command ids. Blocking findings without citations are not allowed to block completion.", ["specs/<feature>/semantics.md", ".sdd/semantic-contracts/<feature>.json", ".sdd/validation-summaries.jsonl", ".sdd/implementation-packets/<feature>.md", ".sdd/reviews/<feature>/*.json"], [], [".sdd/semantic/<feature>/*.json", ".sdd/semantic-verifications.jsonl"], ["Mechanical evidence gaps block before model review.", "Blocking semantic findings must cite concrete evidence.", "Feature completion requires passed or waived semantic verification."], "sdd feature semantic-verify --feature <feature-id>"),
  prompt("feature.review-decisions", "Review Recommendations", "Review subagent recommendations and record which findings are accepted, rejected, or deferred before proceeding.", [".sdd/reviews/<feature>/*.md"], [], [".sdd/review-decisions.jsonl"], ["Every material review finding needs a decision."], "sdd feature review-decisions --feature <feature-id> --decision \"finding|accepted|reason\""),
  prompt("replan.create", "Replanning", "Create a separate branch for constitution or roadmap changes. Update impacted specs and code only after recording the change and impact.", ["specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md", "specs/<feature>/*.md"], [], ["specs/replans/*.md"], ["Big changes may become new features instead of replans."], "sdd replan create --name \"<change>\" --reason \"<why>\" --impact \"<impact>\""),
  prompt("skill.create", "Create Skill", "Create a thin local skill for a repeatable SDD workflow. The skill should delegate to sdd and not duplicate business rules.", ["skills/*/SKILL.md"], [], ["skills/<skill>/SKILL.md"], ["Skills must delegate to the CLI."], "sdd skill scaffold --name <skill> --command \"sdd ...\""),
  prompt("changelog.update", "Update Changelog", "Update CHANGELOG.md before merge so stakeholders can understand what changed.", [".sdd/telemetry.jsonl", "git history"], [], ["CHANGELOG.md"], ["Run before feature completion."], "sdd changelog update"),
  prompt("research.backlog", "Research Backlog", "Capture unresolved SDD questions, tool choices, standards, framework decisions, or technical risks as research backlog items before changing specs or implementation.", ["specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md"], [], ["backlog/research/*.md"], ["Apply research back through replan when it changes decisions."], "sdd research backlog --question \"<question>\" --context \"<context>\""),
  prompt("mvp.plan", "Plan MVP", "Go through remaining roadmap features, create an MVP branch, ask grouped MVP scope/decisions/context/experience questions, and create an MVP feature spec only when confidence gates pass. For UI-facing MVP work, capture user roles, screens/routes, happy-path workflows, edge/error workflows, data setup, database mutations, expected visible outcomes, and Playwright coverage mapping intent.", ["specs/mission.md", "specs/tech-stack.md", "specs/roadmap.md", "specs/<feature>/*.md"], ["scope", "decisions", "context", "experience"], ["specs/<mvp>/requirements.md", "specs/<mvp>/plan.md", "specs/<mvp>/validation.md", "specs/<mvp>/experience.md when UI is in scope"], ["Constitution must be approved.", "No unresolved draft or needs-review specs unless waived.", "UI MVP specs require FLOW-* experience entries before approval."], "sdd mvp plan --questions mvp-questions.json"),
  prompt("mvp.retro", "Validate MVP", "Based on MVP implementation, identify anything that needs clarification in the specs.", ["specs/<mvp>/*.md", ".sdd/validation-summaries.jsonl"], [], [".sdd/mvp-retrospectives.jsonl"], ["MVP findings must be recorded."], "sdd mvp retro --feature <feature-id> --findings \"<findings>\"")
];

export function getPromptTemplate(id: PromptId): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((template) => template.id === id);
}

export function renderPromptTemplate(template: PromptTemplate, context: PromptRenderContext): string {
  const renderedContext = Object.entries(context.contextFiles)
    .map(([file, content]) => `## Context: ${file}\n\n${content?.trim() || "Not found."}`)
    .join("\n\n");

  return `# ${template.title}

Prompt ID: ${template.id}${context.featureId ? `\nFeature: ${context.featureId}` : ""}${context.lens ? `\nReview Lens: ${context.lens}` : ""}${context.semanticDimension ? `\nSemantic Dimension: ${context.semanticDimension}` : ""}

## Core Instruction

${template.instruction}

## Required Context Files

${template.requiredContext.map((item) => `- ${item}`).join("\n") || "- None"}

## Required Grouped Questions

${template.requiredGroupedQuestions.map((item) => `- ${item}`).join("\n") || "- None"}

## Files The Agent May Write

${template.writableFiles.map((item) => `- ${item}`).join("\n") || "- None"}

## Hard Gates

${template.hardGates.map((item) => `- ${item}`).join("\n") || "- None"}

## Expected Command

\`\`\`bash
${template.expectedCommand}
\`\`\`

${renderedContext.length > 0 ? `## Rendered Context\n\n${renderedContext}\n` : ""}`;
}

function prompt(
  id: PromptId,
  title: string,
  instruction: string,
  requiredContext: readonly string[],
  requiredGroupedQuestions: PromptTemplate["requiredGroupedQuestions"],
  writableFiles: readonly string[],
  hardGates: readonly string[],
  expectedCommand: string
): PromptTemplate {
  return { id, title, instruction, requiredContext, requiredGroupedQuestions, writableFiles, hardGates, expectedCommand };
}
