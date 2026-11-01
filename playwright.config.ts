import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  testMatch: "**/*.pw.ts",
  reporter: "json",
  fullyParallel: false,
  timeout: 30_000
});
