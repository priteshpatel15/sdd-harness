import path from "node:path";
import { BrowserQAPort, FileSystemPort, ValidationCommandResult } from "../../application/ports";
import { validationCommandResolvesToPlaywright } from "../../domain/spec-validation";
import { ExperienceFlow, isNoDatabaseMutation, parseExperienceFlows, playwrightTitle } from "./experience-flows";
import {
  containsDatabaseMutationEvidence,
  containsPlaywrightHarness,
  containsStaticEvidence,
  containsVisibleOutcomeEvidence,
  extractTestBody,
  jsonCandidates,
  jsonHasPassedTestTitle
} from "./playwright-evidence";
import { componentMatchesFlow, discoverUiInventory, isOutOfScope, routeMatchesFlow } from "./ui-inventory";

export class PlaywrightCoverageAdapter implements BrowserQAPort {
  public constructor(private readonly fs: FileSystemPort) {}

  public async hasWorkflowCoverage(projectRoot: string): Promise<{ readonly passed: boolean; readonly evidence: string }> {
    const candidates = [
      path.join(projectRoot, "tests", "e2e"),
      path.join(projectRoot, "e2e"),
      path.join(projectRoot, "playwright.config.ts"),
      path.join(projectRoot, "playwright.config.js")
    ];

    for (const candidate of candidates) {
      if (await this.fs.exists(candidate)) {
        return { passed: true, evidence: candidate };
      }
    }

    return {
      passed: false,
      evidence: "No Playwright workflow coverage found at tests/e2e, e2e, or playwright.config.*"
    };
  }

  public async validateExperienceCoverage(input: {
    readonly projectRoot: string;
    readonly featureId: string;
    readonly experienceMarkdown: string;
  }): Promise<{ readonly passed: boolean; readonly evidence: string; readonly missingFlows: readonly string[] }> {
    const flows = parseExperienceFlows(input.experienceMarkdown);
    if (flows.length === 0) {
      return { passed: false, evidence: "No FLOW-* experience flows found in experience.md.", missingFlows: ["experience.md"] };
    }

    const missingFlows: string[] = [];
    const evidence: string[] = [];
    for (const flow of flows) {
      const mapping = flow.playwright.trim();
      if (mapping.length === 0 || /^TODO\b/i.test(mapping)) {
        missingFlows.push(flow.id);
        continue;
      }
      const resolved = await this.resolvePlaywrightMapping(input.projectRoot, mapping, flow);
      if (!resolved.passed) {
        missingFlows.push(`${flow.id} (${resolved.reason})`);
      } else {
        evidence.push(`${flow.id} -> ${mapping}`);
      }
    }

    return {
      passed: missingFlows.length === 0,
      evidence: missingFlows.length === 0
        ? `Experience flows mapped to concrete Playwright coverage: ${evidence.join(", ")}`
        : `Experience flows missing Playwright coverage mapping: ${missingFlows.join(", ")}`,
      missingFlows
    };
  }

  public async validateExecutedExperienceCoverage(input: {
    readonly projectRoot: string;
    readonly featureId: string;
    readonly experienceMarkdown: string;
    readonly commands: readonly ValidationCommandResult[];
    readonly packageScripts: Record<string, string>;
    readonly strict?: boolean;
  }): Promise<{ readonly passed: boolean; readonly evidence: string; readonly missingFlows: readonly string[] }> {
    const flows = parseExperienceFlows(input.experienceMarkdown);
    const mappedFlows = flows.map((flow) => ({ id: flow.id, title: playwrightTitle(flow.playwright) }))
      .filter((flow): flow is { readonly id: string; readonly title: string } => flow.title !== undefined);
    if (mappedFlows.length === 0) {
      return { passed: false, evidence: "No mapped Playwright test titles found in experience.md.", missingFlows: flows.map((flow) => flow.id) };
    }

    const playwrightResults = input.commands.filter((command) => (
      command.exitCode === 0 && validationCommandResolvesToPlaywright(command.command, input.packageScripts)
    ));
    const commandEvidence = await Promise.all(playwrightResults.map((result) => this.commandEvidence(result)));
    const parsedJson = commandEvidence.flatMap((evidence) => [...jsonCandidates(evidence.stdout), ...jsonCandidates(evidence.stderr)]);
    const hasJsonReporterEvidence = parsedJson.length > 0;
    if (input.strict === true && !hasJsonReporterEvidence) {
      return {
        passed: false,
        evidence: "Playwright validation requires JSON reporter evidence from a successful Playwright command by default; title-only stdout is accepted only with compatibility mode.",
        missingFlows: mappedFlows.map((flow) => `${flow.id}::${flow.title}`)
      };
    }
    const missing = mappedFlows.filter((flow) => {
      const executed = hasJsonReporterEvidence
        ? parsedJson.some((value) => jsonHasPassedTestTitle(value, flow.title))
        : commandEvidence.some((evidence) => `${evidence.stdout}\n${evidence.stderr}\n${evidence.log ?? ""}`.includes(flow.title));
      return !executed;
    });

    return {
      passed: missing.length === 0,
      evidence: missing.length === 0
        ? `Mapped Playwright tests executed: ${mappedFlows.map((flow) => `${flow.id}::${flow.title}`).join(", ")}`
        : `Mapped Playwright tests did not appear in successful Playwright command evidence: ${missing.map((flow) => `${flow.id}::${flow.title}`).join(", ")}`,
      missingFlows: missing.map((flow) => `${flow.id}::${flow.title}`)
    };
  }

  public async validateInventoryCoverage(input: {
    readonly projectRoot: string;
    readonly featureId: string;
    readonly experienceMarkdown: string;
  }): Promise<{ readonly passed: boolean; readonly evidence: string; readonly missingWorkflows: readonly string[] }> {
    const flows = parseExperienceFlows(input.experienceMarkdown);
    const discovery = await discoverUiInventory(this.fs, input.projectRoot);
    if (discovery.errors.length > 0) {
      return {
        passed: false,
        evidence: discovery.errors.join("; "),
        missingWorkflows: discovery.errors.map((error) => `ui-inventory:${error}`)
      };
    }
    const inventory = discovery.inventory;
    const missingRoutes = inventory.routes.filter((route) => (
      !flows.some((flow) => routeMatchesFlow(route, flow.routeOrScreen))
      && !isOutOfScope(input.experienceMarkdown, route)
    ));
    const missingForms = inventory.forms.filter((form) => (
      !flows.some((flow) => routeMatchesFlow(form.route, flow.routeOrScreen) && /\bsubmit|save|create|update|delete|send\b/i.test(flow.happyPath))
      && !isOutOfScope(input.experienceMarkdown, form.route)
    ));
    const missingComponentForms = inventory.componentForms.filter((component) => (
      !flows.some((flow) => componentMatchesFlow(component, flow.routeOrScreen, flow.happyPath))
      && !isOutOfScope(input.experienceMarkdown, component.path)
      && !isOutOfScope(input.experienceMarkdown, component.name)
      && (component.route === undefined || !isOutOfScope(input.experienceMarkdown, component.route))
    ));
    const missingComponentActions = inventory.componentActions.filter((component) => (
      !flows.some((flow) => componentMatchesFlow(component, flow.routeOrScreen, flow.happyPath))
      && !isOutOfScope(input.experienceMarkdown, component.path)
      && !isOutOfScope(input.experienceMarkdown, component.name)
      && (component.route === undefined || !isOutOfScope(input.experienceMarkdown, component.route))
    ));
    const missing = [
      ...missingRoutes.map((route) => `route:${route}`),
      ...missingForms.map((form) => `form-submit:${form.route}`),
      ...missingComponentForms.map((component) => `component-form:${component.path}`),
      ...missingComponentActions.map((component) => `component-action:${component.path}`)
    ];
    return {
      passed: missing.length === 0,
      evidence: missing.length === 0
        ? `Discovered UI inventory is represented in experience.md (${inventory.routes.length} route(s), ${inventory.forms.length + inventory.componentForms.length} form workflow(s), ${inventory.componentActions.length} component action(s)).`
        : `Discovered UI workflows missing from experience.md: ${missing.join(", ")}`,
      missingWorkflows: missing
    };
  }

  private async commandEvidence(result: ValidationCommandResult): Promise<{ readonly stdout: string; readonly stderr: string; readonly log?: string }> {
    const log = result.evidencePath !== undefined && await this.fs.exists(result.evidencePath)
      ? await this.fs.readFile(result.evidencePath)
      : undefined;
    return { stdout: result.stdout, stderr: result.stderr, log };
  }

  private async resolvePlaywrightMapping(
    projectRoot: string,
    mapping: string,
    flow: Pick<ExperienceFlow, "routeOrScreen" | "edgeCases" | "databaseMutations" | "expectedVisibleOutcome">
  ): Promise<{ readonly passed: boolean; readonly reason?: string }> {
    const [fileRef = "", title] = mapping.split("::");
    const normalizedFileRef = fileRef.trim();
    if (normalizedFileRef.length === 0) {
      return { passed: false, reason: "empty Playwright file reference" };
    }

    const absolute = path.isAbsolute(normalizedFileRef) ? normalizedFileRef : path.join(projectRoot, normalizedFileRef);
    if (!(await this.fs.exists(absolute))) {
      return { passed: false, reason: `${normalizedFileRef} not found` };
    }
    const stat = await this.fs.stat(absolute);
    if (stat.isDirectory) {
      return { passed: false, reason: `${normalizedFileRef} must point to a test file and title` };
    }
    if (title === undefined || title.trim().length === 0) {
      return { passed: false, reason: `${normalizedFileRef} must include a test title with ::title` };
    }

    const content = await this.fs.readFile(absolute);
    if (!containsPlaywrightHarness(content)) {
      return { passed: false, reason: `${normalizedFileRef} does not appear to be a Playwright test file` };
    }
    if (!content.includes(title.trim())) {
      return { passed: false, reason: `test title '${title.trim()}' not found in ${normalizedFileRef}` };
    }
    const testBody = extractTestBody(content, title.trim());
    if (!containsStaticEvidence(testBody, flow.routeOrScreen)) {
      return { passed: false, reason: `route/screen evidence '${flow.routeOrScreen}' not found in ${normalizedFileRef}` };
    }
    if (!containsVisibleOutcomeEvidence(testBody, flow.expectedVisibleOutcome)) {
      return { passed: false, reason: `expected visible outcome evidence '${flow.expectedVisibleOutcome}' not found in ${normalizedFileRef}` };
    }
    const missingEdgeCase = flow.edgeCases.find((edgeCase) => !containsVisibleOutcomeEvidence(testBody, edgeCase));
    if (missingEdgeCase !== undefined) {
      return { passed: false, reason: `edge/error state evidence '${missingEdgeCase}' not found in ${normalizedFileRef}` };
    }
    if (!isNoDatabaseMutation(flow.databaseMutations) && !containsDatabaseMutationEvidence(testBody, flow.databaseMutations)) {
      return { passed: false, reason: `database mutation evidence '${flow.databaseMutations}' not found in ${normalizedFileRef}` };
    }
    return { passed: true };
  }
}
