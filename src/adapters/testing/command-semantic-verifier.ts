import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { AgentProviderPort, FileSystemPort, SemanticVerifierPort } from "../../application/ports";
import { GUIDED_DRAFT_SCHEMA } from "../../domain/agent-schemas";
import { SemanticVerificationDimension, SemanticVerificationFinding } from "../../domain/models";
import { slugify } from "../../domain/slug";
import {
  invalidSemanticFinding,
  parseSemanticFindingsStructured,
  parseSemanticFindingsText
} from "../../domain/agent-output-validation";

const execAsync = promisify(exec);

interface SemanticVerifierConfig {
  readonly commandTemplate?: string;
  readonly timeoutMs?: number;
}

export class CommandSemanticVerifier implements SemanticVerifierPort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly agentProvider?: AgentProviderPort
  ) {}

  public async verify(input: {
    readonly featureId: string;
    readonly dimension: SemanticVerificationDimension;
    readonly projectRoot: string;
    readonly prompt: string;
  }): Promise<{
    readonly dimension: SemanticVerificationDimension;
    readonly status: "passed" | "failed";
    readonly findings: readonly SemanticVerificationFinding[];
    readonly evidencePaths: readonly string[];
    readonly stdout?: string;
    readonly stderr?: string;
    readonly exitCode?: number;
  }> {
    const config = await this.readConfig(input.projectRoot);
    const outputRoot = path.join(input.projectRoot, ".sdd", "semantic", slugify(input.featureId));
    const promptPath = path.join(outputRoot, "prompts", `${input.dimension}.md`);
    const jsonPath = path.join(outputRoot, `${input.dimension}.json`);
    const markdownPath = path.join(outputRoot, `${input.dimension}.md`);
    await this.fs.writeFile(promptPath, input.prompt);

    if (config.commandTemplate === undefined || config.commandTemplate.trim().length === 0) {
      const agentConfig = await this.agentProvider?.readConfig(input.projectRoot);
      if (agentConfig !== undefined && this.agentProvider !== undefined) {
        try {
          const agentResult = await this.agentProvider.draft({
            provider: agentConfig.provider,
            purpose: "review",
            prompt: input.prompt,
            schema: GUIDED_DRAFT_SCHEMA.review,
            projectRoot: input.projectRoot,
            featureId: input.featureId,
            semanticDimension: input.dimension
          });
          const parsed = parseSemanticFindingsStructured(agentResult.parsed, input.dimension);
          const result = {
            dimension: input.dimension,
            status: parsed.valid ? "passed" as const : "failed" as const,
            findings: parsed.valid ? parsed.findings : [invalidSemanticFinding(input.dimension, parsed.error ?? "Invalid semantic verifier output.")],
            evidencePaths: [agentResult.promptPath, agentResult.schemaPath, agentResult.outputPath, jsonPath, markdownPath],
            stdout: agentResult.rawText,
            stderr: "",
            exitCode: 0
          };
          await this.writeArtifacts(jsonPath, markdownPath, input, result);
          return result;
        } catch (error) {
          const result = failedResult(input.dimension, error instanceof Error ? error.message : String(error), [promptPath, jsonPath, markdownPath]);
          await this.writeArtifacts(jsonPath, markdownPath, input, result);
          return result;
        }
      }
      const result = failedResult(input.dimension, "No .sdd/semantic-verifiers.json commandTemplate configured.", [promptPath, jsonPath, markdownPath]);
      await this.writeArtifacts(jsonPath, markdownPath, input, result);
      return result;
    }

    const command = config.commandTemplate
      .replaceAll("{dimension}", shellQuote(input.dimension))
      .replaceAll("{promptFile}", shellQuote(promptPath))
      .replaceAll("{featureId}", shellQuote(input.featureId));

    try {
      const result = await execAsync(command, {
        cwd: input.projectRoot,
        timeout: config.timeoutMs ?? 600000,
        maxBuffer: 10 * 1024 * 1024
      });
      const parsed = parseSemanticFindingsText(result.stdout, input.dimension);
      const reviewResult = {
        dimension: input.dimension,
        status: parsed.valid ? "passed" as const : "failed" as const,
        findings: parsed.valid ? parsed.findings : [invalidSemanticFinding(input.dimension, parsed.error ?? "Invalid semantic verifier output.")],
        evidencePaths: [promptPath, jsonPath, markdownPath],
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: 0
      };
      await this.writeArtifacts(jsonPath, markdownPath, input, reviewResult);
      return reviewResult;
    } catch (error) {
      const execError = error as { readonly code?: number; readonly stdout?: string; readonly stderr?: string; readonly message?: string };
      const result = failedResult(input.dimension, execError.stderr ?? execError.message ?? "Semantic verifier failed.", [promptPath, jsonPath, markdownPath], execError.code, execError.stdout, execError.stderr);
      await this.writeArtifacts(jsonPath, markdownPath, input, result);
      return result;
    }
  }

  private async readConfig(projectRoot: string): Promise<SemanticVerifierConfig> {
    const configPath = path.join(projectRoot, ".sdd", "semantic-verifiers.json");
    if (!(await this.fs.exists(configPath))) {
      return {};
    }
    return JSON.parse(await this.fs.readFile(configPath)) as SemanticVerifierConfig;
  }

  private async writeArtifacts(jsonPath: string, markdownPath: string, input: { readonly featureId: string; readonly dimension: SemanticVerificationDimension }, result: { readonly dimension: SemanticVerificationDimension; readonly status: "passed" | "failed"; readonly findings: readonly SemanticVerificationFinding[]; readonly evidencePaths: readonly string[]; readonly stdout?: string; readonly stderr?: string; readonly exitCode?: number }): Promise<void> {
    await this.fs.writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
    await this.fs.writeFile(markdownPath, renderMarkdown(input, result));
  }
}

function failedResult(dimension: SemanticVerificationDimension, message: string, evidencePaths: readonly string[], exitCode?: number, stdout?: string, stderr?: string) {
  return {
    dimension,
    status: "failed" as const,
    findings: [{
      id: `${dimension}-failed`,
      claimId: dimension,
      dimension,
      severity: "blocking" as const,
      summary: message,
      evidenceRefs: evidencePaths,
      requiredFix: "Configure or fix the semantic verifier command, then rerun semantic verification.",
      source: "semantic-verifier"
    }],
    evidencePaths,
    stdout,
    stderr,
    exitCode
  };
}

function renderMarkdown(input: { readonly featureId: string; readonly dimension: SemanticVerificationDimension }, result: { readonly status: "passed" | "failed"; readonly findings: readonly SemanticVerificationFinding[] }): string {
  return `# Semantic Verification: ${input.dimension}

Feature: ${input.featureId}
Status: ${result.status}

${result.findings.map((finding) => `## ${finding.id}

Severity: ${finding.severity}
Claim: ${finding.claimId}
Evidence: ${finding.evidenceRefs.join(", ") || "none"}

${finding.summary}

Required Fix: ${finding.requiredFix}
`).join("\n") || "No findings."}
`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
