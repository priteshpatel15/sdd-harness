import path from "node:path";
import { ClockPort, FileSystemPort, GitPort, PromptCatalogPort, ReviewAgentPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { traceUseCase } from "./common";
import { requireCurrentFeatureApproval, requireFeatureStatus } from "./common";
import { GateError } from "../../domain/errors";
import { ReviewFinding, ReviewLens, ReviewSummaryFinding, ReviewSummaryRecord, SubagentReviewResult } from "../../domain/models";
import { featureTextRequiresExperience } from "../../domain/spec-validation";

export class DeepReviewUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly reviewAgent: ReviewAgentPort,
    private readonly git: GitPort,
    private readonly promptCatalog: PromptCatalogPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly featureId?: string; readonly waiverReason?: string; readonly approvedBy?: string }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "feature deep-review", input, async () => {
      const contextFiles = await this.contextFiles(input.featureId);
      if (input.featureId !== undefined) {
        await requireFeatureStatus(this.store, input.featureId, ["validated"], "deep review");
        await requireCurrentFeatureApproval(this.store, this.workflow, this.fs, this.projectRoot, input.featureId);
      }
      const lenses = await this.requiredLenses(input.featureId, contextFiles);
      const reviews: SubagentReviewResult[] = [];
      for (const lens of lenses) {
        const prompt = this.promptCatalog.render({
          promptId: "feature.deep-review",
          featureId: input.featureId,
          lens,
          contextFiles
        });
        reviews.push(await this.reviewAgent.review({
          featureId: input.featureId,
          lens,
          projectRoot: this.projectRoot,
          prompt
        }));
      }

      const findings = normalizeFindings(reviews);
      const failed = reviews.filter((review) => review.status === "failed");
      const blockingFindings = findings.filter((finding) => finding.severity === "blocking");
      const unresolved = [...failed.map((review) => `lens:${review.lens}`), ...blockingFindings.map((finding) => finding.id)];
      if (unresolved.length > 0 && input.waiverReason !== undefined && (input.approvedBy === undefined || input.approvedBy.trim().length === 0)) {
        throw new GateError("Hard gate: deep review waivers require --approved-by.");
      }

      const content = `# Deep Review

Feature: ${input.featureId ?? "project"}

${reviews
    .map((review) => `## ${review.lens}

Status: ${review.status}

${review.findings.length > 0 ? review.findings.map((finding) => `- **${finding.severity}:** ${finding.summary} Recommendation: ${finding.recommendation}`).join("\n") : "- No findings recorded."}

Evidence:
${review.evidencePaths.map((item) => `- ${path.relative(this.projectRoot, item)}`).join("\n")}`)
    .join("\n\n")}

## Required Human Review

- Confirm each recommendation before applying it.
- Do not proceed with broad rewrites unless the spec calls for them.
- Update feature specs if implementation revealed missing requirements.
`;
      const outputPath = await this.store.writeReviewPacket(input.featureId, content);
      const status = unresolved.length > 0
        ? input.waiverReason !== undefined ? "waived" : "blocked"
        : "passed";
      const summary: ReviewSummaryRecord = {
        id: `review-summary-${this.clock.now().toISOString()}`,
        featureId: input.featureId,
        status,
        findings,
        reviewEvidencePaths: [outputPath, ...reviews.flatMap((review) => review.evidencePaths)],
        waivedFindingIds: status === "waived" ? unresolved : [],
        createdAt: this.clock.now().toISOString()
      };
      const summaryPath = await this.workflow.appendReviewSummary(summary);

      if (status === "blocked") {
        await this.workflow.updateStep("validate-not-lied-to", {
          status: "blocked",
          featureId: input.featureId,
          evidence: [outputPath, summaryPath, ...reviews.flatMap((review) => review.evidencePaths)],
          blockers: unresolved
        });
        throw new GateError(`Hard gate: deep review found blocking review issues: ${unresolved.join(", ")}.`);
      }

      if (status === "waived") {
        await this.workflow.appendWaiver({
          id: `waiver-${this.clock.now().toISOString()}`,
          gateId: "deep-review.subagent",
          featureId: input.featureId,
          reason: input.waiverReason!,
          approvedBy: input.approvedBy!,
          createdAt: this.clock.now().toISOString()
        });
      }
      await this.workflow.updateStep("validate-not-lied-to", {
        status: status === "waived" ? "waived" : "complete",
        featureId: input.featureId,
        evidence: [outputPath, summaryPath, ...reviews.flatMap((review) => review.evidencePaths)],
        waiver: status === "waived"
          ? {
              reason: input.waiverReason ?? "unspecified",
              approvedBy: input.approvedBy ?? "unspecified",
              createdAt: this.clock.now().toISOString()
            }
          : undefined
      });
      await this.workflow.updateStep("semantic-verification", { status: "ready", featureId: input.featureId });
      return { result: { path: outputPath }, outputs: { path: outputPath } };
    });
  }

  private async requiredLenses(featureId: string | undefined, contextFiles: Record<string, string | undefined>): Promise<readonly ReviewLens[]> {
    const configured = await this.reviewAgent.requiredLenses(this.projectRoot);
    const lenses = new Set<ReviewLens>(configured);
    const featureText = [
      readSection(contextFiles[`specs/${featureId}/requirements.md`] ?? "", "Scope"),
      readSection(contextFiles[`specs/${featureId}/requirements.md`] ?? "", "Decisions"),
      readSection(contextFiles[`specs/${featureId}/requirements.md`] ?? "", "Context")
    ].join("\n");
    if (featureId !== undefined && featureTextRequiresExperience(featureText, contextFiles[`specs/${featureId}/experience.md`])) {
      lenses.add("experience-and-playwright");
    }
    return Array.from(lenses);
  }

  private async contextFiles(featureId: string | undefined): Promise<Record<string, string | undefined>> {
    const context: Record<string, string | undefined> = {
      "specs/mission.md": await this.readOptional(path.join(this.projectRoot, "specs", "mission.md")),
      "specs/tech-stack.md": await this.readOptional(path.join(this.projectRoot, "specs", "tech-stack.md")),
      "specs/roadmap.md": await this.readOptional(path.join(this.projectRoot, "specs", "roadmap.md")),
      ".sdd/validation-summaries.jsonl": await this.readOptional(path.join(this.projectRoot, ".sdd", "validation-summaries.jsonl")),
      ".sdd/task-groups.jsonl": await this.readOptional(path.join(this.projectRoot, ".sdd", "task-groups.jsonl")),
      "CHANGELOG.md": await this.readOptional(path.join(this.projectRoot, "CHANGELOG.md"))
    };
    if (featureId !== undefined) {
      const featureFiles = await this.store.readFeatureFiles(featureId);
      context[`specs/${featureId}/requirements.md`] = featureFiles.requirements;
      context[`specs/${featureId}/plan.md`] = featureFiles.plan;
      context[`specs/${featureId}/validation.md`] = featureFiles.validation;
      context[`specs/${featureId}/experience.md`] = await this.store.readFeatureExperience(featureId);
      context[`specs/${featureId}/semantics.md`] = (await this.store.readFeatureSemanticFiles(featureId)).markdown;
      context[`.sdd/semantic-contracts/${featureId}.json`] = await this.readOptional(path.join(this.projectRoot, ".sdd", "semantic-contracts", `${featureId}.json`));
      context[`.sdd/implementation-packets/${featureId}.md`] = await this.readOptional(path.join(this.projectRoot, ".sdd", "implementation-packets", `${featureId}.md`));
      Object.assign(context, await this.sourceSnapshotContext());
      Object.assign(context, await this.evidenceFileContext());
    }
    return context;
  }

  private async sourceSnapshotContext(): Promise<Record<string, string | undefined>> {
    if (!(await this.git.isRepository())) {
      return {
        "source/changed-files.txt": "No git repository detected; source context is inferred from task-group and validation evidence files."
      };
    }

    const changedFiles = await this.git.changedFiles();
    const context: Record<string, string | undefined> = {
      "git/changed-files.txt": changedFiles.length > 0 ? changedFiles.join("\n") : "No changed files reported by git status.",
      "git/diff.patch": await this.git.diff() ?? "No git diff available."
    };
    for (const file of changedFiles.filter(isReviewableSourceFile).slice(0, 20)) {
      const absolute = path.join(this.projectRoot, file);
      if (await this.fs.exists(absolute)) {
        context[`source:${file}`] = await this.fs.readFile(absolute);
      }
    }
    return context;
  }

  private async evidenceFileContext(): Promise<Record<string, string | undefined>> {
    const context: Record<string, string | undefined> = {};
    const taskGroups = await this.readOptional(path.join(this.projectRoot, ".sdd", "task-groups.jsonl"));
    const validationSummaries = await this.readOptional(path.join(this.projectRoot, ".sdd", "validation-summaries.jsonl"));
    const refs = new Set<string>();
    for (const content of [taskGroups, validationSummaries]) {
      for (const ref of Array.from((content ?? "").matchAll(/"([^"]+\.(?:ts|tsx|js|jsx|md|log|json|sql)(?:::[^"]+)*)"/g)).map((match) => match[1] ?? "")) {
        refs.add(ref.split("::")[0]!.trim());
      }
    }
    for (const ref of Array.from(refs).slice(0, 20)) {
      const absolute = path.isAbsolute(ref) ? ref : path.join(this.projectRoot, ref);
      if (await this.fs.exists(absolute)) {
        context[`evidence:${ref}`] = await this.fs.readFile(absolute);
      }
    }
    return context;
  }

  private async readOptional(filePath: string): Promise<string | undefined> {
    return (await this.fs.exists(filePath)) ? this.fs.readFile(filePath) : undefined;
  }
}

function isReviewableSourceFile(file: string): boolean {
  return /\.(?:ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|java|kt|swift|sql|md|json)$/i.test(file);
}

function readSection(markdown: string, heading: string): string {
  const pattern = new RegExp(`^##\\s+${heading}\\s*\\r?\\n([\\s\\S]*?)(?=^##\\s+|$)`, "im");
  return pattern.exec(markdown)?.[1]?.trim() ?? "";
}

function normalizeFindings(reviews: readonly SubagentReviewResult[]): ReviewSummaryFinding[] {
  return reviews.flatMap((review) => review.findings.flatMap((finding) => {
    const normalized = {
      id: finding.id,
      lens: review.lens,
      severity: finding.severity,
      summary: finding.summary,
      recommendation: finding.recommendation,
      source: finding.source,
      evidencePaths: citationPaths(finding, review.evidencePaths)
    };
    if ((finding.severity === "warning" || finding.severity === "blocking") && (finding.evidenceRefs ?? []).length === 0) {
      return [
        normalized,
        {
          id: `${finding.id}-missing-citation`,
          lens: review.lens,
          severity: "blocking" as const,
          summary: `Actionable review finding '${finding.id}' did not cite concrete source/spec/evidence paths.`,
          recommendation: "Return evidenceRefs for every warning or blocking review finding.",
          source: finding.source,
          evidencePaths: review.evidencePaths
        }
      ];
    }
    return [normalized];
  }));
}

function citationPaths(finding: ReviewFinding, fallback: readonly string[]): readonly string[] {
  return (finding.evidenceRefs ?? []).length > 0 ? finding.evidenceRefs! : fallback;
}
