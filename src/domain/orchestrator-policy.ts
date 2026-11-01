import { AgentImplementationPhase } from "./models";

export interface TddSourceEvidenceFinding {
  readonly id: string;
  readonly message: string;
  readonly files: readonly string[];
}

export interface TddSourceEvidenceResult {
  readonly passed: boolean;
  readonly sharedTestFiles: readonly string[];
  readonly findings: readonly TddSourceEvidenceFinding[];
}

export interface AgentChangeScopeFinding {
  readonly id: string;
  readonly message: string;
  readonly files: readonly string[];
}

export interface AgentChangeScopeResult {
  readonly passed: boolean;
  readonly allowedFiles: readonly string[];
  readonly findings: readonly AgentChangeScopeFinding[];
}

export interface AgentDraftSchemaFinding {
  readonly id: string;
  readonly path: string;
  readonly message: string;
}

export interface AgentDraftSchemaResult {
  readonly passed: boolean;
  readonly findings: readonly AgentDraftSchemaFinding[];
}

export function evaluateTddSourceEvidence(input: {
  readonly taskGroup: string;
  readonly redChangedFiles: readonly string[];
  readonly greenChangedFiles: readonly string[];
  readonly refactorChangedFiles?: readonly string[];
}): TddSourceEvidenceResult {
  const redTestFiles = testFiles(input.redChangedFiles);
  const greenTestFiles = testFiles(input.greenChangedFiles);
  const sharedTestFiles = redTestFiles.filter((file) => greenTestFiles.includes(file));
  const findings: TddSourceEvidenceFinding[] = [];

  if (redTestFiles.length === 0) {
    findings.push({
      id: "tdd.red.real-test-file",
      message: `Red phase for '${input.taskGroup}' must create or modify a real test source file.`,
      files: normalizeChangedFiles(input.redChangedFiles)
    });
  }
  if (greenTestFiles.length === 0 || sharedTestFiles.length === 0) {
    findings.push({
      id: "tdd.green.same-test-file",
      message: `Green phase for '${input.taskGroup}' must reference the same real test source file recorded in red.`,
      files: normalizeChangedFiles(input.greenChangedFiles)
    });
  }

  const refactorChangedFiles = input.refactorChangedFiles ?? [];
  if (refactorChangedFiles.length > 0) {
    const refactorTests = testFiles(refactorChangedFiles);
    const changedTests = refactorTests.filter((file) => !sharedTestFiles.includes(file));
    if (refactorTests.length > 0 && changedTests.length === refactorTests.length) {
      findings.push({
        id: "tdd.refactor.same-test-file",
        message: `Refactor phase for '${input.taskGroup}' changed test files that were not part of the red/green pair.`,
        files: changedTests
      });
    }
  }

  return {
    passed: findings.length === 0,
    sharedTestFiles,
    findings
  };
}

export function evaluateAgentChangeScope(input: {
  readonly featureId: string;
  readonly taskGroup: string;
  readonly phase: AgentImplementationPhase;
  readonly changedFiles: readonly string[];
  readonly allowSpecEdits?: boolean;
}): AgentChangeScopeResult {
  const changedFiles = normalizeChangedFiles(input.changedFiles);
  const findings: AgentChangeScopeFinding[] = [];
  const forbiddenSpecFiles = changedFiles.filter((file) => isApprovedSpecPath(file, input.featureId));
  if (forbiddenSpecFiles.length > 0 && input.allowSpecEdits !== true) {
    findings.push({
      id: "agent.scope.approved-spec",
      message: `Agent ${input.phase} phase for '${input.taskGroup}' changed approved spec files; specs can only change through explicit spec revision workflows.`,
      files: forbiddenSpecFiles
    });
  }

  const forbiddenPaths = changedFiles.filter((file) => !isAllowedImplementationPath(file));
  const forbiddenNonSpecPaths = forbiddenPaths.filter((file) => !forbiddenSpecFiles.includes(file));
  if (forbiddenNonSpecPaths.length > 0) {
    findings.push({
      id: "agent.scope.forbidden-path",
      message: `Agent ${input.phase} phase for '${input.taskGroup}' changed files outside the default implementation surface.`,
      files: forbiddenNonSpecPaths
    });
  }

  return {
    passed: findings.length === 0,
    allowedFiles: changedFiles.filter((file) => !forbiddenPaths.includes(file)),
    findings
  };
}

export function evaluateGuidedDraftSchema(input: {
  readonly schema: Record<string, unknown>;
  readonly value: unknown;
  readonly label: string;
}): AgentDraftSchemaResult {
  const findings: AgentDraftSchemaFinding[] = [];
  validateSchemaValue(input.schema, input.value, input.label, findings);
  return {
    passed: findings.length === 0,
    findings
  };
}

export function isRealTestFilePath(value: string): boolean {
  const file = normalizeChangedPath(value);
  return /^tests?\//.test(file)
    || /(?:^|\/)(?:e2e|playwright)\//.test(file)
    || /\.(?:test|spec|pw)\.[cm]?[jt]sx?$/.test(file);
}

export function normalizeChangedFiles(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values.map(normalizeChangedPath).filter((value) => value.length > 0))).sort();
}

export function normalizeChangedPath(value: string): string {
  let file = value.trim().replace(/\\/g, "/");
  const rename = /^R\d{3}\s+(.+?)\s+->\s+(.+)$/.exec(file);
  if (rename !== null) {
    file = rename[2] ?? file;
  } else {
    file = file.replace(/^(?:[AMDRCU?! ]{1,2})\s+/, "");
  }
  if (file.startsWith("./")) {
    file = file.slice(2);
  }
  return file;
}

function testFiles(values: readonly string[]): readonly string[] {
  return normalizeChangedFiles(values).filter(isRealTestFilePath);
}

function isApprovedSpecPath(file: string, featureId: string): boolean {
  return file === "specs/mission.md"
    || file === "specs/tech-stack.md"
    || file === "specs/roadmap.md"
    || file === "specs/jtbd.md"
    || file.startsWith(`specs/${featureId}/`);
}

function isAllowedImplementationPath(file: string): boolean {
  return file.startsWith("src/")
    || file.startsWith("test/")
    || file.startsWith("tests/")
    || file.startsWith("e2e/")
    || file.startsWith("migrations/")
    || file.startsWith("db/migrations/")
    || file.startsWith("prisma/")
    || file.startsWith("supabase/")
    || file.startsWith(".sdd/evidence/")
    || file.startsWith(".sdd/agent-runs/")
    || file.startsWith(".sdd/orchestrator-evidence/")
    || /^(?:package|package-lock|pnpm-lock|yarn|bun\.lockb)(?:\.json|\.yaml|\.lock)?$/.test(file)
    || /^(?:tsconfig(?:\.[^.]+)?|vitest\.config|playwright\.config|vite\.config|next\.config|eslint\.config|prettier\.config|tailwind\.config|postcss\.config)\.[cm]?[jt]s(?:on)?$/.test(file)
    || /\.(?:test|spec|pw)\.[cm]?[jt]sx?$/.test(file)
    || /\.sql$/.test(file);
}

function validateSchemaValue(
  schema: Record<string, unknown>,
  value: unknown,
  path: string,
  findings: AgentDraftSchemaFinding[]
): void {
  const type = schema.type;
  if (type === "object") {
    validateObjectSchema(schema, value, path, findings);
    return;
  }
  if (type === "array") {
    validateArraySchema(schema, value, path, findings);
    return;
  }
  if (type === "string") {
    if (typeof value !== "string" || value.trim().length === 0) {
      findings.push({ id: "draft.schema.type", path, message: `${path} must be a non-empty string.` });
    }
    return;
  }
}

function validateObjectSchema(
  schema: Record<string, unknown>,
  value: unknown,
  path: string,
  findings: AgentDraftSchemaFinding[]
): void {
  if (!isRecord(value)) {
    findings.push({ id: "draft.schema.type", path, message: `${path} must be an object.` });
    return;
  }
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === "string") : Object.keys(properties);
  for (const key of required) {
    if (!(key in value)) {
      findings.push({ id: "draft.schema.required", path: `${path}.${key}`, message: `${path}.${key} is required.` });
    }
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in properties)) {
        findings.push({ id: "draft.schema.additional-property", path: `${path}.${key}`, message: `${path}.${key} is not allowed.` });
      }
    }
  }
  for (const [key, childSchema] of Object.entries(properties)) {
    if (key in value && isRecord(childSchema)) {
      validateSchemaValue(childSchema, value[key], `${path}.${key}`, findings);
    }
  }
}

function validateArraySchema(
  schema: Record<string, unknown>,
  value: unknown,
  path: string,
  findings: AgentDraftSchemaFinding[]
): void {
  if (!Array.isArray(value)) {
    findings.push({ id: "draft.schema.type", path, message: `${path} must be an array.` });
    return;
  }
  const itemSchema = isRecord(schema.items) ? schema.items : undefined;
  if (itemSchema === undefined) {
    return;
  }
  value.forEach((item, index) => validateSchemaValue(itemSchema, item, `${path}[${index}]`, findings));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
