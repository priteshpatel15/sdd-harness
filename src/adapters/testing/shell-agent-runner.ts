import { exec } from "node:child_process";
import { promisify } from "node:util";
import { AgentRunnerPort } from "../../application/ports";

const execAsync = promisify(exec);

export class ShellAgentRunner implements AgentRunnerPort {
  public async run(input: { readonly command: string; readonly cwd: string }): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }> {
    try {
      const result = await execAsync(input.command, { cwd: input.cwd, maxBuffer: 10 * 1024 * 1024 });
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
