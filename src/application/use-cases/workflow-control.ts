import path from "node:path";
import { BranchActionRecord, CheckpointRecord, WorkflowStepId } from "../../domain/models";
import { nextWorkflowStep } from "../../domain/workflow";
import { ClockPort, DocsLookupPort, FileSystemPort, GitPort, IssueTrackerPort, TelemetrySink, WorkflowStatePort } from "../ports";
import { GateError, ValidationError } from "../../domain/errors";
import { traceUseCase } from "./common";
import { slugify } from "../../domain/slug";
import { validationCommandResolvesToPlaywright, validationCommandsFromPackage } from "../../domain/spec-validation";
import { evaluateArchitecturePolicy } from "../architecture-policy";

export class WorkflowStatusUseCase {
  public constructor(
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(): Promise<ReturnType<typeof formatWorkflowStatus>> {
    return traceUseCase(this.telemetry, this.clock, "workflow status", {}, async () => {
      const state = await this.workflow.read();
      const result = formatWorkflowStatus(state);
      return { result, outputs: { nextCommand: result.nextCommand } };
    });
  }
}

export class WorkflowNextUseCase {
  public constructor(
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(): Promise<{ readonly step?: string; readonly command?: string; readonly status: string }> {
    return traceUseCase(this.telemetry, this.clock, "workflow next", {}, async () => {
      const state = await this.workflow.read();
      const next = nextWorkflowStep(state);
      const result = {
        step: next === undefined ? undefined : `${next.number}. ${next.title}`,
        command: next?.command,
        status: next === undefined ? "complete" : next.status
      };
      return { result, outputs: result };
    });
  }
}

export class WorkflowDoctorUseCase {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort,
    private readonly docsLookup?: DocsLookupPort,
    private readonly issueTracker?: IssueTrackerPort
  ) {}

  public async execute(input: { readonly strict?: boolean } = {}): Promise<{ readonly healthy: boolean; readonly lines: readonly string[] }> {
    return traceUseCase(this.telemetry, this.clock, "workflow doctor", input, async () => {
      const packageJson = await this.readPackageJson();
      const scripts = packageJson?.scripts ?? {};
      const dependencies = { ...(packageJson?.dependencies ?? {}), ...(packageJson?.devDependencies ?? {}) };
      const validationCommands = validationCommandsFromPackage({ scripts });
      const hasPlaywrightValidationCommand = validationCommands.some((command) => validationCommandResolvesToPlaywright(command, scripts));
      const userQuestionReadiness = await this.fileReadiness(".sdd/user-question-adapter.json", "persisted --questions evidence remains the default path.", "Configure .sdd/user-question-adapter.json for live grouped question capture.");
      const docsReadiness = await this.docsLookupReadiness();
      const issueReadiness = await this.issueTrackerReadiness();
      const checks = [
        check("typecheck script", scripts.typecheck !== undefined, "Add a package.json typecheck script."),
        check("test script", scripts.test !== undefined, "Add a package.json test script."),
        check("build script", scripts.build !== undefined, "Add a package.json build script."),
        check("Playwright validation command", hasPlaywrightValidationCommand, "Add test:e2e or another validation script that invokes playwright test for UI features."),
        check("Playwright dependency", dependencies["@playwright/test"] !== undefined, "Install @playwright/test for UI workflow validation."),
        check("review agents", await this.existsAny([".sdd/review-agents.json", ".sdd/agents.json"]), "Configure .sdd/review-agents.json or sdd agent configure."),
        check("semantic verifiers", await this.existsAny([".sdd/semantic-verifiers.json", ".sdd/agents.json"]), "Configure .sdd/semantic-verifiers.json or sdd agent configure."),
        check("database sandbox path", true, "Use --test-database and optionally --test-database-env for data-changing UI features.")
      ];
      const strictChecks = [
        check("user-question adapter", userQuestionReadiness.passed, userQuestionReadiness.strictFix),
        check("database mutation verifier", await this.existsAny([".sdd/database-mutation-verifier.json"]), "Configure .sdd/database-mutation-verifier.json for expected DB mutation assertions."),
        check("docs lookup adapter", docsReadiness.passed, docsReadiness.strictFix),
        check("issue tracker adapter", issueReadiness.passed, issueReadiness.strictFix),
        check("architecture policy", await this.architecturePolicyHealthy(), "Fix Clean Architecture boundary or side-effect violations under src/domain, src/application, or src/adapters.")
      ];
      const effectiveChecks = input.strict === true ? [...checks, ...strictChecks] : checks;
      const lines = [
        ...effectiveChecks.map((item) => `${item.passed ? "OK" : "MISSING"} ${item.name}: ${item.passed ? "ready" : item.fix}`),
        ...(input.strict === true ? [] : [userQuestionReadiness, docsReadiness, issueReadiness].map((item) => `${item.passed ? "OK" : item.configured ? "INVALID" : "OPTIONAL"} ${item.name}: ${item.passed ? "configured" : item.normalFix}`))
      ];
      return {
        result: { healthy: effectiveChecks.every((item) => item.passed), lines },
        outputs: { healthy: effectiveChecks.every((item) => item.passed), strict: input.strict === true }
      };
    });
  }

  private async readPackageJson(): Promise<{ readonly scripts?: Record<string, string>; readonly dependencies?: Record<string, string>; readonly devDependencies?: Record<string, string> } | undefined> {
    const packagePath = path.join(this.projectRoot, "package.json");
    return (await this.fs.exists(packagePath)) ? JSON.parse(await this.fs.readFile(packagePath)) as { readonly scripts?: Record<string, string>; readonly dependencies?: Record<string, string>; readonly devDependencies?: Record<string, string> } : undefined;
  }

  private async existsAny(files: readonly string[]): Promise<boolean> {
    for (const file of files) {
      if (await this.fs.exists(path.join(this.projectRoot, file))) {
        return true;
      }
    }
    return false;
  }

  private async architecturePolicyHealthy(): Promise<boolean> {
    return (await evaluateArchitecturePolicy(this.fs, this.projectRoot)).every((finding) => finding.severity !== "blocking");
  }

  private async fileReadiness(file: string, normalMissing: string, strictMissing: string): Promise<AdapterReadiness> {
    const configured = await this.fs.exists(path.join(this.projectRoot, file));
    return {
      name: file.includes("user-question") ? "user-question adapter" : file,
      configured,
      passed: configured,
      normalFix: configured ? "configured" : `optional; ${normalMissing}`,
      strictFix: configured ? "ready" : strictMissing
    };
  }

  private async docsLookupReadiness(): Promise<AdapterReadiness> {
    const configured = await this.fs.exists(path.join(this.projectRoot, ".sdd", "docs-lookup.json"));
    if (!configured || this.docsLookup === undefined) {
      return {
        name: "docs lookup adapter",
        configured,
        passed: false,
        normalFix: "optional; no live docs lookup adapter configured.",
        strictFix: "Configure .sdd/docs-lookup.json for strict docs lookup readiness."
      };
    }
    try {
      const docs = await this.docsLookup.findRelevantDocs("");
      return {
        name: "docs lookup adapter",
        configured: true,
        passed: docs.length > 0,
        normalFix: docs.length > 0 ? "configured" : "configured but no docs entries were returned.",
        strictFix: docs.length > 0 ? "ready" : "Configure at least one docs entry in .sdd/docs-lookup.json."
      };
    } catch (error) {
      return {
        name: "docs lookup adapter",
        configured: true,
        passed: false,
        normalFix: `configured but invalid: ${errorMessage(error)}`,
        strictFix: `Fix .sdd/docs-lookup.json: ${errorMessage(error)}`
      };
    }
  }

  private async issueTrackerReadiness(): Promise<AdapterReadiness> {
    const configured = await this.fs.exists(path.join(this.projectRoot, ".sdd", "issue-tracker.json"));
    if (!configured || this.issueTracker === undefined) {
      return {
        name: "issue tracker adapter",
        configured,
        passed: false,
        normalFix: "optional; no live issue tracker adapter configured.",
        strictFix: "Configure .sdd/issue-tracker.json for strict issue tracker readiness."
      };
    }
    try {
      await this.issueTracker.listOpenItems(this.projectRoot);
      return {
        name: "issue tracker adapter",
        configured: true,
        passed: true,
        normalFix: "configured",
        strictFix: "ready"
      };
    } catch (error) {
      return {
        name: "issue tracker adapter",
        configured: true,
        passed: false,
        normalFix: `configured but invalid: ${errorMessage(error)}`,
        strictFix: `Fix .sdd/issue-tracker.json: ${errorMessage(error)}`
      };
    }
  }
}

export class WorkflowCheckpointUseCase {
  public constructor(
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly stepId: WorkflowStepId;
    readonly kind: CheckpointRecord["kind"];
    readonly notes: string;
    readonly featureId?: string;
  }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "workflow checkpoint", input, async () => {
      if (input.notes.trim().length === 0) {
        throw new ValidationError("Checkpoint requires --notes.");
      }
      const record: CheckpointRecord = {
        id: `checkpoint-${this.clock.now().toISOString()}`,
        stepId: input.stepId,
        kind: input.kind,
        notes: input.notes,
        featureId: input.featureId,
        createdAt: this.clock.now().toISOString()
      };
      const path = await this.workflow.appendCheckpoint(record);
      await this.workflow.updateStep(input.stepId, {
        status: "complete",
        featureId: input.featureId,
        evidence: [path]
      });
      return { result: { path }, outputs: { path } };
    });
  }
}

export class WorkflowBranchUseCase {
  public constructor(
    private readonly workflow: WorkflowStatePort,
    private readonly git: GitPort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: {
    readonly purpose: BranchActionRecord["purpose"];
    readonly name: string;
    readonly featureId?: string;
    readonly allowDirty?: boolean;
  }): Promise<{ readonly branch: string }> {
    return traceUseCase(this.telemetry, this.clock, "workflow branch", input, async () => {
      if (!(await this.git.isRepository())) {
        throw new GateError("Hard gate: workflow branch creation requires a git repository.");
      }
      if (input.allowDirty !== true && await this.git.hasUncommittedChanges()) {
        throw new GateError("Hard gate: working tree has uncommitted changes. Commit, stash, or pass --allow-dirty.");
      }
      const branch = `${input.purpose}/${slugify(input.name)}`;
      const result = await this.git.createBranch(branch);
      if (result.exitCode !== 0) {
        throw new GateError(`Git branch creation failed: ${result.stderr || result.stdout}`);
      }
      const record: BranchActionRecord = {
        id: `branch-${this.clock.now().toISOString()}`,
        branch,
        name: input.name,
        purpose: input.purpose,
        featureId: input.featureId,
        createdAt: this.clock.now().toISOString()
      };
      const path = await this.workflow.appendBranchAction(record);
      await this.workflow.updateStep(stepForBranchPurpose(input.purpose), {
        status: "in_progress",
        branch,
        featureId: input.featureId,
        evidence: [path]
      });
      return { result: { branch }, outputs: { branch } };
    });
  }
}

function stepForBranchPurpose(purpose: BranchActionRecord["purpose"]): WorkflowStepId {
  if (purpose === "constitution") return "create-constitution";
  if (purpose === "feature") return "create-feature-spec";
  if (purpose === "replan") return "replanning";
  if (purpose === "mvp") return "mvp-spec-branch";
  return "create-auto-workflow-with-skills";
}

function check(name: string, passed: boolean, fix: string): { readonly name: string; readonly passed: boolean; readonly fix: string } {
  return { name, passed, fix };
}

interface AdapterReadiness {
  readonly name: string;
  readonly configured: boolean;
  readonly passed: boolean;
  readonly normalFix: string;
  readonly strictFix: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatWorkflowStatus(state: Awaited<ReturnType<WorkflowStatePort["read"]>>): {
  readonly lines: readonly string[];
  readonly nextCommand?: string;
} {
  const sorted = Object.values(state.steps).sort((left, right) => left.number - right.number);
  const next = nextWorkflowStep(state);
  return {
    lines: sorted.map((step) => {
      const number = step.number === 0 ? "B" : String(step.number).padStart(2, "0");
      const blockers = step.blockers.length > 0 ? ` blockers=${step.blockers.length}` : "";
      const command = step.command !== undefined ? ` command="${step.command}"` : "";
      return `${number}. ${step.title}: ${step.status} (${step.automationLevel})${command}${blockers}`;
    }),
    nextCommand: next?.command
  };
}
