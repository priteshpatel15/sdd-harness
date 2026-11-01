import path from "node:path";
import { DocsLookupPort, FileSystemPort } from "../../application/ports";

interface DocsLookupConfig {
  readonly docs?: readonly { readonly title: string; readonly url: string; readonly summary: string; readonly tags?: readonly string[] }[];
}

export class ConfigDocsLookup implements DocsLookupPort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string
  ) {}

  public async findRelevantDocs(query: string): Promise<readonly { readonly title: string; readonly url: string; readonly summary: string }[]> {
    const config = await this.readConfig();
    const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2);
    return (config.docs ?? [])
      .filter((doc) => {
        const haystack = `${doc.title} ${doc.summary} ${(doc.tags ?? []).join(" ")}`.toLowerCase();
        return terms.length === 0 || terms.some((term) => haystack.includes(term));
      })
      .map((doc) => ({ title: doc.title, url: doc.url, summary: doc.summary }));
  }

  private async readConfig(): Promise<DocsLookupConfig> {
    const configPath = path.join(this.projectRoot, ".sdd", "docs-lookup.json");
    if (!(await this.fs.exists(configPath))) {
      return {};
    }
    const parsed = JSON.parse(await this.fs.readFile(configPath)) as DocsLookupConfig;
    if (parsed.docs !== undefined && (!Array.isArray(parsed.docs) || !parsed.docs.every(isDocEntry))) {
      throw new Error("docs must be an array of {title,url,summary,tags?} entries.");
    }
    return parsed;
  }
}

function isDocEntry(value: unknown): value is { readonly title: string; readonly url: string; readonly summary: string; readonly tags?: readonly string[] } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.title === "string"
    && typeof record.url === "string"
    && typeof record.summary === "string"
    && (record.tags === undefined || (Array.isArray(record.tags) && record.tags.every((item) => typeof item === "string")));
}
