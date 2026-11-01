import path from "node:path";
import { createHash } from "node:crypto";
import {
  BrowserQAPort,
  ClockPort,
  DatabaseMutationVerifierPort,
  DatabaseSandboxPort,
  FileSystemPort,
  SpecStorePort,
  TelemetrySink,
  TestRunnerPort,
  ValidationCommandResult,
  WorkflowStatePort
} from "../ports";
import { Evidence, QualityGate, ValidationSummary } from "../../domain/models";
import { canRunFeatureValidation } from "../../domain/feature-status";
import { detectDataMutationWork, detectDatabaseWork, experienceHasDatabaseMutations, featureTextRequiresExperience, validationCommandResolvesToPlaywright, validationCommandsFromPackage } from "../../domain/spec-validation";
import { ValidationError } from "../../domain/errors";
import { assertValidationPasses, requireCurrentFeatureApproval, requireExistingEvidencePaths, requireFeatureStatus, traceUseCase } from "./common";

export class RunValidationUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly testRunner: TestRunnerPort,
    private readonly browserQa: BrowserQAPort,
    private readonly databaseSandbox: DatabaseSandboxPort,
    private readonly databaseMutationVerifier: DatabaseMutationVerifierPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly featureId?: string; readonly commands?: readonly string[]; readonly testDatabase?: string; readonly testDatabaseEnv?: string; readonly strictPlaywright?: boolean; readonly compatPlaywright?: boolean }): Promise<{ readonly passed: boolean; readonly evidence: readonly Evidence[] }> {
    return traceUseCase(this.telemetry, this.clock, "feature run-validation", input, async () => {
      if (input.strictPlaywright === true && input.compatPlaywright === true) {
        throw new ValidationError("Hard gate: --strict-playwright and --compat-playwright cannot be combined.");
      }
      const commands = input.commands ?? (await this.defaultCommands());
      if (commands.length === 0) {
        throw new ValidationError("Hard gate: validation requires at least one command. Add package scripts such as typecheck/test/build/test:e2e or pass --command.");
      }
      const evidence: Evidence[] = [];
      const gates: QualityGate[] = [];
      let uiCoverageEvidence: string | undefined;
      let testDatabaseCopy: string | undefined;
      const databaseSandboxEvidence: string[] = [];
      const commandResults: ValidationCommandResult[] = [];
      let commandEnv: Record<string, string> | undefined;
      let cleanupConfiguredSandbox = false;
      let uiWork = false;
      let dataChangingWork = false;
      let packageScripts: Record<string, string> = {};
      let originalDatabasePath: string | undefined;
      let originalDatabaseHashBefore: string | undefined;
      let testDatabaseHashBefore: string | undefined;
      let expectedDatabaseMutations: readonly string[] = [];
      let usedCommandBackedDatabaseSandbox = false;

      if (input.featureId !== undefined) {
        const metadata = await this.store.readMetadata();
        const feature = metadata.features[input.featureId];
        await requireFeatureStatus(this.store, input.featureId, ["implemented", "validated"], "validation");
        if (feature !== undefined && !canRunFeatureValidation(feature.status)) {
          throw new ValidationError(`Hard gate: feature '${input.featureId}' cannot run validation from status ${feature.status}.`);
        }
        await requireCurrentFeatureApproval(this.store, this.workflow, this.fs, this.projectRoot, input.featureId);

        const files = await this.store.readFeatureFiles(input.featureId);
        const userSpecText = extractUserAuthoredSpecText(files);
        const validationRelevantText = extractValidationRelevantSpecText(files);
        const experience = await this.store.readFeatureExperience(input.featureId);
        packageScripts = await this.packageScripts();
        uiWork = featureTextRequiresExperience(userSpecText, experience);
        expectedDatabaseMutations = await this.expectedDatabaseMutations(input.featureId, experience, validationRelevantText);
        dataChangingWork = expectedDatabaseMutations.length > 0
          || experienceHasDatabaseMutations(experience)
          || detectDataMutationWork(validationRelevantText)
          || (uiWork && experience === undefined && detectDatabaseWork(userSpecText));

        if (uiWork && !commands.some((command) => validationCommandResolvesToPlaywright(command, packageScripts))) {
          gates.push({
            id: "validation.ui.playwright-command",
            name: "Playwright validation command",
            severity: "blocking",
            passed: false,
            message: "UI validation requires a real Playwright command such as npx playwright test, playwright test, or npm run <script> where the package script invokes Playwright."
          });
        }

        if (dataChangingWork) {
          if (input.testDatabase !== undefined) {
            const result = await this.databaseSandbox.createTestCopy({
              projectRoot: this.projectRoot,
              databasePath: input.testDatabase,
              envKey: input.testDatabaseEnv
            });
            originalDatabasePath = path.resolve(this.projectRoot, input.testDatabase);
            originalDatabaseHashBefore = await hashFile(this.fs, originalDatabasePath);
            testDatabaseCopy = result.copyPath;
            testDatabaseHashBefore = await hashFile(this.fs, testDatabaseCopy);
            commandEnv = result.env;
            if (result.evidencePath !== undefined) {
              databaseSandboxEvidence.push(result.evidencePath);
            }
            gates.push({
              id: "validation.data.test-database",
              name: "Isolated test database copy",
              severity: "blocking",
              passed: true,
              message: `Isolated test database copy created and exposed through ${Object.keys(result.env).join(", ")}.`,
              evidencePath: result.copyPath
            });
          } else {
            const result = await this.databaseSandbox.createConfiguredSandbox({ projectRoot: this.projectRoot });
            if (result === undefined) {
              gates.push({
                id: "validation.data.test-database",
                name: "Isolated test database copy",
                severity: "blocking",
                passed: false,
                message: "Data-changing validation requires --test-database or .sdd/database-sandbox.json so validation uses an isolated copy."
              });
            } else {
              testDatabaseCopy = result.label;
              commandEnv = result.env;
              cleanupConfiguredSandbox = true;
              usedCommandBackedDatabaseSandbox = true;
              databaseSandboxEvidence.push(result.evidencePath);
              gates.push({
                id: "validation.data.test-database",
                name: "Isolated test database copy",
                severity: "blocking",
                passed: true,
                message: `Command-backed database sandbox created and exposed through ${Object.keys(result.env).join(", ")}.`,
                evidencePath: result.evidencePath
              });
            }
          }
        }
      }

      assertValidationPasses(gates);

      for (const command of commands) {
        const result = await this.testRunner.runCommand(command, this.projectRoot, { env: commandEnv });
        commandResults.push(result);
        const passed = result.exitCode === 0;
        gates.push({
          id: `validation.command.${command}`,
          name: `Validation command: ${command}`,
          severity: "blocking",
          passed,
          message: passed ? `${command} passed.` : `${command} failed with exit code ${result.exitCode}.`,
          evidencePath: result.evidencePath
        });
        evidence.push({
          id: `evidence-${evidence.length + 1}`,
          kind: "command",
          path: result.evidencePath,
          summary: `${command} ${passed ? "passed" : "failed"}.`,
          passed,
          createdAt: this.clock.now().toISOString()
        });
      }
      if (cleanupConfiguredSandbox) {
        const cleanup = await this.databaseSandbox.cleanupConfiguredSandbox({ projectRoot: this.projectRoot });
        if (cleanup?.evidencePath !== undefined) {
          databaseSandboxEvidence.push(cleanup.evidencePath);
        }
      }
      await requireExistingEvidencePaths(this.fs, this.projectRoot, evidence.map((item) => item.path ?? ""), "validation command evidence");

      if (input.featureId !== undefined) {
        const files = await this.store.readFeatureFiles(input.featureId);
        const userSpecText = extractUserAuthoredSpecText(files);
        const experience = await this.store.readFeatureExperience(input.featureId);
        if (featureTextRequiresExperience(userSpecText, experience)) {
          if (experience === undefined) {
            gates.push({
              id: "validation.ui.experience",
              name: "Experience workflow specification",
              severity: "blocking",
              passed: false,
              message: "UI validation requires specs/<feature>/experience.md with mapped experience flows."
            });
          } else {
            const experienceCoverage = await this.browserQa.validateExperienceCoverage({
              projectRoot: this.projectRoot,
              featureId: input.featureId,
              experienceMarkdown: experience
            });
            gates.push({
              id: "validation.ui.experience-coverage",
              name: "Experience flows mapped to Playwright",
              severity: "blocking",
              passed: experienceCoverage.passed,
              message: experienceCoverage.evidence,
              evidencePath: experienceCoverage.passed ? `specs/${input.featureId}/experience.md` : undefined
            });
            const inventoryCoverage = await this.browserQa.validateInventoryCoverage({
              projectRoot: this.projectRoot,
              featureId: input.featureId,
              experienceMarkdown: experience
            });
            gates.push({
              id: "validation.ui.inventory-coverage",
              name: "Discovered UI workflows represented in experience spec",
              severity: "blocking",
              passed: inventoryCoverage.passed,
              message: inventoryCoverage.evidence,
              evidencePath: inventoryCoverage.passed ? `specs/${input.featureId}/experience.md` : undefined
            });
            if (experienceCoverage.passed) {
              const executedCoverage = await this.browserQa.validateExecutedExperienceCoverage({
                projectRoot: this.projectRoot,
                featureId: input.featureId,
                experienceMarkdown: experience,
                commands: commandResults,
                packageScripts,
                strict: input.compatPlaywright !== true
              });
              gates.push({
                id: "validation.ui.executed-playwright-coverage",
                name: "Mapped Playwright tests executed",
                severity: "blocking",
                passed: executedCoverage.passed,
                message: executedCoverage.evidence,
                evidencePath: executedCoverage.passed ? `specs/${input.featureId}/experience.md` : undefined
              });
            }
          }
          const uiCoverage = await this.browserQa.hasWorkflowCoverage(this.projectRoot);
          uiCoverageEvidence = uiCoverage.evidence;
          gates.push({
            id: "validation.ui.playwright",
            name: "Playwright workflow coverage",
            severity: "blocking",
            passed: uiCoverage.passed,
            message: uiCoverage.passed ? "Playwright workflow coverage found." : uiCoverage.evidence,
            evidencePath: uiCoverage.passed ? uiCoverage.evidence : undefined
          });
        }
      }

      if (dataChangingWork && originalDatabasePath !== undefined && testDatabaseCopy !== undefined && testDatabaseCopy.startsWith("/")) {
        const originalDatabaseHashAfter = await hashFile(this.fs, originalDatabasePath);
        const testDatabaseHashAfter = await hashFile(this.fs, testDatabaseCopy);
        const proofPath = path.join(this.projectRoot, ".sdd", "evidence", `${Date.now()}-database-proof.json`);
        await this.fs.writeFile(proofPath, `${JSON.stringify({
          originalDatabasePath,
          testDatabaseCopy,
          originalDatabaseHashBefore,
          originalDatabaseHashAfter,
          testDatabaseHashBefore,
          testDatabaseHashAfter
        }, null, 2)}\n`);
        databaseSandboxEvidence.push(proofPath);
        gates.push({
          id: "validation.data.original-database-unchanged",
          name: "Original database unchanged",
          severity: "blocking",
          passed: originalDatabaseHashBefore === originalDatabaseHashAfter,
          message: originalDatabaseHashBefore === originalDatabaseHashAfter
            ? "Original database hash remained unchanged during validation."
            : "Data-changing validation failed because the original database changed; commands must mutate only the isolated test database copy.",
          evidencePath: proofPath
        });
        gates.push({
          id: "validation.data.test-database-mutated",
          name: "Test database copy mutated",
          severity: "blocking",
          passed: testDatabaseHashBefore !== testDatabaseHashAfter,
          message: testDatabaseHashBefore !== testDatabaseHashAfter
            ? "Isolated test database copy changed during validation."
            : "Data-changing validation did not mutate the isolated test database copy.",
          evidencePath: proofPath
        });
      }

      if (dataChangingWork && testDatabaseCopy !== undefined && expectedDatabaseMutations.length > 0) {
        const mutationVerification = await this.databaseMutationVerifier.verifyExpectedMutations({
          projectRoot: this.projectRoot,
          originalDatabasePath,
          testDatabasePath: testDatabaseCopy,
          expectedMutations: expectedDatabaseMutations
        });
        if (mutationVerification.configured) {
          for (const evidencePath of mutationVerification.evidencePaths ?? (mutationVerification.evidencePath !== undefined ? [mutationVerification.evidencePath] : [])) {
            databaseSandboxEvidence.push(evidencePath);
          }
          gates.push({
            id: "validation.data.expected-database-mutations",
            name: "Expected database mutations",
            severity: "blocking",
            passed: mutationVerification.passed,
            message: mutationVerification.passed
              ? "Expected database mutations verified."
              : `expected database mutations failed verification: ${mutationVerification.message}`,
            evidencePath: mutationVerification.evidencePath
          });
        } else {
          gates.push({
            id: "validation.data.database-mutation-verifier",
            name: "Database mutation verifier",
            severity: "blocking",
            passed: false,
            message: usedCommandBackedDatabaseSandbox
              ? "Command-backed database sandbox validation requires .sdd/database-mutation-verifier.json so expected mutations are proved."
              : "Data-changing validation with expected mutations requires .sdd/database-mutation-verifier.json so expected mutations are proved."
          });
        }
      }

      assertValidationPasses(gates);
      if (input.featureId !== undefined) {
        await this.store.updateFeatureStatus(input.featureId, "validated");
      }
      const summary: ValidationSummary = {
        id: `validation-${this.clock.now().toISOString()}`,
        featureId: input.featureId,
        passed: true,
        commands,
        evidence,
        environment: commandEnv,
        uiCoverageEvidence,
        testDatabaseCopy,
        databaseSandboxEvidence,
        createdAt: this.clock.now().toISOString()
      };
      const summaryPath = await this.workflow.appendValidationSummary(summary);
      await this.workflow.updateStep(input.featureId === undefined ? "further-validation" : "feature-validation", {
        status: "complete",
        featureId: input.featureId,
        evidence: [summaryPath, ...evidence.map((item) => item.path ?? item.id), ...databaseSandboxEvidence, ...(testDatabaseCopy !== undefined && testDatabaseCopy.startsWith("/") ? [testDatabaseCopy] : [])]
      });
      await this.workflow.updateStep("validate-not-lied-to", { status: "ready", featureId: input.featureId });

      return { result: { passed: true, evidence }, gates, evidence, outputs: { commandCount: commands.length, summaryPath } };
    });
  }

  private async defaultCommands(): Promise<readonly string[]> {
    return validationCommandsFromPackage({ scripts: await this.packageScripts() });
  }

  private async packageScripts(): Promise<Record<string, string>> {
    const packagePath = path.join(this.projectRoot, "package.json");
    if (!(await this.fs.exists(packagePath))) {
      return {};
    }

    const parsed = JSON.parse(await this.fs.readFile(packagePath)) as { readonly scripts?: Record<string, string> };
    return parsed.scripts ?? {};
  }

  private async expectedDatabaseMutations(featureId: string, experience: string | undefined, specText: string): Promise<readonly string[]> {
    const mutations = new Set<string>();
    for (const mutation of databaseMutationsFromExperience(experience)) {
      mutations.add(mutation);
    }
    for (const mutation of databaseMutationsFromSpecText(specText)) {
      mutations.add(mutation);
    }
    const contract = await this.store.readSemanticContract(featureId);
    for (const scenario of contract?.scenarios ?? []) {
      for (const mutation of scenario.expectedDataMutations.filter((item) => !isNoDatabaseMutation(item))) {
        mutations.add(mutation);
      }
    }
    return Array.from(mutations);
  }
}

function extractUserAuthoredSpecText(files: { readonly requirements?: string; readonly plan?: string; readonly validation?: string }): string {
  const requirements = files.requirements ?? "";
  return [
    readSection(requirements, "Scope"),
    readSection(requirements, "Decisions"),
    readSection(requirements, "Context"),
    readSection(requirements, "Experience Intent")
  ].join("\n");
}

function extractValidationRelevantSpecText(files: { readonly requirements?: string; readonly plan?: string; readonly validation?: string; readonly rawText?: string }): string {
  return [
    extractUserAuthoredSpecText(files),
    files.plan ?? "",
    files.validation ?? "",
    files.rawText ?? ""
  ].join("\n");
}

function readSection(markdown: string, heading: string): string {
  const pattern = new RegExp(`^##\\s+${heading}\\s*\\r?\\n([\\s\\S]*?)(?=^##\\s+|$)`, "im");
  return pattern.exec(markdown)?.[1]?.trim() ?? "";
}

async function hashFile(fs: FileSystemPort, filePath: string): Promise<string> {
  const content = fs.readFileBuffer === undefined ? await fs.readFile(filePath) : await fs.readFileBuffer(filePath);
  return createHash("sha256").update(content).digest("hex");
}

function databaseMutationsFromExperience(experience: string | undefined): readonly string[] {
  return Array.from((experience ?? "").matchAll(/^-\s*Database Mutations:\s*(.*)$/gim))
    .map((match) => match[1]?.trim() ?? "")
    .filter((mutation) => mutation.length > 0 && !isNoDatabaseMutation(mutation));
}

function databaseMutationsFromSpecText(markdown: string): readonly string[] {
  return Array.from(markdown.matchAll(/^(?:[-*]\s*)?(?:Expected\s+)?(?:Database|Data)\s+Mutations?:\s*(.*)$/gim))
    .flatMap((match) => (match[1] ?? "").split(/;|,/))
    .map((mutation) => mutation.trim())
    .filter((mutation) => mutation.length > 0 && !isNoDatabaseMutation(mutation));
}

function isNoDatabaseMutation(value: string): boolean {
  return /^(none|n\/a|not applicable|no|no mutation|no database mutation|read only|read-only)$/i.test(value.trim());
}
