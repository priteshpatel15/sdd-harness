import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { FileSystemPort } from "../../application/ports";
import { slugify } from "../../domain/slug";

const execAsync = promisify(exec);

export interface CommandExecutionOptions {
  readonly cwd: string;
  readonly env?: Record<string, string>;
  readonly timeoutMs?: number;
  readonly maxBuffer?: number;
}

export interface CommandExecutionResult {
  readonly stdout: string;
  readonly stderr: string;
}

export interface CommandExecutionError {
  readonly code?: number;
  readonly stdout?: string;
  readonly stderr?: string;
  readonly message?: string;
}

export async function executeCommand(command: string, options: CommandExecutionOptions): Promise<CommandExecutionResult> {
  return execAsync(command, {
    cwd: options.cwd,
    timeout: options.timeoutMs,
    maxBuffer: options.maxBuffer ?? 10 * 1024 * 1024,
    env: {
      ...process.env,
      ...(options.env ?? {})
    }
  });
}

export async function writeCommandEvidence(input: {
  readonly fs: FileSystemPort;
  readonly projectRoot: string;
  readonly label: string;
  readonly command: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly extraSections?: readonly { readonly title: string; readonly body: string }[];
}): Promise<string> {
  const evidencePath = path.join(input.projectRoot, ".sdd", "evidence", `${Date.now()}-${slugify(input.label)}.log`);
  const sections = [
    `$ ${input.command}`,
    ...(input.extraSections ?? []).map((section) => `# ${section.title}\n${section.body}`),
    `# stdout\n${input.stdout}`,
    `# stderr\n${input.stderr}`
  ];
  await input.fs.writeFile(evidencePath, `${sections.join("\n\n")}\n`);
  return evidencePath;
}
