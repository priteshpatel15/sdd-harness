import { FileSystemPort, TestRunnerPort, ValidationCommandOptions, ValidationCommandResult } from "../../application/ports";
import { CommandExecutionError, executeCommand, writeCommandEvidence } from "../commands/command-executor";

export class CommandTestRunner implements TestRunnerPort {
  public constructor(private readonly fs: FileSystemPort) {}

  public async runCommand(
    command: string,
    cwd: string,
    options?: ValidationCommandOptions
  ): Promise<ValidationCommandResult> {
    let exitCode = 0;
    let stdout = "";
    let stderr = "";

    try {
      const result = await executeCommand(command, { cwd, env: options?.env });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      const execError = error as CommandExecutionError;
      exitCode = typeof execError.code === "number" ? execError.code : 1;
      stdout = execError.stdout ?? "";
      stderr = execError.stderr ?? "";
    }

    const evidencePath = await writeCommandEvidence({
      fs: this.fs,
      projectRoot: cwd,
      label: command,
      command,
      stdout,
      stderr
    });

    return { command, exitCode, stdout, stderr, evidencePath };
  }
}
