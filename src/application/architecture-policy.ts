import path from "node:path";
import { FileSystemPort } from "./ports";

export interface ArchitecturePolicyFinding {
  readonly id: string;
  readonly severity: "warning" | "blocking";
  readonly summary: string;
  readonly evidenceRefs: readonly string[];
  readonly requiredFix: string;
}

export async function evaluateArchitecturePolicy(fs: FileSystemPort, projectRoot: string): Promise<readonly ArchitecturePolicyFinding[]> {
  const findings: ArchitecturePolicyFinding[] = [];
  findings.push(...await forbiddenImportFindings(fs, projectRoot, path.join(projectRoot, "src", "domain"), /\.\.\/application|\.\.\/adapters|\.\.\/interfaces|node:child_process|child_process|node:fs|fs\/promises|playwright|express|react/i, "domain-boundary", "Domain code imports application/adapter/interface/framework/process/filesystem details."));
  findings.push(...await forbiddenImportFindings(fs, projectRoot, path.join(projectRoot, "src", "application"), /\.\.\/adapters|\.\.\/interfaces|node:child_process|child_process|node:fs|fs\/promises|playwright|express|react|@prisma|prisma|pg\b|mysql|sqlite|mongodb|mongoose|axios/i, "application-boundary", "Application code imports concrete adapters, interfaces, frameworks, data clients, or direct process/filesystem details."));
  findings.push(...await forbiddenImportFindings(fs, projectRoot, path.join(projectRoot, "src", "adapters"), /\.\.\/interfaces/i, "adapter-boundary", "Adapter code imports outer CLI interfaces."));
  findings.push(...await sideEffectFindings(fs, projectRoot, path.join(projectRoot, "src", "domain"), "domain-side-effect", "Domain code performs direct side effects."));
  findings.push(...await sideEffectFindings(fs, projectRoot, path.join(projectRoot, "src", "application"), "application-side-effect", "Application code performs direct side effects instead of using ports."));
  findings.push(...await useCaseSizeFindings(fs, projectRoot, path.join(projectRoot, "src", "application", "use-cases")));
  findings.push(...await moduleSizeFindings(fs, projectRoot, path.join(projectRoot, "src", "adapters"), "adapter", 500));
  findings.push(...await moduleSizeFindings(fs, projectRoot, path.join(projectRoot, "src", "interfaces"), "interface", 400));
  findings.push(...await directProcessUsageFindings(fs, projectRoot, path.join(projectRoot, "src")));
  findings.push(...await adapterCouplingFindings(fs, projectRoot, path.join(projectRoot, "src", "adapters")));
  return findings;
}

async function forbiddenImportFindings(fs: FileSystemPort, projectRoot: string, root: string, forbidden: RegExp, claimId: string, summary: string): Promise<ArchitecturePolicyFinding[]> {
  const files = await listFiles(fs, root);
  const findings: ArchitecturePolicyFinding[] = [];
  for (const file of files.filter((item) => item.endsWith(".ts"))) {
    const content = await fs.readFile(file);
    const badLine = content.split(/\r?\n/).find((line) => {
      const specifier = importSpecifier(line);
      return specifier !== undefined && forbidden.test(specifier);
    });
    if (badLine !== undefined) {
      findings.push(policyFinding(`det-${claimId}-${path.basename(file)}`, "blocking", `${summary}: ${path.relative(projectRoot, file)} imports ${badLine.trim()}.`, [file], "Move framework/adapter details behind an application port."));
    }
  }
  return findings;
}

async function sideEffectFindings(fs: FileSystemPort, projectRoot: string, root: string, claimId: string, summary: string): Promise<ArchitecturePolicyFinding[]> {
  const files = await listFiles(fs, root);
  const findings: ArchitecturePolicyFinding[] = [];
  for (const file of files.filter((item) => item.endsWith(".ts"))) {
    const content = await fs.readFile(file);
    const badLine = content.split(/\r?\n/).find((line) => directSideEffectLine(line));
    if (badLine !== undefined) {
      findings.push(policyFinding(`det-${claimId}-${path.basename(file)}`, "blocking", `${summary}: ${path.relative(projectRoot, file)} contains ${badLine.trim()}.`, [file], "Move direct side effects behind an application port and implement them in an adapter."));
    }
  }
  return findings;
}

function directSideEffectLine(line: string): boolean {
  if (/^\s*\/\//.test(line)) return false;
  return /\bprocess\.env\b/.test(line)
    || /\bfetch\s*\(/.test(line)
    || /(?<!\.)\bexec(?:File)?(?:Sync)?\s*\(/.test(line)
    || /\bnew\s+(?:PrismaClient|Client|Pool|MongoClient)\b/.test(line);
}

async function useCaseSizeFindings(fs: FileSystemPort, projectRoot: string, root: string): Promise<ArchitecturePolicyFinding[]> {
  const files = await listFiles(fs, root);
  const findings: ArchitecturePolicyFinding[] = [];
  for (const file of files.filter((item) => item.endsWith(".ts"))) {
    const content = await fs.readFile(file);
    const lineCount = content.split(/\r?\n/).length;
    if (lineCount > 450) {
      findings.push(policyFinding(
        `det-solid-size-${path.basename(file)}`,
        "warning",
        `Use case ${path.relative(projectRoot, file)} is ${lineCount} lines; consider splitting orchestration from parsing/rendering helpers.`,
        [file],
        "Split oversized use cases when adding related behavior."
      ));
    }
    const helperCount = (content.match(/^function\s+\w+/gm) ?? []).length;
    const renderingParsingHelpers = (content.match(/\b(render|parse|extract|format|readSection|build)\w*\s*\(/g) ?? []).length;
    if (lineCount > 300 && helperCount >= 8 && renderingParsingHelpers >= 8) {
      findings.push(policyFinding(
        `det-solid-mixed-usecase-${path.basename(file)}`,
        "warning",
        `Use case ${path.relative(projectRoot, file)} mixes orchestration with ${renderingParsingHelpers} rendering/parsing helper references across ${lineCount} lines.`,
        [file],
        "Extract parsing/rendering helpers into domain services or adapter utilities before adding more behavior."
      ));
    }
  }
  return findings;
}

async function moduleSizeFindings(fs: FileSystemPort, projectRoot: string, root: string, label: string, maxLines: number): Promise<ArchitecturePolicyFinding[]> {
  const files = await listFiles(fs, root);
  const findings: ArchitecturePolicyFinding[] = [];
  for (const file of files.filter((item) => item.endsWith(".ts"))) {
    const lineCount = (await fs.readFile(file)).split(/\r?\n/).length;
    if (lineCount > maxLines) {
      findings.push(policyFinding(
        `det-solid-${label}-size-${path.basename(file)}`,
        "warning",
        `${capitalize(label)} ${path.relative(projectRoot, file)} is ${lineCount} lines; large outer modules are harder to replace cleanly.`,
        [file],
        `Split oversized ${label} modules or move reusable logic behind ports/utilities.`
      ));
    }
  }
  return findings;
}

async function directProcessUsageFindings(fs: FileSystemPort, projectRoot: string, root: string): Promise<ArchitecturePolicyFinding[]> {
  const files = await listFiles(fs, root);
  const findings: ArchitecturePolicyFinding[] = [];
  for (const file of files.filter((item) => item.endsWith(".ts"))) {
    const relative = path.relative(projectRoot, file).replace(/\\/g, "/");
    if (isApprovedProcessAdapter(relative)) {
      continue;
    }
    const content = await fs.readFile(file);
    const badLine = content.split(/\r?\n/).find((line) => directProcessLine(line));
    if (badLine !== undefined) {
      findings.push(policyFinding(
        `det-process-boundary-${path.basename(file)}`,
        "blocking",
        `Direct shell/process usage is only allowed in approved adapter classes: ${relative} contains ${badLine.trim()}.`,
        [file],
        "Move shell/process execution behind an application port and an approved adapter."
      ));
    }
  }
  return findings;
}

async function adapterCouplingFindings(fs: FileSystemPort, projectRoot: string, root: string): Promise<ArchitecturePolicyFinding[]> {
  const files = await listFiles(fs, root);
  const findings: ArchitecturePolicyFinding[] = [];
  for (const file of files.filter((item) => item.endsWith(".ts"))) {
    const relative = path.relative(projectRoot, file).replace(/\\/g, "/");
    const sourceAdapter = adapterSegment(relative);
    if (sourceAdapter === undefined) {
      continue;
    }
    const content = await fs.readFile(file);
    const badLine = content.split(/\r?\n/).find((line) => {
      const target = /^import\s+.*\s+from\s+["']\.\.\/([^./"']+)(?:\/|["'])/.exec(line)?.[1];
      return target !== undefined && target !== "commands" && target !== sourceAdapter;
    });
    if (badLine !== undefined) {
      findings.push(policyFinding(
        `det-adapter-coupling-${path.basename(file)}`,
        "warning",
        `Adapter ${relative} imports a sibling adapter via ${badLine.trim()}; a port or shared utility is usually cleaner.`,
        [file],
        "Depend on an application port or move shared code into src/adapters/commands or another explicit utility module."
      ));
    }
  }
  return findings;
}

function directProcessLine(line: string): boolean {
  if (/^\s*\/\//.test(line)) return false;
  return /^import\s+.*["']node:child_process["']/.test(line)
    || /^import\s+.*["']child_process["']/.test(line)
    || /(?<![A-Za-z0-9_.])(?:exec|execFile|spawn)(?:Sync)?\s*\(/.test(line);
}

function isApprovedProcessAdapter(relative: string): boolean {
  return /^src\/adapters\/(?:commands\/command-executor|agents\/command-agent-provider|questions\/command-question-adapter|git\/child-process-git|database\/(?:file-database-sandbox|command-database-mutation-verifier)|testing\/(?:command-test-runner|command-review-agent|command-semantic-verifier|shell-agent-runner))\.ts$/.test(relative);
}

function adapterSegment(relative: string): string | undefined {
  return /^src\/adapters\/([^/]+)\//.exec(relative)?.[1];
}

function importSpecifier(line: string): string | undefined {
  if (!/^import\s/.test(line)) return undefined;
  return /\sfrom\s+["']([^"']+)["']/.exec(line)?.[1] ?? /^import\s+["']([^"']+)["']/.exec(line)?.[1];
}

function capitalize(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

async function listFiles(fs: FileSystemPort, root: string): Promise<string[]> {
  if (!(await fs.exists(root))) return [];
  const entries = await fs.list(root);
  const files: string[] = [];
  for (const entry of entries) {
    const filePath = path.join(root, entry);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory) {
      files.push(...await listFiles(fs, filePath));
    } else if (stat.isFile) {
      files.push(filePath);
    }
  }
  return files;
}

function policyFinding(id: string, severity: "warning" | "blocking", summary: string, evidenceRefs: readonly string[], requiredFix: string): ArchitecturePolicyFinding {
  return { id, severity, summary, evidenceRefs, requiredFix };
}
