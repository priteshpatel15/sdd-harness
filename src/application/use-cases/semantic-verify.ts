import path from "node:path";
import {
  ClockPort,
  FileSystemPort,
  GitPort,
  SemanticVerifierPort,
  SpecStorePort,
  TelemetrySink,
  WorkflowStatePort
} from "../ports";
import {
  SemanticContract,
  SemanticEvidenceRequirement,
  SemanticVerificationDimension,
  SemanticVerificationFinding,
  SemanticVerificationSummary,
  TaskGroupProgress,
  ValidationSummary
} from "../../domain/models";
import { deterministicFinding, validateSemanticContractFiles } from "../../domain/semantic-validation";
import { GateError } from "../../domain/errors";
import { requireCurrentFeatureApproval, requireFeatureStatus, traceUseCase } from "./common";
import { structuredTelemetryEvidenceMatches } from "../../domain/telemetry-evidence";
import { evaluateArchitecturePolicy } from "../architecture-policy";

const DEFAULT_DIMENSIONS: readonly SemanticVerificationDimension[] = ["architecture-philosophy", "product-correctness"];

export class SemanticVerifyUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly verifier: SemanticVerifierPort,
    private readonly git: GitPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly featureId: string; readonly waiverReason?: string; readonly approvedBy?: string }): Promise<{ readonly status: "passed" | "failed" | "waived"; readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "feature semantic-verify", input, async () => {
      await requireFeatureStatus(this.store, input.featureId, ["validated"], "semantic verification");
      await requireCurrentFeatureApproval(this.store, this.workflow, this.fs, this.projectRoot, input.featureId);
      const semanticFiles = await this.store.readFeatureSemanticFiles(input.featureId);
      const experience = await this.store.readFeatureExperience(input.featureId);
      const contractGates = validateSemanticContractFiles({
        ...semanticFiles,
        experienceMarkdown: experience
      });
      const deterministicFindings: SemanticVerificationFinding[] = contractGates
        .filter((gate) => !gate.passed)
        .map((gate) => deterministicFinding(`det-${gate.id}`, gate.id, "blocking", gate.message, ["specs/<feature>/semantics.md", `.sdd/semantic-contracts/${input.featureId}.json`], "Fix the semantic contract and rerun semantic verification."));

      const context = await this.context(input.featureId, semanticFiles.contract);
      const evidencePacketPath = await this.writeEvidencePacket(input.featureId, context);
      deterministicFindings.push(...await this.traceabilityFindings(input.featureId, semanticFiles.contract, context));
      deterministicFindings.push(...await this.architectureFindings());

      const reviewerFindings: SemanticVerificationFinding[] = [];
      if (deterministicFindings.every((finding) => finding.severity !== "blocking")) {
        for (const dimension of DEFAULT_DIMENSIONS) {
          const result = await this.verifier.verify({
            featureId: input.featureId,
            dimension,
            projectRoot: this.projectRoot,
            prompt: renderVerifierPrompt(dimension, context)
          });
          if (result.status === "failed") {
            reviewerFindings.push(deterministicFinding(`verifier-${dimension}-failed`, dimension, "blocking", `Semantic verifier failed for ${dimension}.`, result.evidencePaths, "Configure or fix the semantic verifier, then rerun."));
          }
          reviewerFindings.push(...result.findings.map(normalizeReviewerFinding));
        }
      }

      const blocking = [...deterministicFindings, ...reviewerFindings].filter((finding) => finding.severity === "blocking");
      if (blocking.length > 0 && input.waiverReason !== undefined && (input.approvedBy === undefined || input.approvedBy.trim().length === 0)) {
        throw new GateError("Hard gate: semantic verification waivers require --approved-by.");
      }
      const status = blocking.length > 0
        ? input.waiverReason !== undefined ? "waived" : "failed"
        : "passed";
      const summary: SemanticVerificationSummary = {
        id: `semantic-verification-${this.clock.now().toISOString()}`,
        featureId: input.featureId,
        status,
        deterministicFindings,
        reviewerFindings,
        evidencePaths: [evidencePacketPath],
        waiverReason: status === "waived" ? input.waiverReason : undefined,
        approvedBy: status === "waived" ? input.approvedBy ?? "unspecified" : undefined,
        createdAt: this.clock.now().toISOString()
      };
      const summaryPath = await this.workflow.appendSemanticVerification(summary);
      if (status === "waived") {
        await this.workflow.appendWaiver({
          id: `waiver-${this.clock.now().toISOString()}`,
          gateId: "semantic-verification",
          featureId: input.featureId,
          reason: input.waiverReason!,
          approvedBy: input.approvedBy ?? "unspecified",
          createdAt: this.clock.now().toISOString()
        });
      }

      if (status === "failed") {
        await this.workflow.updateStep("semantic-verification", {
          status: "blocked",
          featureId: input.featureId,
          evidence: [summaryPath, evidencePacketPath],
          blockers: blocking.map((finding) => `${finding.id}: ${finding.summary}`)
        });
        throw new GateError(`Hard gate: semantic verification failed: ${blocking.map((finding) => finding.summary).join("; ")}`);
      }

      await this.workflow.updateStep("semantic-verification", {
        status: status === "waived" ? "waived" : "complete",
        featureId: input.featureId,
        evidence: [summaryPath, evidencePacketPath],
        waiver: status === "waived"
          ? {
              reason: input.waiverReason ?? "unspecified",
              approvedBy: input.approvedBy ?? "unspecified",
              createdAt: this.clock.now().toISOString()
            }
          : undefined
      });
      await this.workflow.updateStep("review-subagent-recommendations", { status: "ready", featureId: input.featureId });

      return {
        result: { status, path: summaryPath },
        outputs: { status, summaryPath, evidencePacketPath }
      };
    });
  }

  private async context(featureId: string, contract: SemanticContract | undefined): Promise<Record<string, string | undefined>> {
    const featureFiles = await this.store.readFeatureFiles(featureId);
    const validationSummaries = await this.workflow.readArtifacts<ValidationSummary>("validation-summaries");
    return {
      "semantic-contract.json": contract === undefined ? undefined : JSON.stringify(contract, null, 2),
      [`specs/${featureId}/requirements.md`]: featureFiles.requirements,
      [`specs/${featureId}/plan.md`]: featureFiles.plan,
      [`specs/${featureId}/validation.md`]: featureFiles.validation,
      [`specs/${featureId}/experience.md`]: await this.store.readFeatureExperience(featureId),
      [`specs/${featureId}/semantics.md`]: (await this.store.readFeatureSemanticFiles(featureId)).markdown,
      [`.sdd/implementation-packets/${featureId}.md`]: await this.readOptional(path.join(this.projectRoot, ".sdd", "implementation-packets", `${featureId}.md`)),
      ".sdd/validation-summaries.jsonl": validationSummaries.map((summary) => JSON.stringify(summary)).join("\n"),
      ".sdd/task-groups.jsonl": (await this.workflow.readArtifacts<TaskGroupProgress>("task-groups")).map((summary) => JSON.stringify(summary)).join("\n"),
      ".sdd/telemetry.jsonl": await this.readOptional(path.join(this.projectRoot, ".sdd", "telemetry.jsonl")),
      ".sdd/evidence.jsonl": await this.readOptional(path.join(this.projectRoot, ".sdd", "evidence.jsonl")),
      ...(await this.sourceSnapshotContext()),
      ...(await this.evidenceFileContext(featureId))
    };
  }

  private async traceabilityFindings(featureId: string, contract: SemanticContract | undefined, context: Record<string, string | undefined>): Promise<SemanticVerificationFinding[]> {
    if (contract === undefined) {
      return [deterministicFinding("det-semantic-contract-missing", "semantic.contract", "blocking", "Semantic contract is missing.", [`.sdd/semantic-contracts/${featureId}.json`], "Run sdd feature semantics before semantic verification.")];
    }
    const findings: SemanticVerificationFinding[] = [];
    const validationSummaries = await this.workflow.readArtifacts<ValidationSummary>("validation-summaries");
    const taskGroups = await this.workflow.readArtifacts<TaskGroupProgress>("task-groups");
    const taskEvidence = taskGroups.filter((progress) => progress.featureId === featureId && (progress.implementationEvidence.length > 0 || progress.testEvidence.length > 0));
    const latestTaskEvidence = taskEvidence
      .map((progress) => progress.completedAt)
      .sort((left, right) => right.localeCompare(left))[0];
    const freshValidationSummaries = validationSummaries.filter((summary) => summary.featureId === featureId && summary.passed && (latestTaskEvidence === undefined || summary.createdAt >= latestTaskEvidence));
    if (taskEvidence.length === 0) {
      findings.push(deterministicFinding("det-implementation-evidence", "implementation", "blocking", "No task-group implementation or test evidence is recorded for this feature.", [".sdd/task-groups.jsonl"], "Complete at least one planned task group with implementation and test evidence before semantic verification."));
    }
    if (freshValidationSummaries.length === 0) {
      findings.push(deterministicFinding("det-validation-summary", "validation", "blocking", "No passing validation summary exists after the latest task evidence for this feature.", [".sdd/validation-summaries.jsonl", ".sdd/task-groups.jsonl"], "Run sdd feature run-validation after recording task-group evidence."));
    }
    for (const scenario of contract.scenarios) {
      for (const evidence of scenario.evidence.filter((item) => item.required)) {
        if (!(await this.evidenceExists(evidence, context, freshValidationSummaries))) {
          findings.push(deterministicFinding(`det-${scenario.id}-${evidence.id}`, scenario.id, "blocking", `Required semantic evidence is missing: ${evidence.kind} ${evidence.ref}.`, [evidence.ref], "Add the required test/evidence or update the semantic contract."));
        }
      }
    }
    for (const invariant of contract.invariants) {
      for (const evidence of invariant.evidence.filter((item) => item.required)) {
        if (!(await this.evidenceExists(evidence, context, freshValidationSummaries))) {
          findings.push(deterministicFinding(`det-${invariant.id}-${evidence.id}`, invariant.id, "blocking", `Required invariant evidence is missing: ${evidence.kind} ${evidence.ref}.`, [evidence.ref], "Add invariant test evidence or update the semantic contract."));
        }
      }
    }
    return findings;
  }

  private async evidenceExists(evidence: SemanticEvidenceRequirement, context: Record<string, string | undefined>, validationSummaries: readonly ValidationSummary[]): Promise<boolean> {
    if (evidence.ref.trim().length === 0 || /^TODO\b/i.test(evidence.ref)) {
      return false;
    }
    if (evidence.kind === "database-evidence") {
      return validationSummaries.some((summary) => summary.testDatabaseCopy !== undefined) || await this.fs.exists(path.resolve(this.projectRoot, evidence.ref));
    }
    if (evidence.kind === "telemetry-evidence") {
      return structuredTelemetryEvidenceMatches(
        evidence.ref,
        context[".sdd/telemetry.jsonl"],
        context[".sdd/evidence.jsonl"]
      );
    }
    if (evidence.kind === "manual-review" || evidence.kind === "model-falsification") {
      return true;
    }
    const fileRef = evidence.ref.split("::")[0]!.trim();
    const exists = await this.fs.exists(path.resolve(this.projectRoot, fileRef));
    if (evidence.kind === "playwright-flow" || evidence.kind === "e2e-test") {
      return exists && validationSummaries.some((summary) => summary.passed && summary.commands.some((command) => /\b(playwright|test:e2e|e2e)\b/i.test(command)));
    }
    if (evidence.kind === "unit-test" || evidence.kind === "integration-test") {
      return exists && validationSummaries.some((summary) => summary.passed && summary.commands.some((command) => /\b(test|vitest|jest|node --test)\b/i.test(command)));
    }
    return exists;
  }

  private async architectureFindings(): Promise<SemanticVerificationFinding[]> {
    return (await evaluateArchitecturePolicy(this.fs, this.projectRoot)).map((finding) => deterministicFinding(
      finding.id,
      finding.id,
      finding.severity,
      finding.summary,
      finding.evidenceRefs,
      finding.requiredFix
    ));
  }

  private async writeEvidencePacket(featureId: string, context: Record<string, string | undefined>): Promise<string> {
    const outputPath = path.join(this.projectRoot, ".sdd", "semantic", featureId, "evidence-packet.md");
    const content = `# Semantic Evidence Packet

Feature: ${featureId}

${Object.entries(context).map(([file, value]) => `## ${file}

${value?.trim() || "Not found."}`).join("\n\n")}
`;
    await this.fs.writeFile(outputPath, content);
    return outputPath;
  }

  private async readOptional(filePath: string): Promise<string | undefined> {
    return (await this.fs.exists(filePath)) ? this.fs.readFile(filePath) : undefined;
  }

  private async sourceSnapshotContext(): Promise<Record<string, string | undefined>> {
    if (!(await this.git.isRepository())) {
      return {
        "source/changed-files.txt": "No git repository detected; source context is inferred from task-group and validation evidence files."
      };
    }
    return {
      "git/changed-files.txt": (await this.git.changedFiles()).join("\n") || "No changed files reported by git status.",
      "git/diff.patch": await this.git.diff() ?? "No git diff available."
    };
  }

  private async evidenceFileContext(featureId: string): Promise<Record<string, string | undefined>> {
    const context: Record<string, string | undefined> = {};
    const taskGroups = await this.workflow.readArtifacts<TaskGroupProgress>("task-groups");
    const validationSummaries = await this.workflow.readArtifacts<ValidationSummary>("validation-summaries");
    const refs = new Set<string>();
    for (const progress of taskGroups.filter((item) => item.featureId === featureId)) {
      for (const ref of [...progress.implementationEvidence, ...progress.testEvidence]) {
        refs.add(ref.split("::")[0]!.trim());
      }
    }
    for (const summary of validationSummaries.filter((item) => item.featureId === featureId)) {
      for (const item of summary.evidence) {
        if (item.path !== undefined) refs.add(item.path);
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
}

function normalizeReviewerFinding(finding: SemanticVerificationFinding): SemanticVerificationFinding {
  if (finding.severity === "blocking" && finding.evidenceRefs.length === 0) {
    return {
      ...finding,
      severity: "warning",
      summary: `Uncited blocking finding downgraded: ${finding.summary}`,
      requiredFix: finding.requiredFix || "Add concrete evidence citations before this can block completion."
    };
  }
  return finding;
}

function renderVerifierPrompt(dimension: SemanticVerificationDimension, context: Record<string, string | undefined>): string {
  return `# Semantic Verification

Dimension: ${dimension}

Try to disprove the semantic contract. A blocking finding must cite a semantic claim and concrete source, test, or evidence path. Do not mark uncited concerns as blocking.

Return JSON with:

{
  "findings": [
    {
      "id": "finding-id",
      "claimId": "SCN-001",
      "severity": "info|warning|blocking",
      "summary": "what is wrong",
      "evidenceRefs": ["path-or-claim"],
      "requiredFix": "specific fix"
    }
  ]
}

${Object.entries(context).map(([file, value]) => `## Context: ${file}

${value?.trim() || "Not found."}`).join("\n\n")}
`;
}
