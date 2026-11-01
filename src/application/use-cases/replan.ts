import { ClockPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { traceUseCase } from "./common";
import { ValidationError } from "../../domain/errors";

export class ReplanUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly changeName: string; readonly reason: string; readonly impact: string; readonly updateStrategy?: string }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "replan create", input, async () => {
      if (input.changeName.trim().length === 0 || input.reason.trim().length === 0 || input.impact.trim().length === 0) {
        throw new ValidationError("Replanning requires changeName, reason, and impact.");
      }

      const content = `# Replan: ${input.changeName}

## Reason

${input.reason}

## Impact

${input.impact}

## Update Strategy

${input.updateStrategy ?? "Create a separate branch for constitution/spec changes, update impacted feature specs, then update code and validation evidence."}

## Hard Gates

- Keep constitution changes separate from feature implementation when practical.
- Update existing feature specs if the constitution changes their assumptions.
- Add or update tests before marking replanning complete.
`;
      const outputPath = await this.store.writeReplan(input.changeName, content);
      await this.workflow.updateStep("replanning", {
        status: "in_progress",
        evidence: [outputPath]
      });
      return { result: { path: outputPath }, outputs: { path: outputPath } };
    });
  }

  public async impact(input: { readonly changeName: string; readonly notes: string }): Promise<{ readonly impactedFeatures: readonly string[] }> {
    return traceUseCase(this.telemetry, this.clock, "replan impact", input, async () => {
      const metadata = await this.store.readMetadata();
      const tokens = tokenizeImpactText(`${input.changeName} ${input.notes}`);
      const featureMatches: { readonly featureId: string; readonly matchedTokens: readonly string[] }[] = [];
      for (const featureId of Object.keys(metadata.features)) {
        const featureText = await this.featureImpactText(featureId);
        const matchedTokens = tokens.filter((token) => featureText.includes(token));
        if (matchedTokens.length > 0) {
          featureMatches.push({ featureId, matchedTokens });
        }
      }
      const fallbackAll = featureMatches.length === 0;
      const impactedFeatures = fallbackAll
        ? Object.keys(metadata.features)
        : featureMatches.map((match) => match.featureId);
      for (const featureId of impactedFeatures) {
        await this.store.updateFeatureStatus(featureId, "needs_review");
      }
      await this.workflow.updateStep("replanning", {
        status: "complete",
        evidence: [
          `impact:${input.changeName}`,
          `impact:tokens:${tokens.join(",")}`,
          ...(fallbackAll
            ? ["impact:all:no-specific-match"]
            : featureMatches.map((match) => `impact:feature:${match.featureId}:tokens:${match.matchedTokens.join(",")}`)),
          ...impactedFeatures.map((featureId) => `feature:${featureId}:needs_review`)
        ]
      });
      return { result: { impactedFeatures }, outputs: { impactedFeatures } };
    });
  }

  private async featureImpactText(featureId: string): Promise<string> {
    const files = await this.store.readFeatureFiles(featureId);
    const experience = await this.store.readFeatureExperience(featureId);
    const semantics = await this.store.readFeatureSemanticFiles(featureId);
    return normalizeImpactText([
      files.requirements,
      files.plan,
      files.validation,
      experience,
      semantics.markdown,
      semantics.contract === undefined ? undefined : JSON.stringify(semantics.contract)
    ].filter((item): item is string => item !== undefined).join("\n"));
  }
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "all",
  "and",
  "any",
  "are",
  "because",
  "but",
  "change",
  "changes",
  "feature",
  "for",
  "from",
  "has",
  "have",
  "impact",
  "into",
  "must",
  "needs",
  "notes",
  "only",
  "should",
  "spec",
  "specs",
  "that",
  "the",
  "this",
  "update",
  "with"
]);

function tokenizeImpactText(text: string): readonly string[] {
  return Array.from(new Set(normalizeImpactText(text).split(/\s+/)
    .filter((token) => token.length >= 3 || ["api", "db", "ui"].includes(token))
    .filter((token) => !STOP_WORDS.has(token))))
    .sort();
}

function normalizeImpactText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
