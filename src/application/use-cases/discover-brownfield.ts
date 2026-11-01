import path from "node:path";
import { ClockPort, FileSystemPort, GitPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { ProjectProfile } from "../../domain/models";
import { traceUseCase } from "./common";

export class DiscoverBrownfieldUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly git: GitPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(): Promise<ProjectProfile> {
    return traceUseCase(this.telemetry, this.clock, "brownfield discover", { projectRoot: this.projectRoot }, async () => {
      await this.store.ensureProject();
      const files = await this.walk(this.projectRoot, 4);
      const packageScriptCommands = await this.readPackageScriptCommands();
      const routes = files.filter((file) => /(routes?|pages?|app)\/.+\.(ts|tsx|js|jsx)$/.test(file));
      const databaseFiles = files.filter((file) => /(migration|schema|seed|db|database)|\.(sqlite|db|sql)$/i.test(file));
      const uiFiles = files.filter((file) => /\.(tsx|jsx|vue|svelte|html|css)$/.test(file));
      const profile: ProjectProfile = {
        mode: "brownfield",
        rootPath: this.projectRoot,
        hasGit: await this.git.isRepository(),
        packageManagers: files.filter((file) => /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|uv\.lock|poetry\.lock|Cargo\.lock|go\.sum)$/.test(file)),
        packageScripts: Object.keys(packageScriptCommands).sort(),
        packageScriptCommands,
        testCommandCandidates: testCommandCandidates(packageScriptCommands),
        languages: inferLanguages(files),
        testFiles: files.filter((file) => /\b(test|spec|e2e)\b/i.test(file)),
        uiFiles,
        uiEntryCandidates: uiEntryCandidates(uiFiles),
        databaseFiles,
        databaseSchemaSummaries: await this.summarizeFiles(databaseFiles.filter((file) => /(migration|schema)|\.(sql|prisma)$/i.test(file)), 12),
        routes,
        routeSummaries: await this.summarizeFiles(routes, 12),
        architectureFiles: files.filter((file) => /(architecture|adr|decision|docs\/.+\.(md|mdx))|AGENTS\.md/i.test(file)),
        issueFiles: files.filter((file) => /(TODO|BACKLOG|issues?|tasks?)\.(md|txt|json)$/i.test(file)),
        deploymentFiles: files.filter((file) => /(Dockerfile|docker-compose|render\.yaml|vercel\.json|netlify\.toml|fly\.toml|\.github\/workflows)/.test(file)),
        readmeSummary: await this.readFirstExisting(["README.md", "readme.md"]),
        todoSummary: await this.readFirstExisting(["TODO.md", "todo.md"])
      };

      const outputPath = path.join(this.projectRoot, ".sdd", "brownfield-profile.json");
      await this.fs.writeFile(outputPath, `${JSON.stringify(profile, null, 2)}\n`);
      await this.workflow.updateStep("brownfield-discovery", {
        status: "complete",
        evidence: [outputPath]
      });
      await this.workflow.updateStep("create-constitution", { status: "ready" });

      const metadata = await this.store.readMetadata();
      await this.store.writeMetadata({
        ...metadata,
        project: {
          ...metadata.project,
          mode: "brownfield",
          initializedAt: metadata.project?.initializedAt ?? this.clock.now().toISOString()
        }
      });

      return { result: profile, outputs: { profilePath: outputPath, fileCount: files.length } };
    });
  }

  private async walk(root: string, maxDepth: number, currentDepth = 0): Promise<string[]> {
    if (currentDepth > maxDepth) {
      return [];
    }

    const entries = await this.fs.list(root);
    const result: string[] = [];
    for (const entry of entries) {
      if (["node_modules", "dist", ".git", ".sdd", ".next", "coverage"].includes(entry)) {
        continue;
      }
      const absolute = path.join(root, entry);
      const stat = await this.fs.stat(absolute);
      const relative = path.relative(this.projectRoot, absolute);
      if (stat.isFile) {
        result.push(relative);
      } else if (stat.isDirectory) {
        result.push(...(await this.walk(absolute, maxDepth, currentDepth + 1)));
      }
    }
    return result.sort();
  }

  private async readFirstExisting(candidates: readonly string[]): Promise<string | undefined> {
    for (const candidate of candidates) {
      const filePath = path.join(this.projectRoot, candidate);
      if (await this.fs.exists(filePath)) {
        return (await this.fs.readFile(filePath)).slice(0, 4000);
      }
    }
    return undefined;
  }

  private async readPackageScriptCommands(): Promise<Record<string, string>> {
    const packagePath = path.join(this.projectRoot, "package.json");
    if (!(await this.fs.exists(packagePath))) {
      return {};
    }
    const parsed = JSON.parse(await this.fs.readFile(packagePath)) as { readonly scripts?: Record<string, string> };
    return parsed.scripts ?? {};
  }

  private async summarizeFiles(files: readonly string[], limit: number): Promise<readonly { readonly path: string; readonly summary: string }[]> {
    const summaries: { readonly path: string; readonly summary: string }[] = [];
    for (const file of files.slice(0, limit)) {
      const content = await this.readSummary(path.join(this.projectRoot, file));
      summaries.push({ path: file, summary: content });
    }
    return summaries;
  }

  private async readSummary(filePath: string): Promise<string> {
    const content = await this.fs.readFile(filePath);
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 12)
      .join(" ")
      .slice(0, 800);
  }
}

function inferLanguages(files: readonly string[]): string[] {
  const languages = new Set<string>();
  for (const file of files) {
    if (/\.(ts|tsx)$/.test(file)) languages.add("TypeScript");
    if (/\.(js|jsx|mjs|cjs)$/.test(file)) languages.add("JavaScript");
    if (/\.py$/.test(file)) languages.add("Python");
    if (/\.go$/.test(file)) languages.add("Go");
    if (/\.rs$/.test(file)) languages.add("Rust");
    if (/\.(java|kt)$/.test(file)) languages.add("JVM");
    if (/\.(cs)$/.test(file)) languages.add(".NET");
  }
  return Array.from(languages).sort();
}

function testCommandCandidates(scripts: Record<string, string>): readonly { readonly name: string; readonly command: string; readonly reason: string }[] {
  return Object.entries(scripts)
    .filter(([name, command]) => /\b(test|spec|e2e|playwright|vitest|jest|typecheck|qa)\b/i.test(`${name} ${command}`))
    .map(([name, command]) => ({
      name,
      command,
      reason: /\bplaywright\s+test\b/i.test(command)
        ? "Playwright UI validation candidate"
        : "Automated validation candidate"
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function uiEntryCandidates(uiFiles: readonly string[]): readonly string[] {
  return uiFiles.filter((file) => /(^|\/)(App|app|main|index|layout|page|root)\.(tsx|jsx|vue|svelte|html)$/.test(file));
}
