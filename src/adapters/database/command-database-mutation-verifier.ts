import path from "node:path";
import { DatabaseMutationVerifierPort, FileSystemPort } from "../../application/ports";
import { renderCommandTemplate } from "../commands/command-utils";
import { CommandExecutionError, executeCommand, writeCommandEvidence } from "../commands/command-executor";

interface DatabaseMutationVerifierConfig {
  readonly commandTemplate?: string;
  readonly timeoutMs?: number;
}

export class CommandDatabaseMutationVerifier implements DatabaseMutationVerifierPort {
  public constructor(private readonly fs: FileSystemPort) {}

  public async verifyExpectedMutations(input: {
    readonly projectRoot: string;
    readonly originalDatabasePath?: string;
    readonly testDatabasePath: string;
    readonly expectedMutations: readonly string[];
  }): Promise<{
    readonly configured: boolean;
    readonly passed: boolean;
    readonly message: string;
    readonly evidencePath?: string;
    readonly evidencePaths?: readonly string[];
  }> {
    const config = await this.readConfig(input.projectRoot);
    if (config.commandTemplate === undefined || config.commandTemplate.trim().length === 0) {
      return {
        configured: false,
        passed: true,
        message: "No database mutation verifier configured."
      };
    }

    const evidenceRoot = path.join(input.projectRoot, ".sdd", "evidence");
    const expectedMutationsFile = path.join(evidenceRoot, `${Date.now()}-expected-db-mutations.json`);
    await this.fs.writeFile(expectedMutationsFile, `${JSON.stringify({ mutations: input.expectedMutations }, null, 2)}\n`);

    const command = renderCommandTemplate(config.commandTemplate, {
      expectedMutationsFile,
      originalDatabase: input.originalDatabasePath ?? "",
      testDatabase: input.testDatabasePath,
      projectRoot: input.projectRoot
    });
    const env = {
      SDD_ORIGINAL_DATABASE: input.originalDatabasePath ?? "",
      SDD_TEST_DATABASE: input.testDatabasePath,
      SDD_EXPECTED_MUTATIONS_FILE: expectedMutationsFile
    };

    try {
      const result = await executeCommand(command, {
        cwd: input.projectRoot,
        timeoutMs: config.timeoutMs ?? 600000,
        env
      });
      const evidencePath = await this.writeEvidence(input.projectRoot, command, expectedMutationsFile, result.stdout, result.stderr);
      return {
        configured: true,
        passed: true,
        message: result.stdout.trim() || "Expected database mutations verified.",
        evidencePath,
        evidencePaths: [expectedMutationsFile, evidencePath]
      };
    } catch (error) {
      const execError = error as CommandExecutionError;
      const stdout = execError.stdout ?? "";
      const stderr = execError.stderr ?? "";
      const evidencePath = await this.writeEvidence(input.projectRoot, command, expectedMutationsFile, stdout, stderr || (execError.message ?? ""));
      return {
        configured: true,
        passed: false,
        message: stderr || stdout || execError.message || `Database mutation verifier failed with exit code ${execError.code ?? 1}.`,
        evidencePath,
        evidencePaths: [expectedMutationsFile, evidencePath]
      };
    }
  }

  private async readConfig(projectRoot: string): Promise<DatabaseMutationVerifierConfig> {
    const configPath = path.join(projectRoot, ".sdd", "database-mutation-verifier.json");
    if (!(await this.fs.exists(configPath))) {
      return {};
    }
    return JSON.parse(await this.fs.readFile(configPath)) as DatabaseMutationVerifierConfig;
  }

  private async writeEvidence(
    projectRoot: string,
    command: string,
    expectedMutationsFile: string,
    stdout: string,
    stderr: string
  ): Promise<string> {
    return writeCommandEvidence({
      fs: this.fs,
      projectRoot,
      label: "database-mutation-verifier",
      command,
      stdout,
      stderr,
      extraSections: [{ title: "expected mutations", body: expectedMutationsFile }]
    });
  }
}
