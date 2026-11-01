import path from "node:path";
import { FileSystemPort, IssueTrackerPort } from "../../application/ports";

interface IssueTrackerConfig {
  readonly items?: readonly { readonly id: string; readonly title: string; readonly url?: string; readonly status?: string }[];
}

export class ConfigIssueTracker implements IssueTrackerPort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string
  ) {}

  public async listOpenItems(_projectRoot?: string): Promise<readonly { readonly id: string; readonly title: string; readonly url?: string }[]> {
    const config = await this.readConfig();
    return (config.items ?? [])
      .filter((item) => item.status === undefined || !/^(done|closed|resolved)$/i.test(item.status))
      .map((item) => ({ id: item.id, title: item.title, url: item.url }));
  }

  private async readConfig(): Promise<IssueTrackerConfig> {
    const configPath = path.join(this.projectRoot, ".sdd", "issue-tracker.json");
    if (!(await this.fs.exists(configPath))) {
      return {};
    }
    const parsed = JSON.parse(await this.fs.readFile(configPath)) as IssueTrackerConfig;
    if (parsed.items !== undefined && (!Array.isArray(parsed.items) || !parsed.items.every(isIssueItem))) {
      throw new Error("items must be an array of {id,title,url?,status?} entries.");
    }
    return parsed;
  }
}

function isIssueItem(value: unknown): value is { readonly id: string; readonly title: string; readonly url?: string; readonly status?: string } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string"
    && typeof record.title === "string"
    && (record.url === undefined || typeof record.url === "string")
    && (record.status === undefined || typeof record.status === "string");
}
