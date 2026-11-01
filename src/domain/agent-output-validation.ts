import {
  ReviewFinding,
  ReviewLens,
  SemanticVerificationDimension,
  SemanticVerificationFinding
} from "./models";

type Severity = "info" | "warning" | "blocking";

export interface FindingParseResult<TFinding> {
  readonly structured: boolean;
  readonly valid: boolean;
  readonly findings: readonly TFinding[];
  readonly error?: string;
}

const VALID_SEVERITIES = new Set<Severity>(["info", "warning", "blocking"]);

export function parseReviewFindingsText(stdout: string, lens: ReviewLens): FindingParseResult<ReviewFinding> {
  try {
    return parseReviewFindingsStructured(JSON.parse(stdout) as unknown, lens);
  } catch {
    const trimmed = stdout.trim();
    return {
      structured: false,
      valid: true,
      findings: trimmed.length === 0
        ? []
        : [{ id: `${lens}-stdout`, severity: "info", summary: trimmed, recommendation: "Review this subagent output manually." }]
    };
  }
}

export function parseReviewFindingsStructured(parsed: unknown, lens: ReviewLens): FindingParseResult<ReviewFinding> {
  const findings = findingsArray(parsed);
  if (findings === undefined) {
    return invalidStructured("Structured review output must be an object with a findings array.");
  }

  const parsedFindings: ReviewFinding[] = [];
  for (const [index, finding] of findings.entries()) {
    if (!isRecord(finding)) {
      return invalidStructured(`Review finding ${index + 1} must be an object.`);
    }
    const severity = severityValue(finding.severity);
    if (severity === undefined) {
      return invalidStructured(`Review finding ${index + 1} has invalid severity; expected info, warning, or blocking.`);
    }
    const id = requiredString(finding.id);
    const summary = requiredString(finding.summary);
    const recommendation = requiredString(finding.recommendation);
    if (id === undefined || summary === undefined || recommendation === undefined) {
      return invalidStructured(`Review finding ${index + 1} requires non-empty id, summary, and recommendation.`);
    }
    parsedFindings.push({
      id,
      severity,
      summary,
      recommendation,
      source: optionalString(finding.source),
      evidenceRefs: Array.isArray(finding.evidenceRefs) && finding.evidenceRefs.every((item) => typeof item === "string")
        ? finding.evidenceRefs
        : undefined
    });
  }

  return { structured: true, valid: true, findings: parsedFindings };
}

export function invalidReviewFinding(lens: ReviewLens, message: string): ReviewFinding {
  return {
    id: `${lens}-invalid-structured-output`,
    severity: "blocking",
    summary: `Invalid structured review output: ${message}`,
    recommendation: "Return JSON as {\"findings\":[...]} with severity info, warning, or blocking and non-empty id, summary, and recommendation.",
    source: "review-agent"
  };
}

export function parseSemanticFindingsText(stdout: string, dimension: SemanticVerificationDimension): FindingParseResult<SemanticVerificationFinding> {
  try {
    return parseSemanticFindingsStructured(JSON.parse(stdout) as unknown, dimension);
  } catch {
    const trimmed = stdout.trim();
    return {
      structured: false,
      valid: true,
      findings: trimmed.length === 0
        ? []
        : [{
            id: `${dimension}-stdout`,
            claimId: dimension,
            dimension,
            severity: "info",
            summary: trimmed,
            evidenceRefs: [],
            requiredFix: "Review this verifier output manually."
          }]
    };
  }
}

export function parseSemanticFindingsStructured(parsed: unknown, dimension: SemanticVerificationDimension): FindingParseResult<SemanticVerificationFinding> {
  const findings = findingsArray(parsed);
  if (findings === undefined) {
    return invalidStructured("Structured semantic verifier output must be an object with a findings array.");
  }

  const parsedFindings: SemanticVerificationFinding[] = [];
  for (const [index, finding] of findings.entries()) {
    if (!isRecord(finding)) {
      return invalidStructured(`Semantic finding ${index + 1} must be an object.`);
    }
    const severity = severityValue(finding.severity);
    if (severity === undefined) {
      return invalidStructured(`Semantic finding ${index + 1} has invalid severity; expected info, warning, or blocking.`);
    }
    const id = requiredString(finding.id);
    const claimId = requiredString(finding.claimId);
    const summary = requiredString(finding.summary);
    const requiredFix = requiredString(finding.requiredFix);
    if (id === undefined || claimId === undefined || summary === undefined || requiredFix === undefined) {
      return invalidStructured(`Semantic finding ${index + 1} requires non-empty id, claimId, summary, and requiredFix.`);
    }
    if (!Array.isArray(finding.evidenceRefs) || !finding.evidenceRefs.every((item) => typeof item === "string")) {
      return invalidStructured(`Semantic finding ${index + 1} requires evidenceRefs as an array of strings.`);
    }
    parsedFindings.push({
      id,
      claimId,
      dimension,
      severity,
      summary,
      evidenceRefs: finding.evidenceRefs,
      requiredFix,
      source: optionalString(finding.source)
    });
  }

  return { structured: true, valid: true, findings: parsedFindings };
}

export function invalidSemanticFinding(dimension: SemanticVerificationDimension, message: string): SemanticVerificationFinding {
  return {
    id: `${dimension}-invalid-structured-output`,
    claimId: dimension,
    dimension,
    severity: "blocking",
    summary: `Invalid structured semantic verifier output: ${message}`,
    evidenceRefs: ["semantic-verifier-output"],
    requiredFix: "Return JSON as {\"findings\":[...]} with severity info, warning, or blocking; non-empty id, claimId, summary, requiredFix; and evidenceRefs as an array.",
    source: "semantic-verifier"
  };
}

function invalidStructured<TFinding>(error: string): FindingParseResult<TFinding> {
  return { structured: true, valid: false, findings: [], error };
}

function findingsArray(parsed: unknown): readonly unknown[] | undefined {
  if (!isRecord(parsed)) {
    return undefined;
  }
  return Array.isArray(parsed.findings) ? parsed.findings : undefined;
}

function severityValue(value: unknown): Severity | undefined {
  return typeof value === "string" && VALID_SEVERITIES.has(value as Severity) ? value as Severity : undefined;
}

function requiredString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
