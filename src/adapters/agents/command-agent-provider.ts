import { spawn } from "node:child_process";
import { exec } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { AgentProviderPort, FileSystemPort } from "../../application/ports";
import { AgentConfig, AgentDraftRequest, AgentDraftResult, AgentImplementationRequest, AgentImplementationResult, AgentProvider, ReviewLens } from "../../domain/models";
import { ValidationError } from "../../domain/errors";
import { slugify } from "../../domain/slug";
import { writeCommandEvidence } from "../commands/command-executor";

const execAsync = promisify(exec);

interface AgentRegistry {
  readonly defaultProvider?: AgentProvider;
  readonly providers?: Partial<Record<AgentProvider, AgentConfig>>;
}

export class CommandAgentProvider implements AgentProviderPort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  public async configure(input: {
    readonly provider: AgentProvider;
    readonly draftCommandTemplate?: string;
    readonly reviewCommandTemplate?: string;
    readonly implementationCommandTemplate?: string;
    readonly requiredReviewLenses?: readonly ReviewLens[];
  }): Promise<AgentConfig> {
    const existing = await this.readRegistry();
    const config: AgentConfig = {
      provider: input.provider,
      configuredAt: this.now(),
      draftCommandTemplate: input.draftCommandTemplate ?? defaultDraftCommand(input.provider),
      reviewCommandTemplate: input.reviewCommandTemplate ?? defaultReviewCommand(input.provider),
      implementationCommandTemplate: input.implementationCommandTemplate ?? defaultImplementationCommand(input.provider),
      requiredReviewLenses: input.requiredReviewLenses ?? ["architecture", "spec-alignment", "test-and-qa"]
    };
    const registry: AgentRegistry = {
      defaultProvider: input.provider,
      providers: {
        ...(existing.providers ?? {}),
        [input.provider]: config
      }
    };
    await this.fs.writeFile(this.configPath(), `${JSON.stringify(registry, null, 2)}\n`);
    return config;
  }

  public async readConfig(projectRoot: string, provider?: AgentProvider): Promise<AgentConfig | undefined> {
    void projectRoot;
    const registry = await this.readRegistry();
    const selected = provider ?? registry.defaultProvider;
    if (selected === undefined) {
      return undefined;
    }
    return registry.providers?.[selected];
  }

  public async doctor(projectRoot: string, provider: AgentProvider): Promise<{ readonly provider: AgentProvider; readonly available: boolean; readonly command: string; readonly message: string }> {
    void projectRoot;
    const command = provider === "codex" ? "codex" : "claude";
    try {
      const result = await execAsync(`command -v ${command}`, { cwd: this.projectRoot });
      const resolved = result.stdout.trim();
      return {
        provider,
        available: resolved.length > 0,
        command,
        message: resolved.length > 0 ? `${provider} CLI found at ${resolved}.` : `${provider} CLI was not found on PATH.`
      };
    } catch {
      return {
        provider,
        available: false,
        command,
        message: `${provider} CLI was not found on PATH.`
      };
    }
  }

  public async draft(input: AgentDraftRequest): Promise<AgentDraftResult> {
    const config = await this.readConfig(input.projectRoot, input.provider);
    if (config === undefined) {
      throw new ValidationError(`Agent provider '${input.provider}' is not configured. Run sdd agent configure --provider ${input.provider}.`);
    }

    const runRoot = path.join(input.projectRoot, ".sdd", "agent-runs", `${this.now().replace(/[:.]/g, "-")}-${slugify(input.purpose)}${input.lens ? `-${slugify(input.lens)}` : ""}${input.semanticDimension ? `-${slugify(input.semanticDimension)}` : ""}`);
    const promptPath = path.join(runRoot, "prompt.md");
    const schemaPath = path.join(runRoot, "schema.json");
    const outputPath = path.join(runRoot, "output.json");
    await this.fs.writeFile(promptPath, input.prompt);
    await this.fs.writeFile(schemaPath, `${JSON.stringify(input.schema, null, 2)}\n`);

    const template = input.purpose === "review"
      ? config.reviewCommandTemplate ?? defaultReviewCommand(input.provider)
      : config.draftCommandTemplate ?? defaultDraftCommand(input.provider);
    const command = renderCommandTemplate(template, {
      provider: input.provider,
      projectRoot: input.projectRoot,
      promptFile: promptPath,
      schemaFile: schemaPath,
      outputFile: outputPath,
      purpose: input.purpose,
      featureId: input.featureId ?? "project",
      lens: input.lens ?? input.semanticDimension ?? "architecture"
    });
    const result = await runShellCommand(command, input.prompt, input.projectRoot);
    const outputFileText = await this.readOutputFile(outputPath);
    const rawText = outputFileText.trim().length > 0 ? outputFileText : result.stdout;
    const parsed = parseAgentJson(rawText);
    return {
      provider: input.provider,
      purpose: input.purpose,
      parsed,
      rawText,
      promptPath,
      schemaPath,
      outputPath,
      command
    };
  }

  public async implement(input: AgentImplementationRequest): Promise<AgentImplementationResult> {
    const config = await this.readConfig(input.projectRoot, input.provider);
    if (config === undefined) {
      throw new ValidationError(`Agent provider '${input.provider}' is not configured. Run sdd agent configure --provider ${input.provider}.`);
    }

    const runRoot = path.join(input.projectRoot, ".sdd", "agent-runs", `${this.now().replace(/[:.]/g, "-")}-implementation-${slugify(input.phase)}-${slugify(input.taskGroup ?? input.featureId)}`);
    const promptPath = path.join(runRoot, "prompt.md");
    await this.fs.writeFile(promptPath, input.prompt);
    const command = renderCommandTemplate(config.implementationCommandTemplate ?? defaultImplementationCommand(input.provider), {
      provider: input.provider,
      projectRoot: input.projectRoot,
      promptFile: promptPath,
      schemaFile: path.join(runRoot, "schema.json"),
      outputFile: path.join(runRoot, "output.json"),
      purpose: "implementation",
      phase: input.phase,
      featureId: input.featureId,
      taskGroup: input.taskGroup ?? "feature",
      lens: "implementation"
    });
    const before = await changeSnapshot(input.projectRoot);
    const result = await runShellCommandCapture(command, input.prompt, input.projectRoot);
    const after = await changeSnapshot(input.projectRoot);
    const changedFilesAfter = changedFilesBetween(before, after);
    const evidencePath = await writeCommandEvidence({
      fs: this.fs,
      projectRoot: input.projectRoot,
      label: `agent-${input.phase}-${input.taskGroup ?? input.featureId}`,
      command,
      stdout: result.stdout,
      stderr: result.stderr,
      extraSections: [
        { title: "prompt", body: input.prompt },
        { title: "changed files before", body: before.changedFiles.join("\n") || before.note },
        { title: "changed files after", body: changedFilesAfter.join("\n") || after.note },
        { title: "diff", body: after.diff ?? fallbackSnapshotDiff(before, after) ?? "No git diff available." }
      ]
    });

    return {
      provider: input.provider,
      phase: input.phase,
      featureId: input.featureId,
      taskGroup: input.taskGroup,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      promptPath,
      evidencePath,
      command,
      changedFilesBefore: before.changedFiles,
      changedFilesAfter,
      diff: after.diff ?? fallbackSnapshotDiff(before, after)
    };
  }

  private async readOutputFile(outputPath: string): Promise<string> {
    return (await this.fs.exists(outputPath)) ? this.fs.readFile(outputPath) : "";
  }

  private async readRegistry(): Promise<AgentRegistry> {
    if (!(await this.fs.exists(this.configPath()))) {
      return {};
    }
    const parsed = JSON.parse(await this.fs.readFile(this.configPath())) as AgentRegistry | AgentConfig;
    if ("providers" in parsed) {
      return parsed;
    }
    if ("provider" in parsed) {
      return {
        defaultProvider: parsed.provider,
        providers: { [parsed.provider]: parsed }
      };
    }
    return {};
  }

  private configPath(): string {
    return path.join(this.projectRoot, ".sdd", "agents.json");
  }
}

export function renderCommandTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((command, [key, value]) => command.replaceAll(`{${key}}`, shellQuote(value)), template);
}

export function parseAgentJson(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("Agent returned empty output.");
  }
  const parsed = parseJsonValue(trimmed);
  if (parsed !== undefined) {
    return unwrapAgentJson(parsed);
  }
  const objectText = extractJsonObject(trimmed);
  if (objectText !== undefined) {
    const extracted = parseJsonValue(objectText);
    if (extracted !== undefined) {
      return unwrapAgentJson(extracted);
    }
  }
  throw new ValidationError("Agent output did not contain valid JSON.");
}

function unwrapAgentJson(value: unknown): unknown {
  if (typeof value === "object" && value !== null && "result" in value) {
    const record = value as { readonly result?: unknown };
    if (typeof record.result === "string") {
      return parseAgentJson(record.result);
    }
  }
  if (typeof value === "object" && value !== null && "content" in value) {
    const record = value as { readonly content?: unknown };
    if (typeof record.content === "string") {
      return parseAgentJson(record.content);
    }
  }
  return value;
}

function parseJsonValue(rawText: string): unknown | undefined {
  try {
    return JSON.parse(rawText);
  } catch {
    return undefined;
  }
}

function extractJsonObject(rawText: string): string | undefined {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  return start >= 0 && end > start ? rawText.slice(start, end + 1) : undefined;
}

function defaultDraftCommand(provider: AgentProvider): string {
  return provider === "codex"
    ? "codex exec -C {projectRoot} --sandbox read-only --ask-for-approval never --output-schema {schemaFile} --output-last-message {outputFile} -"
    : "claude --print --permission-mode plan --output-format json --json-schema {schemaFile}";
}

function defaultReviewCommand(provider: AgentProvider): string {
  return defaultDraftCommand(provider);
}

function defaultImplementationCommand(provider: AgentProvider): string {
  return provider === "codex"
    ? "codex exec -C {projectRoot} --sandbox workspace-write --ask-for-approval never -"
    : "claude --print --permission-mode acceptEdits";
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function runShellCommand(command: string, stdin: string, cwd: string): Promise<{ readonly stdout: string; readonly stderr: string; readonly exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      const exitCode = code ?? 1;
      if (exitCode === 0) {
        resolve({ stdout, stderr, exitCode });
      } else {
        reject(new ValidationError(`Agent command failed with exit code ${exitCode}: ${stderr || stdout}`));
      }
    });
    child.stdin.end(stdin);
  });
}

function runShellCommandCapture(command: string, stdin: string, cwd: string): Promise<{ readonly stdout: string; readonly stderr: string; readonly exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
    child.stdin.end(stdin);
  });
}

interface ChangeSnapshot {
  readonly mode: "git" | "filesystem";
  readonly changedFiles: readonly string[];
  readonly diff?: string;
  readonly note: string;
  readonly files?: ReadonlyMap<string, string>;
}

async function changeSnapshot(cwd: string): Promise<ChangeSnapshot> {
  try {
    const status = await execAsync("git status --short", { cwd });
    const diff = await execAsync("git diff", { cwd });
    return {
      mode: "git",
      changedFiles: status.stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0),
      diff: diff.stdout,
      note: "No changed files reported by git status.",
      files: await fileHashes(cwd)
    };
  } catch {
    return {
      mode: "filesystem",
      changedFiles: [],
      note: "No git repository detected; changed files were computed from a filesystem snapshot.",
      files: await fileHashes(cwd)
    };
  }
}

function changedFilesBetween(before: ChangeSnapshot, after: ChangeSnapshot): readonly string[] {
  if (before.files === undefined || after.files === undefined) {
    return after.changedFiles;
  }
  const changed = new Set<string>();
  for (const [file, hash] of after.files.entries()) {
    if (before.files.get(file) !== hash) {
      changed.add(file);
    }
  }
  for (const file of before.files.keys()) {
    if (!after.files.has(file)) {
      changed.add(file);
    }
  }
  return Array.from(changed).sort();
}

function fallbackSnapshotDiff(before: ChangeSnapshot, after: ChangeSnapshot): string | undefined {
  if (after.mode === "git") {
    return after.diff;
  }
  const changed = changedFilesBetween(before, after);
  return changed.length > 0
    ? `Filesystem snapshot changed files:\n${changed.map((file) => `- ${file}`).join("\n")}`
    : undefined;
}

async function fileHashes(root: string): Promise<ReadonlyMap<string, string>> {
  const files = new Map<string, string>();
  await collectFileHashes(root, root, files);
  return files;
}

async function collectFileHashes(root: string, current: string, files: Map<string, string>): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldSkipSnapshotEntry(entry.name)) {
      continue;
    }
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await collectFileHashes(root, fullPath, files);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const info = await stat(fullPath);
    if (info.size > 2 * 1024 * 1024) {
      continue;
    }
    const relative = path.relative(root, fullPath).replace(/\\/g, "/");
    const content = await readFile(fullPath);
    files.set(relative, createHash("sha256").update(content).digest("hex"));
  }
}

function shouldSkipSnapshotEntry(name: string): boolean {
  return name === ".git"
    || name === "node_modules"
    || name === "dist"
    || name === ".DS_Store";
}
