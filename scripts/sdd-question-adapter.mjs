import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const workflow = requiredArg(args, "workflow");
const promptFile = requiredArg(args, "prompt");
const outputFile = requiredArg(args, "output");
const prompt = JSON.parse(await readFile(promptFile, "utf8"));
const defaults = answersForWorkflow(workflow);
const answers = Object.fromEntries((prompt.questions ?? []).map((question) => {
  const fallback = `Local deterministic answer for ${workflow} ${question.id}.`;
  return [question.id, defaults[question.id] ?? fallback];
}));

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify({ answers }, null, 2)}\n`);

function answersForWorkflow(workflowName) {
  if (workflowName === "constitution") {
    return {
      mission: "Build a portable SDD Harness that turns approved intent into enforceable CLI gates, durable evidence, telemetry, and local validation.",
      targetAudience: "Developers and technical leads who use AI coding agents and need command-backed proof that changes match approved specs.",
      techStack: "TypeScript on Node.js, Clean Architecture, Vitest for unit/integration/e2e tests, Playwright JSON evidence for UI workflows, JSONL telemetry, and local command-backed adapters.",
      roadmap: "## Phase 1: Close Harness Gaps\n\n**Goal:** Replace hand-seeded evidence with CLI-generated dogfood artifacts and strict quality gates.\n\n- [ ] Generate questions, semantics, approvals, TDD, validation, review, changelog, roadmap, and completion evidence\n- [ ] Keep strict doctor green with local deterministic adapters\n\n## Phase 2: Adapter Replaceability\n\n**Goal:** Keep SDD enforcement portable across CLI, skills, and future integrations.\n\n- [ ] Continue extracting reusable adapter utilities behind ports\n- [ ] Document compatibility contracts for adapter authors"
    };
  }
  if (workflowName === "feature-spec" || workflowName === "mvp") {
    return {
      scope: "Close the SDD harness gaps by replacing hand-seeded evidence with CLI-generated artifacts, adding strict local readiness adapters, generating semantic contracts, recording strict TDD, and completing validation/review/completion gates.",
      decisions: "Keep Clean Architecture boundaries intact; add deterministic local scripts only at adapter/config/test fixture edges; preserve no UI-facing experience for this feature; use explicit waivers only for the non-git workspace branch constraint.",
      context: "The harness already has CLI use cases for questions, specs, semantics, task groups, validation, review, semantic verification, changelog, and completion. The missing work is dogfooding those gates with real evidence in this repository.",
      experience: "No UI-facing experience; no experience.md required."
    };
  }
  if (workflowName === "semantic-contract") {
    return {
      actors: "Maintainer: approve specs, run gates, review evidence",
      outcomes: "The close-harness-gaps feature has approved semantic contracts, strict command-backed TDD records, completed task groups, validation summaries, deep review, semantic verification, review decisions, changelog, roadmap evidence, and completion telemetry.",
      entities: "Feature Spec; Semantic Contract; TDD Evidence; Task Group Progress; Validation Summary; Review Summary; Review Decision; Roadmap Update; Waiver",
      commands: "questions capture; feature semantics; feature validate-spec; feature approve; feature plan-tdd; feature implement; feature record-tdd; feature complete-task-group; feature run-validation; feature deep-review; feature semantic-verify; feature review-decisions; changelog update; feature complete",
      states: "draft -> approved; approved -> implemented; implemented -> validated; validated -> merged",
      invariants: "No implementation/task-group completion without current feature approval; Strict task groups require red and green command-backed TDD records; Validation must run after task evidence before completion; Review, semantic verification, review decisions, changelog, and roadmap evidence must exist before completion; Local adapters must stay outside domain/application logic",
      scenarios: "Complete dogfood evidence: capture questions -> generate semantic contract -> approve current hashes -> record strict TDD -> complete task groups -> run validation -> complete feature; Verify readiness: add local configs -> run strict doctor -> confirm every readiness check passes",
      oracles: "workflow doctor --strict passes; feature validation commands pass; semantic verification passes without blocking findings; feature complete succeeds only after task, validation, review, semantic, decision, changelog, and roadmap evidence",
      data: "No database",
      telemetry: "feature complete-task-group; feature run-validation; feature deep-review; feature semantic-verify",
      architecture: "Domain/application code remains provider-agnostic; local command scripts are adapter/test-fixture concerns; no provider-specific logic is added to domain or application layers"
    };
  }
  return {};
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value?.startsWith("--")) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    parsed[key] = next ?? "";
    index += 1;
  }
  return parsed;
}

function requiredArg(argsByName, key) {
  const value = argsByName[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing --${key}`);
  }
  return value;
}
