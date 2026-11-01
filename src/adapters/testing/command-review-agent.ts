import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { AgentProviderPort, FileSystemPort, ReviewAgentPort } from "../../application/ports";
import { GUIDED_DRAFT_SCHEMA } from "../../domain/agent-schemas";
import { ReviewFinding, ReviewLens, SubagentReviewRequest, SubagentReviewResult } from "../../domain/models";
import { slugify } from "../../domain/slug";
import {
  invalidReviewFinding,
  parseReviewFindingsStructured,
  parseReviewFindingsText
} from "../../domain/agent-output-validation";

const execAsync = promisify(exec);

interface ReviewAgentConfig {
  readonly commandTemplate?: string;
  readonly timeoutMs?: number;
  readonly requiredLenses?: readonly ReviewLens[];
}

export class CommandReviewAgent implements ReviewAgentPort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly agentProvider?: AgentProviderPort
  ) {}

  public async requiredLenses(projectRoot: string): Promise<readonly ReviewLens[]> {
    const config = await this.readConfig(projectRoot);
    const agentConfig = await this.agentProvider?.readConfig(projectRoot);
    return config.requiredLenses ?? agentConfig?.requiredReviewLenses ?? ["architecture", "spec-alignment", "test-and-qa"];
  }

  public async review(input: SubagentReviewRequest): Promise<SubagentReviewResult> {
    const config = await this.readConfig(input.projectRoot);
    const reviewRoot = path.join(input.projectRoot, ".sdd", "reviews", slugify(input.featureId ?? "project"));
    const promptPath = path.join(reviewRoot, "prompts", `${input.lens}.md`);
    const jsonPath = path.join(reviewRoot, `${input.lens}.json`);
    const markdownPath = path.join(reviewRoot, `${input.lens}.md`);
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
            lens: input.lens
          });
          const parsed = parseReviewFindingsStructured(agentResult.parsed, input.lens);
          const reviewResult: SubagentReviewResult = {
            lens: input.lens,
            status: parsed.valid ? "passed" : "failed",
            findings: parsed.valid ? parsed.findings : [invalidReviewFinding(input.lens, parsed.error ?? "Invalid review output.")],
            evidencePaths: [agentResult.promptPath, agentResult.schemaPath, agentResult.outputPath, jsonPath, markdownPath],
            stdout: agentResult.rawText,
            stderr: "",
            exitCode: 0
          };
          await this.writeArtifacts(jsonPath, markdownPath, input, reviewResult);
          return reviewResult;
        } catch (error) {
          const result = failedResult(input.lens, error instanceof Error ? error.message : String(error), [promptPath, jsonPath, markdownPath]);
          await this.writeArtifacts(jsonPath, markdownPath, input, result);
          return result;
        }
      }
      const result = failedResult(input.lens, "No .sdd/review-agents.json commandTemplate configured.", [promptPath, jsonPath, markdownPath]);
      await this.writeArtifacts(jsonPath, markdownPath, input, result);
      return result;
    }

    const command = config.commandTemplate
      .replaceAll("{lens}", shellQuote(input.lens))
      .replaceAll("{promptFile}", shellQuote(promptPath))
      .replaceAll("{featureId}", shellQuote(input.featureId ?? "project"));

    try {
      const result = await execAsync(command, {
        cwd: input.projectRoot,
        timeout: config.timeoutMs ?? 600000,
        maxBuffer: 10 * 1024 * 1024
      });
      const parsed = parseReviewFindingsText(result.stdout, input.lens);
      const reviewResult: SubagentReviewResult = {
        lens: input.lens,
        status: parsed.valid ? "passed" : "failed",
        findings: parsed.valid ? parsed.findings : [invalidReviewFinding(input.lens, parsed.error ?? "Invalid review output.")],
        evidencePaths: [promptPath, jsonPath, markdownPath],
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: 0
      };
      await this.writeArtifacts(jsonPath, markdownPath, input, reviewResult);
      return reviewResult;
    } catch (error) {
      const execError = error as { readonly code?: number; readonly stdout?: string; readonly stderr?: string; readonly message?: string };
      const reviewResult = failedResult(input.lens, execError.stderr ?? execError.message ?? "Review command failed.", [promptPath, jsonPath, markdownPath], execError.code, execError.stdout, execError.stderr);
      await this.writeArtifacts(jsonPath, markdownPath, input, reviewResult);
      return reviewResult;
    }
  }

  private async readConfig(projectRoot: string): Promise<ReviewAgentConfig> {
    const configPath = path.join(projectRoot, ".sdd", "review-agents.json");
    if (!(await this.fs.exists(configPath))) {
      return {};
    }
    return JSON.parse(await this.fs.readFile(configPath)) as ReviewAgentConfig;
  }

  private async writeArtifacts(jsonPath: string, markdownPath: string, input: SubagentReviewRequest, result: SubagentReviewResult): Promise<void> {
    await this.fs.writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
    await this.fs.writeFile(markdownPath, renderReviewMarkdown(input, result));
  }
}

function failedResult(lens: ReviewLens, message: string, evidencePaths: readonly string[], exitCode?: number, stdout?: string, stderr?: string): SubagentReviewResult {
  return {
    lens,
    status: "failed",
    findings: [{ id: `${lens}-failed`, severity: "blocking", summary: message, recommendation: "Configure or fix the review subagent command, then rerun deep review." }],
    evidencePaths,
    stdout,
    stderr,
    exitCode
  };
}

function renderReviewMarkdown(input: SubagentReviewRequest, result: SubagentReviewResult): string {
  return `# Review: ${input.lens}

Feature: ${input.featureId ?? "project"}
Status: ${result.status}

${result.findings.map((finding) => `## ${finding.id}

Severity: ${finding.severity}

${finding.summary}

Recommendation: ${finding.recommendation}
`).join("\n")}
`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
