import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

test("SDD harness exposes a Playwright validation command", async () => {
  const packageJson = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8")) as {
    readonly scripts?: Record<string, string>;
  };

  expect(packageJson.scripts?.["test:e2e"]).toContain("playwright test");
  expect(packageJson.scripts?.["test:strict-e2e-fixture"]).toContain("strict-playwright-fixture");
});
