import { FeatureSpecStatus } from "./models";

export function canPlanImplementation(status: FeatureSpecStatus): boolean {
  return status === "approved" || status === "implemented";
}

export function canStartImplementation(status: FeatureSpecStatus): boolean {
  return status === "approved" || status === "implemented";
}

export function canRunFeatureValidation(status: FeatureSpecStatus): boolean {
  return status === "implemented" || status === "validated";
}

export function canCompleteFeature(status: FeatureSpecStatus): boolean {
  return status === "validated" || status === "merged";
}
