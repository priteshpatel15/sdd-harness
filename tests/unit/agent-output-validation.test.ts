import { describe, expect, it } from "vitest";
import {
  parseReviewFindingsText,
  parseSemanticFindingsText
} from "../../src/domain/agent-output-validation";

describe("agent structured output validation", () => {
  it("rejects review findings with invalid severity or missing required fields", () => {
    const invalidSeverity = parseReviewFindingsText(JSON.stringify({
      findings: [{ id: "finding-1", severity: "critical", summary: "Bad", recommendation: "Fix it" }]
    }), "architecture");
    const missingRequired = parseReviewFindingsText(JSON.stringify({
      findings: [{ id: "finding-1", severity: "warning", summary: "Bad" }]
    }), "architecture");

    expect(invalidSeverity.valid).toBe(false);
    expect(invalidSeverity.error).toContain("invalid severity");
    expect(missingRequired.valid).toBe(false);
    expect(missingRequired.error).toContain("requires non-empty id, summary, and recommendation");
  });

  it("keeps plain-text review output as informational compatibility output", () => {
    const result = parseReviewFindingsText("Manual note from reviewer", "test-and-qa");

    expect(result.valid).toBe(true);
    expect(result.structured).toBe(false);
    expect(result.findings[0]?.severity).toBe("info");
  });

  it("rejects semantic findings with invalid severity, missing claimId, or non-array evidenceRefs", () => {
    const invalidSeverity = parseSemanticFindingsText(JSON.stringify({
      findings: [{ id: "finding-1", claimId: "SCN-001", severity: "critical", summary: "Bad", evidenceRefs: [], requiredFix: "Fix it" }]
    }), "product-correctness");
    const missingClaim = parseSemanticFindingsText(JSON.stringify({
      findings: [{ id: "finding-1", severity: "blocking", summary: "Bad", evidenceRefs: [], requiredFix: "Fix it" }]
    }), "product-correctness");
    const nonArrayEvidence = parseSemanticFindingsText(JSON.stringify({
      findings: [{ id: "finding-1", claimId: "SCN-001", severity: "warning", summary: "Bad", evidenceRefs: "spec.md", requiredFix: "Fix it" }]
    }), "product-correctness");

    expect(invalidSeverity.valid).toBe(false);
    expect(invalidSeverity.error).toContain("invalid severity");
    expect(missingClaim.valid).toBe(false);
    expect(missingClaim.error).toContain("claimId");
    expect(nonArrayEvidence.valid).toBe(false);
    expect(nonArrayEvidence.error).toContain("evidenceRefs");
  });
});
