import path from "node:path";
import { DatabaseSandboxPort, FileSystemPort } from "../../application/ports";
import { executeCommand, writeCommandEvidence } from "../commands/command-executor";

interface CommandDatabaseSandboxConfig {
  readonly prepareCommand: string;
  readonly databaseUrlEnv?: string;
  readonly cleanupCommand?: string;
}

export class FileDatabaseSandbox implements DatabaseSandboxPort {
  public constructor(private readonly fs: FileSystemPort) {}

  public async createTestCopy(input: { readonly projectRoot: string; readonly databasePath: string; readonly envKey?: string }): Promise<{ readonly copyPath: string; readonly env: Record<string, string>; readonly evidencePath?: string }> {
    const sourcePath = path.isAbsolute(input.databasePath)
      ? input.databasePath
      : path.join(input.projectRoot, input.databasePath);
    const copyPath = path.join(input.projectRoot, ".sdd", "test-db", `${path.basename(input.databasePath)}.copy`);
    await this.fs.copyFile(sourcePath, copyPath);
    return {
      copyPath,
      env: {
        [input.envKey ?? "DATABASE_URL"]: copyPath,
        SDD_TEST_DATABASE: copyPath
      }
    };
  }

  public async createConfiguredSandbox(input: { readonly projectRoot: string }): Promise<{ readonly label: string; readonly env: Record<string, string>; readonly evidencePath: string } | undefined> {
    const config = await this.readConfig(input.projectRoot);
    if (config === undefined) {
      return undefined;
    }
    const result = await executeCommand(config.prepareCommand, { cwd: input.projectRoot });
    const databaseUrl = lastNonEmptyLine(result.stdout);
    if (databaseUrl === undefined) {
      throw new Error(".sdd/database-sandbox.json prepareCommand must print the sandbox database URL/path on stdout.");
    }
    const evidencePath = await this.writeCommandEvidence(input.projectRoot, "prepare-database-sandbox", config.prepareCommand, result.stdout, result.stderr);
    const envKey = config.databaseUrlEnv ?? "DATABASE_URL";
    return {
      label: databaseUrl,
      evidencePath,
      env: {
        [envKey]: databaseUrl,
        SDD_TEST_DATABASE: databaseUrl
      }
    };
  }

  public async cleanupConfiguredSandbox(input: { readonly projectRoot: string }): Promise<{ readonly evidencePath?: string } | undefined> {
    const config = await this.readConfig(input.projectRoot);
    if (config?.cleanupCommand === undefined || config.cleanupCommand.trim().length === 0) {
      return undefined;
    }
    const result = await executeCommand(config.cleanupCommand, { cwd: input.projectRoot });
    return {
      evidencePath: await this.writeCommandEvidence(input.projectRoot, "cleanup-database-sandbox", config.cleanupCommand, result.stdout, result.stderr)
    };
  }

  private async readConfig(projectRoot: string): Promise<CommandDatabaseSandboxConfig | undefined> {
    const configPath = path.join(projectRoot, ".sdd", "database-sandbox.json");
    if (!(await this.fs.exists(configPath))) {
      return undefined;
    }
    return JSON.parse(await this.fs.readFile(configPath)) as CommandDatabaseSandboxConfig;
  }

  private async writeCommandEvidence(projectRoot: string, label: string, command: string, stdout: string, stderr: string): Promise<string> {
    return writeCommandEvidence({
      fs: this.fs,
      projectRoot,
      label,
      command,
      stdout,
      stderr
    });
  }
}

function lastNonEmptyLine(value: string): string | undefined {
  return value.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0).at(-1);
}
