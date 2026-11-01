import { defineConfig, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const baseURL = process.env.APP_BASE_URL ?? "http://127.0.0.1:4174";
const serverPort = new URL(baseURL).port || "4174";
const evidenceRoot = path.resolve(
  ".sdd/evidence/2026-05-26-workflow-evidence-dashboard/group-1-tests-first"
);
const testDatabaseRoot = path.join(evidenceRoot, "test-db");
const browserHome = path.join(evidenceRoot, "browser-home");
const browserTmp = path.join(os.tmpdir(), "sdd-wed-browser-tmp");
mkdirSync(evidenceRoot, { recursive: true });
mkdirSync(browserHome, { recursive: true });
mkdirSync(browserTmp, { recursive: true });
process.env.TMPDIR = browserTmp;
process.env.TMP = browserTmp;
process.env.TEMP = browserTmp;
const browserEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
);

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: path.join(evidenceRoot, "playwright-artifacts"),
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: path.join(evidenceRoot, "playwright-red-report.json")
      }
    ]
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev:e2e",
    url: `${baseURL}/evidence`,
    timeout: 10_000,
    reuseExistingServer: false,
    env: {
      NODE_ENV: "test",
      PORT: serverPort,
      DATABASE_PATH: path.join(testDatabaseRoot, "e2e.sqlite"),
      TELEMETRY_PATH: path.join(evidenceRoot, "e2e-telemetry.jsonl")
    }
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        launchOptions: {
          args: ["--disable-crash-reporter"],
          env: {
            ...browserEnv,
            HOME: browserHome,
            TMPDIR: browserTmp,
            TMP: browserTmp,
            TEMP: browserTmp
          }
        }
      }
    }
  ]
});
