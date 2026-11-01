import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { GitPort } from "../../application/ports";

const execFileAsync = promisify(execFile);

export class ChildProcessGit implements GitPort {
  public constructor(private readonly projectRoot: string) {}

  public async isRepository(): Promise<boolean> {
    const result = await this.safeGit(["rev-parse", "--is-inside-work-tree"]);
    return result.exitCode === 0 && result.stdout.trim() === "true";
  }

  public async currentBranch(): Promise<string | undefined> {
    const result = await this.safeGit(["branch", "--show-current"]);
    return result.exitCode === 0 ? result.stdout.trim() || undefined : undefined;
  }

  public async hasUncommittedChanges(): Promise<boolean> {
    const result = await this.safeGit(["status", "--porcelain"]);
    return result.exitCode === 0 && result.stdout.trim().length > 0;
  }

  public async changedFiles(): Promise<readonly string[]> {
    const result = await this.safeGit(["status", "--porcelain"]);
    if (result.exitCode !== 0 || result.stdout.trim().length === 0) {
      return [];
    }
    return result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^..\s+/, "").replace(/^.* -> /, ""))
      .filter((file) => file.length > 0);
  }

  public async diff(): Promise<string | undefined> {
    const result = await this.safeGit(["diff", "--"]);
    if (result.exitCode !== 0 || result.stdout.trim().length === 0) {
      return undefined;
    }
    return result.stdout;
  }

  public async createBranch(branchName: string): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }> {
    return this.safeGit(["switch", "-c", branchName]);
  }

  public async recentCommits(sinceIsoDate?: string): Promise<readonly { readonly date: string; readonly subject: string }[]> {
    const args = ["log", "--date=short", "--pretty=format:%ad%x09%s"];
    if (sinceIsoDate !== undefined) {
      args.splice(1, 0, `--since=${sinceIsoDate}`);
    }

    const result = await this.safeGit(args);
    if (result.exitCode !== 0 || result.stdout.trim().length === 0) {
      return [];
    }

    return result.stdout
      .split(/\r?\n/)
      .map((line) => {
        const [date, ...subjectParts] = line.split("\t");
        return { date: date ?? "unknown", subject: subjectParts.join("\t").trim() };
      })
      .filter((commit) => commit.subject.length > 0);
  }

  private async safeGit(args: readonly string[]): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }> {
    try {
      const result = await execFileAsync("git", args, { cwd: this.projectRoot });
      return { exitCode: 0, stdout: result.stdout, stderr: result.stderr };
    } catch (error) {
      const execError = error as { readonly code?: number; readonly stdout?: string; readonly stderr?: string };
      return {
        exitCode: typeof execError.code === "number" ? execError.code : 1,
        stdout: execError.stdout ?? "",
        stderr: execError.stderr ?? ""
      };
    }
  }
}
