import { AgentRunnerPort, ClockPort, FileSystemPort, GitPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { requireCurrentFeatureApproval, requireFeatureStatus, traceUseCase } from "./common";

export class ImplementTaskGroupUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly agentRunner: AgentRunnerPort,
    private readonly git: GitPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly featureId: string;
    readonly taskGroup?: string;
    readonly agentCommand?: string;
    readonly execute?: boolean;
  }): Promise<{ readonly packetPath?: string; readonly exitCode?: number }> {
    return traceUseCase<{ readonly packetPath?: string; readonly exitCode?: number }>(this.telemetry, this.clock, "feature implement", input, async () => {
      await requireFeatureStatus(this.store, input.featureId, ["approved", "implemented"], "implementation");
      await requireCurrentFeatureApproval(this.store, this.workflow, this.fs, this.projectRoot, input.featureId);
      const files = await this.store.readFeatureFiles(input.featureId);

      const packet = `# Implementation Packet

Feature: ${input.featureId}
Task group: ${input.taskGroup ?? "remaining task groups"}

## Required Inputs

Read and follow:

- \`requirements.md\`
- \`plan.md\`
- \`validation.md\`
- \`specs/mission.md\`
- \`specs/tech-stack.md\`

## Hard Gates

- Implement tests before or with production code.
- Do not mark tasks complete without validation evidence.
- Add Playwright workflow coverage for UI work.
- Use an isolated test database copy for data-changing UI workflows.
- Emit telemetry and evidence under \`.sdd/\`.

## Current Spec

${files.rawText}
`;

      const packetPath = await this.store.writeImplementationPacket(input.featureId, packet);
      await this.workflow.updateStep("implement-feature", {
        status: "in_progress",
        featureId: input.featureId,
        evidence: [packetPath]
      });
      await this.workflow.updateStep("feature-validation", { status: "ready", featureId: input.featureId });
      if (input.execute === true && input.agentCommand !== undefined) {
        const beforeChangedFiles = await this.gitSnapshot();
        const result = await this.agentRunner.run({ command: input.agentCommand, cwd: this.projectRoot });
        const afterChangedFiles = await this.gitSnapshot();
        const evidencePath = `${packetPath}.execution.log`;
        await this.fs.writeFile(evidencePath, `$ ${input.agentCommand}

# changed files before
${beforeChangedFiles.changedFiles.join("\n") || beforeChangedFiles.note}

# changed files after
${afterChangedFiles.changedFiles.join("\n") || afterChangedFiles.note}

# diff
${afterChangedFiles.diff ?? "No git diff available."}

# stdout
${result.stdout}

# stderr
${result.stderr}
`);
        if (result.exitCode === 0) {
          await this.store.updateFeatureStatus(input.featureId, "implemented");
          await this.workflow.updateStep("implement-feature", {
            status: "in_progress",
            featureId: input.featureId,
            evidence: [packetPath, evidencePath]
          });
        }
        return { result: { packetPath, exitCode: result.exitCode }, evidence: [{ id: `implementation-${this.clock.now().toISOString()}`, kind: "command" as const, path: evidencePath, summary: `Implementation command ${result.exitCode === 0 ? "passed" : "failed"}.`, passed: result.exitCode === 0, createdAt: this.clock.now().toISOString() }], outputs: { packetPath, evidencePath, exitCode: result.exitCode } };
      }

      return { result: { packetPath }, outputs: { packetPath, dryRun: true } };
    });
  }

  private async gitSnapshot(): Promise<{ readonly changedFiles: readonly string[]; readonly diff?: string; readonly note: string }> {
    if (!(await this.git.isRepository())) {
      return {
        changedFiles: [],
        note: "No git repository detected."
      };
    }
    return {
      changedFiles: await this.git.changedFiles(),
      diff: await this.git.diff(),
      note: "No changed files reported by git status."
    };
  }
}
