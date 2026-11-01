import { defineConfig } from "vitest/config";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceRoot = path.resolve(
  ".sdd/evidence/2026-05-26-workflow-evidence-dashboard/group-1-tests-first"
);
mkdirSync(evidenceRoot, { recursive: true });

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.spec.ts",
      "tests/application/**/*.spec.ts",
      "tests/integration/**/*.spec.ts"
    ],
    reporters: ["default", "json"],
    outputFile: {
      json: path.join(evidenceRoot, "vitest-red-report.json")
    },
    testTimeout: 10_000,
    hookTimeout: 10_000,
    clearMocks: true,
    restoreMocks: true
  }
});
