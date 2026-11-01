import path from "node:path";
import { ClockPort, FileSystemPort, GitPort, TelemetrySink, WorkflowStatePort } from "../ports";
import { traceUseCase } from "./common";

export class UpdateChangelogUseCase {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly git: GitPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(): Promise<{ readonly path: string; readonly changed: boolean }> {
    return traceUseCase<{ readonly path: string; readonly changed: boolean }>(this.telemetry, this.clock, "changelog update", {}, async () => {
      const changelogPath = path.join(this.projectRoot, "CHANGELOG.md");
      const existing = (await this.fs.exists(changelogPath)) ? await this.fs.readFile(changelogPath) : undefined;
      const latestDate = existing !== undefined ? latestChangelogDate(existing) : undefined;
      const commits = await this.git.recentCommits(latestDate);
      const entries = commits.length > 0 ? groupCommits(commits) : await this.entriesFromTelemetry(latestDate);

      if (entries.size === 0) {
        if (existing !== undefined) {
          await this.workflow.updateStep("run-changelog-skill", {
            status: "complete",
            evidence: [changelogPath]
          });
        }
        return { result: { path: changelogPath, changed: false }, outputs: { changed: false } };
      }

      const rendered = renderChangelog(entries);
      const content = existing === undefined
        ? `# Changelog\n\n${rendered}`
        : existing.replace(/^# Changelog\s*/i, "# Changelog\n\n").replace("# Changelog\n\n", `# Changelog\n\n${rendered}`);

      await this.fs.writeFile(changelogPath, content.endsWith("\n") ? content : `${content}\n`);
      await this.workflow.updateStep("run-changelog-skill", {
        status: "complete",
        evidence: [changelogPath]
      });
      return { result: { path: changelogPath, changed: true }, outputs: { changed: true } };
    });
  }

  private async entriesFromTelemetry(latestDate: string | undefined): Promise<Map<string, string[]>> {
    const telemetryPath = path.join(this.projectRoot, ".sdd", "telemetry.jsonl");
    const entries = new Map<string, string[]>();
    if (!(await this.fs.exists(telemetryPath))) {
      return entries;
    }

    const content = await this.fs.readFile(telemetryPath);
    for (const line of content.split(/\r?\n/).filter(Boolean)) {
      const event = JSON.parse(line) as { readonly command?: string; readonly endedAt?: string; readonly status?: string };
      if (event.status !== "succeeded" || event.endedAt === undefined || event.command === undefined) {
        continue;
      }
      const date = event.endedAt.slice(0, 10);
      if (latestDate !== undefined && date <= latestDate) {
        continue;
      }
      const list = entries.get(date) ?? [];
      const summary = `Run ${event.command}`;
      if (!list.includes(summary)) {
        list.push(summary);
      }
      entries.set(date, list);
    }

    return entries;
  }
}

function latestChangelogDate(content: string): string | undefined {
  return /^##\s+(\d{4}-\d{2}-\d{2})/m.exec(content)?.[1];
}

function groupCommits(commits: readonly { readonly date: string; readonly subject: string }[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const commit of commits) {
    const list = grouped.get(commit.date) ?? [];
    list.push(commit.subject);
    grouped.set(commit.date, list);
  }
  return grouped;
}

function renderChangelog(entries: Map<string, string[]>): string {
  return Array.from(entries.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, subjects]) => `## ${date}

${subjects.map((subject) => `- ${subject}`).join("\n")}

`)
    .join("");
}
