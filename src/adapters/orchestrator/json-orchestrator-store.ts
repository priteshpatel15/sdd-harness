import path from "node:path";
import { FileSystemPort, OrchestratorStorePort } from "../../application/ports";
import { ValidationError } from "../../domain/errors";
import { OrchestratorConfig, OrchestratorRunState, OrchestratorStepPolicy, parseOrchestratorConfig, parseOrchestratorRunState, updateOrchestratorStepPolicy, validateOrchestratorConfig } from "../../domain/orchestrator";
import { WorkflowStepId } from "../../domain/models";

export class JsonOrchestratorStore implements OrchestratorStorePort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string
  ) {}

  public async readConfig(): Promise<OrchestratorConfig | undefined> {
    const filePath = this.configPath();
    if (!(await this.fs.exists(filePath))) {
      return undefined;
    }
    return parseJsonFile(await this.fs.readFile(filePath), "orchestrator config", parseOrchestratorConfig);
  }

  public async writeConfig(config: OrchestratorConfig): Promise<string> {
    validateOrchestratorConfig(config);
    const filePath = this.configPath();
    await this.fs.writeFile(filePath, `${JSON.stringify(config, null, 2)}\n`);
    return filePath;
  }

  public async updateStepPolicy(stepId: WorkflowStepId, policy: OrchestratorStepPolicy): Promise<{ readonly config: OrchestratorConfig; readonly path: string }> {
    const current = await this.readConfig();
    if (current === undefined) {
      throw new Error("Orchestrator config does not exist.");
    }
    const config = updateOrchestratorStepPolicy(current, stepId, policy);
    const path = await this.writeConfig(config);
    return { config, path };
  }

  public async readState(): Promise<OrchestratorRunState | undefined> {
    const filePath = this.statePath();
    if (!(await this.fs.exists(filePath))) {
      return undefined;
    }
    return parseJsonFile(await this.fs.readFile(filePath), "orchestrator state", parseOrchestratorRunState);
  }

  public async writeState(state: OrchestratorRunState): Promise<string> {
    parseOrchestratorRunState(state);
    const filePath = this.statePath();
    await this.fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`);
    return filePath;
  }

  private configPath(): string {
    return path.join(this.projectRoot, ".sdd", "orchestrator.json");
  }

  private statePath(): string {
    return path.join(this.projectRoot, ".sdd", "orchestrator-state.json");
  }
}

function parseJsonFile<T>(content: string, label: string, parse: (value: unknown) => T): T {
  try {
    return parse(JSON.parse(content));
  } catch (error) {
    throw new ValidationError(`Invalid ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
