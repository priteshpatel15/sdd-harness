import { FeatureSpec, InterviewAnswers, QualityGate } from "./models";
import { slugify } from "./slug";

export interface PlanTaskGroupReference {
  readonly id: string;
  readonly title: string;
  readonly number: number;
}

export function requireInterviewAnswers(
  answers: InterviewAnswers | undefined,
  requiredKeys: readonly (keyof InterviewAnswers)[],
  workflowName: string
): QualityGate[] {
  return requiredKeys.map((key) => {
    const value = answers?.[key];
    const passed = typeof value === "string" && value.trim().length > 0;
    return {
      id: `${workflowName}.interview.${String(key)}`,
      name: `${workflowName} ${String(key)} answer`,
      severity: "blocking",
      passed,
      message: passed
        ? `Interview answer '${String(key)}' captured.`
        : `Hard gate: '${String(key)}' must be captured before writing ${workflowName} artifacts.`
    };
  });
}

export function validateConstitutionMarkdown(files: {
  readonly mission?: string;
  readonly techStack?: string;
  readonly roadmap?: string;
}): QualityGate[] {
  const roadmapPhaseIssues = roadmapPhaseCompletenessIssues(files.roadmap);
  return [
    gate("constitution.mission.exists", "Mission document exists", files.mission !== undefined),
    gate("constitution.mission.audience", "Mission includes target audience", includesAny(files.mission, ["audience", "user", "customer", "student", "developer"])),
    gate("constitution.mission.success", "Mission includes success criteria", includesAny(files.mission, ["success", "outcome", "what success looks like"])),
    gate("constitution.tech-stack.exists", "Tech stack document exists", files.techStack !== undefined),
    gate("constitution.tech-stack.testing", "Tech stack includes testing posture", includesAny(files.techStack, ["test", "tdd", "vitest", "playwright", "qa"])),
    gate("constitution.roadmap.exists", "Roadmap document exists", files.roadmap !== undefined),
    gate("constitution.roadmap.small-phases", "Roadmap contains small phases", countMatches(files.roadmap, /^##\s+Phase\s+/gim) > 0),
    gate("constitution.roadmap.checklist", "Roadmap uses checklist items", countMatches(files.roadmap, /^-\s+\[[ xX]\]/gim) > 0),
    gate("constitution.roadmap.phase-goals", "Every roadmap phase has a goal and checklist item", roadmapPhaseIssues.length === 0, roadmapPhaseIssues)
  ];
}

export function validateFeatureMarkdown(files: {
  readonly requirements?: string;
  readonly plan?: string;
  readonly validation?: string;
  readonly experience?: string;
  readonly rawText?: string;
}): QualityGate[] {
  const rawText = files.rawText ?? [files.requirements, files.plan, files.validation].filter((item): item is string => item !== undefined).join("\n\n");
  const gates = [
    gate("feature.requirements.exists", "requirements.md exists", files.requirements !== undefined),
    gate("feature.requirements.scope", "Requirements include scope", includesAny(files.requirements, ["scope"])),
    gate("feature.requirements.decisions", "Requirements include decisions", includesAny(files.requirements, ["decision"])),
    gate("feature.requirements.context", "Requirements include context", includesAny(files.requirements, ["context"])),
    gate("feature.requirements.ids", "Requirements contain at least one REQ-* id", countMatches(files.requirements, /\bREQ-\d+\b/g) > 0),
    gate("feature.plan.exists", "plan.md exists", files.plan !== undefined),
    gate("feature.plan.task-groups", "Plan contains numbered task groups", countMatches(files.plan, /^##\s+\d+\./gim) > 0 || countMatches(files.plan, /^\d+\.\s+/gim) > 0),
    gate("feature.plan.tdd", "Plan includes TDD/test tasks", includesAny(files.plan, ["test", "tdd", "validation"])),
    gate("feature.plan.traceability", "Plan tasks reference requirement and validation ids", planTasksReferenceIds(files.plan)),
    gate("feature.validation.exists", "validation.md exists", files.validation !== undefined),
    gate("feature.validation.automated", "Validation includes automated checks", includesAny(files.validation, ["automated", "npm test", "typecheck", "build"])),
    gate("feature.validation.executable", "Automated validation cases include commands or manual-only rationale", automatedValidationCasesAreExecutable(files.validation)),
    gate("feature.validation.manual", "Validation includes manual acceptance", includesAny(files.validation, ["manual", "walkthrough", "acceptance"])),
    gate("feature.validation.done", "Validation defines done", includesAny(files.validation, ["definition of done", "done"]))
  ];

  if (featureTextRequiresExperience(rawText, files.experience)) {
    gates.push(...validateExperienceMarkdown(files.experience));
  }

  return gates;
}

export function detectUiWork(text: string): boolean {
  return /\b(ui|browser|page|route|component|form|navigation|screen|frontend|playwright)\b/i.test(text);
}

export function detectDatabaseWork(text: string): boolean {
  return /\b(database|db|sqlite|postgres|migration|schema|table|persist|seed)\b/i.test(text);
}

export function detectDataMutationWork(text: string): boolean {
  const normalized = text.toLowerCase();
  if (/\b(read-only|read only|without mutation|no database mutation|no data mutation|no mutation|not applicable)\b/.test(normalized)) {
    return false;
  }
  const mutationTerms = /\b(insert|update|delete|upsert|mutate|mutation|persist|persisted|write|writes|writing|save|saved|create record|created record|remove record|seed|migration|schema change)\b/i;
  const dataContext = /\b(database|db|sqlite|postgres|mysql|mongodb|table|row|record|schema|migration|data store|datastore|repository)\b/i;
  return text.split(/\r?\n/).some((line) => mutationTerms.test(line) && dataContext.test(line));
}

export function validationCommandsFromPackage(packageJson: { readonly scripts?: Record<string, string> }): string[] {
  const scripts = packageJson.scripts ?? {};
  const commands: string[] = [];

  if (scripts.typecheck !== undefined) {
    commands.push("npm run typecheck");
  }
  if (scripts.test !== undefined) {
    commands.push("npm test");
  }
  if (scripts["test:e2e"] !== undefined) {
    commands.push("npm run test:e2e");
  }
  for (const [name, command] of Object.entries(scripts)) {
    if (["typecheck", "test", "test:e2e", "build"].includes(name)) {
      continue;
    }
    if (/\b(playwright|e2e)\b/i.test(name) || /\bplaywright\s+test\b/i.test(command)) {
      commands.push(`npm run ${name}`);
    }
  }
  if (scripts.build !== undefined) {
    commands.push("npm run build");
  }

  return commands;
}

export function validationCommandResolvesToPlaywright(command: string, scripts: Record<string, string>): boolean {
  const normalized = command.trim();
  if (containsDirectPlaywrightCommand(normalized)) {
    return true;
  }

  const scriptName = npmScriptNameFromCommand(normalized);
  if (scriptName === undefined) {
    return false;
  }

  return containsDirectPlaywrightCommand(scripts[scriptName] ?? "");
}

export function parsePlanTaskGroups(plan: string | undefined): readonly PlanTaskGroupReference[] {
  if (plan === undefined) {
    return [];
  }

  const headings = Array.from(plan.matchAll(/^##\s+(\d+)\.\s+(.+)$/gim));
  return headings.map((match, index) => {
    const next = headings[index + 1];
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = next?.index ?? plan.length;
    const body = plan.slice(bodyStart, bodyEnd);
    const number = Number.parseInt(match[1] ?? `${index + 1}`, 10);
    const title = (match[2] ?? `Task Group ${number}`).trim();
    const explicitId = /^Group ID:\s*`?([^`\r\n]+)`?/im.exec(body)?.[1]?.trim();
    return {
      id: explicitId ?? `group-${number}-${slugify(title)}`,
      title,
      number
    };
  });
}

export function resolvePlanTaskGroup(plan: string | undefined, requested: string): PlanTaskGroupReference | undefined {
  const normalized = requested.trim().toLowerCase();
  return parsePlanTaskGroups(plan).find((group) => group.id.toLowerCase() === normalized || group.title.toLowerCase() === normalized);
}

export function featureRequiresUiGate(feature: FeatureSpec, rawText: string): boolean {
  return featureAnswersRequireExperience({
    scope: feature.scope,
    decisions: feature.decisions,
    context: feature.context,
    experience: feature.experience
  }, rawText);
}

export function featureAnswersRequireExperience(
  answers: Pick<FeatureSpec, "scope" | "decisions" | "context"> & { readonly experience?: string },
  rawText = ""
): boolean {
  const combined = `${answers.scope}\n${answers.decisions}\n${answers.context}\n${answers.experience ?? ""}\n${rawText}`;
  if (isExplicitNoUiExperience(combined)) {
    return false;
  }
  return detectUiWork(combined);
}

export function validateExperienceAnswer(answers: Pick<FeatureSpec, "scope" | "decisions" | "context"> & { readonly experience?: string }): QualityGate[] {
  const experience = answers.experience?.trim() ?? "";
  const gates: QualityGate[] = [
    gate("feature.experience.answer", "Experience question answer exists", experience.length > 0)
  ];

  if (experience.length === 0) {
    return gates;
  }

  if (!featureAnswersRequireExperience(answers)) {
    return gates;
  }

  gates.push(...validateExperienceMarkdown(experience));
  return gates;
}

export function validateExperienceMarkdown(experience: string | undefined): QualityGate[] {
  const text = experience?.trim() ?? "";
  const flows = parseExperienceFlows(text);
  const flowFieldIssues = flows.flatMap((flow) => {
    const requiredFields = [
      ["Role", flow.fields.role],
      ["Route or Screen", flow.fields.routeOrScreen],
      ["Happy Path", flow.fields.happyPath],
      ["Edge Cases", flow.fields.edgeCases],
      ["Data Setup", flow.fields.dataSetup],
      ["Database Mutations", flow.fields.databaseMutations],
      ["Expected Visible Outcome", flow.fields.expectedVisibleOutcome],
      ["Playwright", flow.fields.playwright]
    ] as const;

    return requiredFields
      .filter(([, value]) => value === undefined || isPlaceholder(value))
      .map(([field]) => `${flow.id}.${field}`);
  });

  return [
    gate("feature.experience.exists", "experience.md exists for UI work", text.length > 0),
    gate("feature.experience.flows", "Experience contains FLOW-* entries", flows.length > 0),
    gate("feature.experience.no-todo", "Experience contains no TODO placeholders", text.length > 0 && !containsTodoPlaceholder(text)),
    gate("feature.experience.required-fields", "Each experience flow has role, route/screen, happy path, edge cases, data setup, database mutations, expected visible outcome, and Playwright mapping", flows.length > 0 && flowFieldIssues.length === 0)
  ].map((qualityGate) => flowFieldIssues.length === 0 || qualityGate.id !== "feature.experience.required-fields"
    ? qualityGate
    : {
        ...qualityGate,
        message: `Missing or placeholder experience fields: ${flowFieldIssues.join(", ")}.`
      });
}

export function experienceHasDatabaseMutations(experience: string | undefined): boolean {
  const text = experience?.trim() ?? "";
  if (text.length === 0) {
    return false;
  }
  const mutations = Array.from(text.matchAll(/^-\s*Database Mutations:\s*(.*)$/gim))
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean);
  return mutations.some((mutation) => !isNoDatabaseMutation(mutation));
}

export function isExplicitNoUiExperience(text: string | undefined): boolean {
  if (text === undefined) {
    return false;
  }
  return /\b(no ui-facing experience|no user-facing experience|no ui work|no ui-facing work|no browser experience|no browser ui|no frontend experience|no screen or page experience|not ui-facing|non-ui feature|no experience\.md required)\b/i.test(text);
}

export function featureTextRequiresExperience(rawText: string, experience?: string): boolean {
  return featureAnswersRequireExperience({
    scope: rawText,
    decisions: "",
    context: "",
    experience
  });
}

function parseExperienceFlows(markdown: string): readonly {
  readonly id: string;
  readonly fields: {
    readonly role?: string;
    readonly routeOrScreen?: string;
    readonly happyPath?: string;
    readonly edgeCases?: string;
    readonly dataSetup?: string;
    readonly databaseMutations?: string;
    readonly expectedVisibleOutcome?: string;
    readonly playwright?: string;
  };
}[] {
  const headings = Array.from(markdown.matchAll(/^###\s+(FLOW-[A-Za-z0-9_-]+):?.*$/gim));
  return headings.map((match, index) => {
    const next = headings[index + 1];
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = next?.index ?? markdown.length;
    const body = markdown.slice(bodyStart, bodyEnd);

    return {
      id: match[1] ?? "FLOW-UNKNOWN",
      fields: {
        role: readListField(body, "Role"),
        routeOrScreen: readListField(body, "Route or Screen"),
        happyPath: readListField(body, "Happy Path"),
        edgeCases: readListField(body, "Edge Cases"),
        dataSetup: readListField(body, "Data Setup"),
        databaseMutations: readListField(body, "Database Mutations"),
        expectedVisibleOutcome: readListField(body, "Expected Visible Outcome"),
        playwright: readListField(body, "Playwright")
      }
    };
  });
}

function readListField(markdown: string, field: string): string | undefined {
  return new RegExp(`^-\\s*${escapeRegExp(field)}:\\s*(.*)$`, "im").exec(markdown)?.[1]?.trim();
}

function isPlaceholder(value: string | undefined): boolean {
  const normalized = value?.trim() ?? "";
  return normalized.length === 0 || /^TODO\b/i.test(normalized);
}

function containsTodoPlaceholder(markdown: string): boolean {
  return markdown.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    return /^TODO\b/i.test(trimmed) || /:\s*TODO\b/i.test(trimmed) || /^-\s*TODO\b/i.test(trimmed);
  });
}

function isNoDatabaseMutation(value: string): boolean {
  return /^(none|n\/a|not applicable|no|no mutation|no database mutation|read only|read-only)$/i.test(value.trim());
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

function includesAny(text: string | undefined, needles: readonly string[]): boolean {
  if (text === undefined) {
    return false;
  }

  const normalized = text.toLowerCase();
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

function countMatches(text: string | undefined, pattern: RegExp): number {
  if (text === undefined) {
    return 0;
  }

  return Array.from(text.matchAll(pattern)).length;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function roadmapPhaseCompletenessIssues(markdown: string | undefined): string[] {
  if (markdown === undefined) {
    return ["roadmap missing"];
  }
  const headings = Array.from(markdown.matchAll(/^##\s+Phase\s+([^:\n]+):?.*$/gim));
  return headings.flatMap((heading, index) => {
    const next = headings[index + 1];
    const bodyStart = (heading.index ?? 0) + heading[0].length;
    const bodyEnd = next?.index ?? markdown.length;
    const body = markdown.slice(bodyStart, bodyEnd);
    const phase = heading[1]?.trim() ?? `phase-${index + 1}`;
    const issues: string[] = [];
    if (!/^\s*\*\*Goal:\*\*\s+\S/im.test(body)) {
      issues.push(`Phase ${phase} missing goal`);
    }
    if (!/^-\s+\[[ xX]\]\s+\S/im.test(body)) {
      issues.push(`Phase ${phase} missing checklist item`);
    }
    return issues;
  });
}

function planTasksReferenceIds(plan: string | undefined): boolean {
  if (plan === undefined) {
    return false;
  }
  const taskLines = plan.split(/\r?\n/).filter((line) => /^\d+\.\s+\[[ xX]\]/.test(line.trim()));
  return taskLines.length > 0 && taskLines.every((line) => /\bREQ-\d+\b/.test(line) && /\bVAL-\d+\b/.test(line));
}

function containsDirectPlaywrightCommand(command: string): boolean {
  return command.split(/\s*(?:&&|\|\||;)\s*/).some((segment) => isDirectPlaywrightCommand(segment));
}

function isDirectPlaywrightCommand(command: string): boolean {
  const trimmed = command.trim();
  return /^(?:npx\s+|pnpm\s+exec\s+|yarn\s+|npm\s+exec\s+)?playwright\s+test\b/i.test(trimmed)
    || /^node\s+["']?.*[\\/]@playwright[\\/]test[\\/]cli\.js["']?\s+test\b/i.test(trimmed);
}

function npmScriptNameFromCommand(command: string): string | undefined {
  const match = /^npm\s+(?:run|run-script)\s+(?:--\s+)?([^\s]+)/i.exec(command);
  return match?.[1];
}

function automatedValidationCasesAreExecutable(validation: string | undefined): boolean {
  if (validation === undefined) {
    return false;
  }
  const automated = readMarkdownSection(validation, "Automated");
  const cases = automated.split(/\r?\n/).filter((line) => /^-\s+\*\*VAL-\d+:\*\*/.test(line.trim()));
  return cases.length > 0 && cases.every((line) => /Command:\s*`[^`]+`/.test(line) || /\bmanual-only rationale\b|\bmanual only\b|\bnot automated\b/i.test(line));
}

function readMarkdownSection(markdown: string, heading: string): string {
  const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*\\r?\\n([\\s\\S]*?)(?=^##\\s+|$)`, "im");
  return pattern.exec(markdown)?.[1]?.trim() ?? "";
}
