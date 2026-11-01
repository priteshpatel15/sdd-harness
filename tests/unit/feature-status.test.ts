import { describe, expect, it } from "vitest";
import { canPlanImplementation, canRunFeatureValidation, canStartImplementation } from "../../src/domain/feature-status";

describe("feature status policy", () => {
  it("does not let draft or needs-review specs reach implementation or validation", () => {
    expect(canPlanImplementation("draft")).toBe(false);
    expect(canStartImplementation("needs_review")).toBe(false);
    expect(canRunFeatureValidation("draft")).toBe(false);
  });

  it("allows validation only after implementation has started", () => {
    expect(canStartImplementation("approved")).toBe(true);
    expect(canRunFeatureValidation("approved")).toBe(false);
    expect(canRunFeatureValidation("implemented")).toBe(true);
  });
});
