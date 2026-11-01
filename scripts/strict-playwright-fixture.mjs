import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const initSqlJs = require("sql.js");
const sqlJsPackage = require.resolve("sql.js");
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sddBin = path.join(repoRoot, "dist", "bin", "sdd.js");
const playwrightCli = path.join(repoRoot, "node_modules", "@playwright", "test", "cli.js");
const playwrightPackage = path.join(repoRoot, "node_modules", "@playwright", "test");

const projectRoot = await mkdtemp(path.join(os.tmpdir(), "sdd-strict-playwright-"));
let keepProject = true;

try {
  await execFileAsync("git", ["init"], { cwd: projectRoot });
  await write("specs/roadmap.md", "# Roadmap\n\n## Phase 1: Feedback\n\n- [ ] Build feedback form\n");
  await runSdd(["workflow", "branch", "--purpose", "feature", "--name", "Feedback", "--allow-dirty"]);
  await runSdd([
    "questions", "capture",
    "--workflow", "feature-spec",
    "--output", "feature-questions.json",
    "--answer", "scope=Build a browser feedback form that writes to a database",
    "--answer", "decisions=Use a real Playwright browser run with a copied SQLite file",
    "--answer", "context=The feedback route persists submitted messages",
    "--answer", "experience=## Experience Flows\n\n### FLOW-001: Submit feedback\n\n- Role: Signed-in customer\n- Route or Screen: /feedback\n- Happy Path: User submits feedback through the browser form\n- Edge Cases:\n  - Validation error\n- Data Setup: Seed signed-in customer\n- Database Mutations: Insert feedback row in the test database\n- Expected Visible Outcome: Confirmation appears\n- Playwright: tests/e2e/feedback.spec.js::submits feedback form"
  ]);
  await runSdd(["feature", "create", "--questions", "feature-questions.json"]);

  const metadata = JSON.parse(await read(".sdd/metadata.json"));
  const featureId = Object.keys(metadata.features)[0];
  if (featureId === undefined) {
    throw new Error("Fixture feature was not created.");
  }

  await runSdd([
    "questions", "capture",
    "--workflow", "semantic-contract",
    "--output", "semantics-questions.json",
    "--answer", "actors=Signed-in customer",
    "--answer", "outcomes=Feedback submission confirms visibly and persists a row",
    "--answer", "entities=Feedback",
    "--answer", "commands=SubmitFeedback",
    "--answer", "states=draft -> submitted",
    "--answer", "invariants=Submissions write only to the copied test database",
    "--answer", "scenarios=Submit feedback through FLOW-001: open /feedback -> trigger validation error -> submit valid feedback -> assert confirmation",
    "--answer", "oracles=Playwright JSON reporter and database-copy proof",
    "--answer", "data=Insert feedback row in the test database",
    "--answer", "telemetry=feature run-validation",
    "--answer", "architecture=Browser QA and DB sandboxing remain adapter-owned"
  ]);
  await runSdd(["feature", "semantics", "--feature", featureId, "--questions", "semantics-questions.json"]);
  await runSdd(["feature", "validate-spec", "--feature", featureId]);
  await runSdd(["feature", "approve", "--feature", featureId, "--reviewer", "Fixture"]);
  await runSdd(["feature", "plan-tdd", "--feature", featureId]);
  await runSdd(["feature", "implement", "--feature", featureId]);

  await writeAppFixture();
  const taskEvidence = "tests/e2e/feedback.spec.js::group-1-tests-first::VAL-001::submits feedback form";
  await runSdd([
    "feature", "record-tdd",
    "--feature", featureId,
    "--task-group", "group-1-tests-first",
    "--phase", "red",
    "--evidence", taskEvidence,
    "--command", "node -e \"process.exit(1)\""
  ]);
  await runSdd([
    "feature", "record-tdd",
    "--feature", featureId,
    "--task-group", "group-1-tests-first",
    "--phase", "green",
    "--evidence", taskEvidence,
    "--command", "node -e \"process.exit(0)\""
  ]);
  await runSdd([
    "feature", "complete-task-group",
    "--feature", featureId,
    "--task-group", "group-1-tests-first",
    "--implementation-evidence", "scripts/server.cjs::group-1-tests-first::FLOW-001",
    "--test-evidence", taskEvidence
  ]);

  const originalBefore = await sha256("app.sqlite");
  await runSdd([
    "feature", "run-validation",
    "--feature", featureId,
    "--test-database", "app.sqlite",
    "--test-database-env", "DATABASE_URL",
    "--strict-playwright"
  ]);
  const originalAfter = await sha256("app.sqlite");
  if (originalBefore !== originalAfter) {
    throw new Error("Original database changed during strict fixture validation.");
  }
  const copyRows = await feedbackMessages(".sdd/test-db/app.sqlite.copy");
  if (!copyRows.includes("hello from playwright")) {
    throw new Error("Copied test database did not contain the expected feedback mutation.");
  }
  const validationSummaries = await read(".sdd/validation-summaries.jsonl");
  if (!validationSummaries.includes("database-mutation-verifier")) {
    throw new Error("Harness-level database mutation verifier evidence was not recorded.");
  }
  if (!validationSummaries.includes("expected-db-mutations")) {
    throw new Error("Expected database mutations evidence was not recorded.");
  }

  const telemetry = (await read(".sdd/telemetry.jsonl")).trim().split(/\r?\n/).map((line) => JSON.parse(line));
  if (!telemetry.some((event) => event.command === "feature run-validation" && event.status === "started")) {
    throw new Error("Validation started telemetry was not recorded.");
  }
  if (!telemetry.some((event) => event.command === "feature run-validation" && event.status === "succeeded")) {
    throw new Error("Validation succeeded telemetry was not recorded.");
  }

  keepProject = false;
  console.log(`Strict Playwright fixture passed for ${featureId}.`);
} finally {
  if (keepProject) {
    console.error(`Strict Playwright fixture retained at ${projectRoot}`);
  } else {
    await rm(projectRoot, { recursive: true, force: true });
  }
}

async function writeAppFixture() {
  await writeSqliteSeed("app.sqlite");
  await write("scripts/server.cjs", `const fs = require("fs");
const http = require("http");
const initSqlJs = require(${JSON.stringify(sqlJsPackage)});
const db = process.env.DATABASE_URL;
if (!db) {
  throw new Error("DATABASE_URL is required");
}
const sqlReady = initSqlJs();
const html = \`<!doctype html>
<html>
  <body>
    <main>
      <h1>Feedback</h1>
      <p id="error" hidden>Validation error</p>
      <p id="confirmation" hidden>Confirmation appears</p>
      <textarea aria-label="Message"></textarea>
      <button>Submit</button>
    </main>
    <script>
      document.querySelector("button").addEventListener("click", async () => {
        const message = document.querySelector("textarea").value;
        const response = await fetch("/feedback", { method: "POST", body: message });
        document.querySelector("#error").hidden = response.ok;
        document.querySelector("#confirmation").hidden = !response.ok;
      });
    </script>
  </body>
</html>\`;
const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/feedback") {
    response.writeHead(200, { "content-type": "text/html" });
    response.end(html);
    return;
  }
  if (request.method === "POST" && request.url === "/feedback") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", async () => {
      if (body.trim().length === 0) {
        response.writeHead(400);
        response.end("Validation error");
        return;
      }
      const SQL = await sqlReady;
      const database = new SQL.Database(fs.readFileSync(db));
      database.run("CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT NOT NULL)");
      database.run("INSERT INTO feedback (message) VALUES (?)", [body.trim()]);
      fs.writeFileSync(db, Buffer.from(database.export()));
      database.close();
      response.writeHead(200);
      response.end("Confirmation appears");
    });
    return;
  }
  response.writeHead(404);
  response.end("Not found");
});
server.listen(4173, "127.0.0.1");
`);
  await write("playwright.config.cjs", `module.exports = {
  testDir: "tests/e2e",
  reporter: "json",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command: "node scripts/server.cjs",
    url: "http://127.0.0.1:4173/feedback",
    reuseExistingServer: false,
    timeout: 30000
  }
};
`);
  await write("tests/e2e/feedback.spec.js", `const { expect, test } = require(${JSON.stringify(playwrightPackage)});

test("submits feedback form", async ({ page }) => {
  await page.goto("/feedback");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Validation error")).toBeVisible();
  await page.getByLabel("Message").fill("hello from playwright");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Confirmation appears")).toBeVisible();
});
`);
  await write("scripts/assert-db-mutations.cjs", `const fs = require("fs");
const initSqlJs = require(${JSON.stringify(sqlJsPackage)});
const expected = JSON.parse(fs.readFileSync(process.env.SDD_EXPECTED_MUTATIONS_FILE, "utf8"));
if (!expected.mutations.some((item) => item.includes("Insert feedback row"))) {
  console.error("Expected mutation contract was not passed to verifier");
  process.exit(2);
}
(async () => {
  const SQL = await initSqlJs();
  const database = new SQL.Database(fs.readFileSync(process.env.SDD_TEST_DATABASE));
  const rows = database.exec("SELECT message FROM feedback ORDER BY id");
  const messages = rows[0]?.values.map((row) => row[0]) ?? [];
  database.close();
  if (!messages.includes("hello from playwright")) {
    console.error("Expected feedback row was not written to test database copy");
    process.exit(3);
  }
  console.log("database mutation verified");
})();
`);
  await write(".sdd/database-mutation-verifier.json", JSON.stringify({
    commandTemplate: "node scripts/assert-db-mutations.cjs --expected {expectedMutationsFile}",
    timeoutMs: 600000
  }, null, 2));
  await write("package.json", JSON.stringify({
    scripts: {
      "test:e2e": `node "${playwrightCli}" test --reporter=json`
    },
    devDependencies: {
      "@playwright/test": "^1.60.0"
    }
  }, null, 2));
}

async function runSdd(args) {
  try {
    await execFileAsync(process.execPath, [sddBin, ...args, "--project", projectRoot], {
      cwd: projectRoot,
      maxBuffer: 20 * 1024 * 1024
    });
  } catch (error) {
    const stdout = error.stdout ?? "";
    const stderr = error.stderr ?? "";
    throw new Error(`sdd ${args.join(" ")} failed.\n${stdout}\n${stderr}`);
  }
}

async function write(relativePath, content) {
  const absolute = path.join(projectRoot, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
}

async function writeBinary(relativePath, content) {
  const absolute = path.join(projectRoot, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, content);
}

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

async function readBuffer(relativePath) {
  return readFile(path.join(projectRoot, relativePath));
}

async function sha256(relativePath) {
  return createHash("sha256").update(await readBuffer(relativePath)).digest("hex");
}

async function writeSqliteSeed(relativePath) {
  const SQL = await initSqlJs();
  const database = new SQL.Database();
  database.run("CREATE TABLE feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT NOT NULL)");
  database.run("INSERT INTO feedback (message) VALUES (?)", ["seed"]);
  await writeBinary(relativePath, Buffer.from(database.export()));
  database.close();
}

async function feedbackMessages(relativePath) {
  const SQL = await initSqlJs();
  const database = new SQL.Database(await readBuffer(relativePath));
  const rows = database.exec("SELECT message FROM feedback ORDER BY id");
  const messages = rows[0]?.values.map((row) => String(row[0])) ?? [];
  database.close();
  return messages;
}
