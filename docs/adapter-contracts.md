# Adapter Contracts

SDD adapters sit outside the application use cases and implement ports from `src/application/ports.ts`. Adapters may call the filesystem, shell, browsers, databases, or provider CLIs; domain and application code must depend only on ports.

## General Rules

- Return deterministic structured data to use cases; put process output in evidence files when it is useful for audit.
- Treat non-zero command exits, malformed JSON, missing files, and stale configuration as hard adapter failures unless the caller explicitly exposes a compatibility mode.
- Resolve command-template placeholders with shell quoting through `renderCommandTemplate`.
- Write command evidence under `.sdd/evidence/` with command, stdout, stderr, and any important input artifact paths.
- Preserve original project data. Data-changing validation must mutate only the isolated test database copy or configured sandbox.
- Do not import sibling adapters except through `src/adapters/commands` or another explicit shared adapter utility.

## Command Templates

Command-backed adapters accept templates in `.sdd/*.json` files. Supported placeholders are adapter-specific and are always shell-quoted.

| Config | Required field | Placeholders | Success |
| --- | --- | --- | --- |
| `.sdd/user-question-adapter.json` | `commandTemplate` | `workflow`, `promptId`, `promptHash`, `questionsFile` | Prints grouped question JSON. |
| `.sdd/review-agents.json` | `commandTemplate` | `featureId`, `lens`, `promptFile`, `projectRoot` | Prints review findings JSON. |
| `.sdd/semantic-verifiers.json` | `commandTemplate` | `featureId`, `dimension`, `promptFile`, `projectRoot` | Prints semantic findings JSON. |
| `.sdd/database-sandbox.json` | `prepareCommand` | none | Prints sandbox database URL/path on stdout. |
| `.sdd/database-mutation-verifier.json` | `commandTemplate` | `expectedMutationsFile`, `originalDatabase`, `testDatabase`, `projectRoot` | Exits `0` only when expected mutations are present. |
| `.sdd/ui-inventory.json` | `commandTemplate` | `projectRoot` | Prints UI inventory JSON. |

Every command config may include `timeoutMs` when the adapter supports long-running work. Database sandbox config may also include `databaseUrlEnv` and `cleanupCommand`.

## Agent Provider Commands

`.sdd/agents.json` stores Codex or Claude command templates. `sdd agent doctor --provider <provider>` verifies that the provider CLI is on `PATH`, that the provider has a config entry, and that the orchestrator can resolve draft, review, implementation, and repair templates. Repair reuses the implementation command template with phase `repair`.

Provider templates may use these placeholders:

| Placeholder | Meaning |
| --- | --- |
| `{projectRoot}` | Project directory passed to the command. |
| `{promptFile}` | Prompt packet written under `.sdd/agent-runs/*/prompt.md`. |
| `{schemaFile}` | JSON schema file for draft/review commands when applicable. |
| `{outputFile}` | Expected structured JSON output path. |
| `{purpose}` | Draft purpose such as `feature`, `semantic`, or `review`. |
| `{phase}` | Implementation phase: `red`, `green`, `refactor`, or `repair`. |
| `{featureId}` | Current feature id. |
| `{taskGroup}` | Current TDD task group or failed gate id. |
| `{lens}` | Review lens or semantic dimension. |

## UI Inventory

`.sdd/ui-inventory.json` augments static route/component discovery:

```json
{
  "commandTemplate": "node scripts/ui-inventory.js --project {projectRoot}",
  "timeoutMs": 600000
}
```

The command must print JSON:

```json
{
  "routes": ["/dashboard"],
  "forms": [{ "route": "/feedback", "path": "src/routes/feedback.tsx" }],
  "componentForms": [{ "path": "src/components/FeedbackForm.tsx", "name": "FeedbackForm", "route": "/feedback" }],
  "componentActions": [{ "path": "src/components/Nav.tsx", "name": "Nav", "route": "/settings" }]
}
```

Malformed JSON or a non-zero exit blocks UI validation. Discovered workflows must be represented by `FLOW-*` entries in `experience.md` or explicitly listed as out of scope.

## Database Validation

Data-changing work is detected from requirements, validation text, semantic contracts, and `Database Mutations:` fields. Validation must use one of:

- `--test-database <path>`, which copies the source file to `.sdd/test-db/<name>.copy` and exposes it through `DATABASE_URL` or `--test-database-env`.
- `.sdd/database-sandbox.json`, whose `prepareCommand` prints a sandbox database URL/path and whose optional `cleanupCommand` tears it down.

When expected mutations exist, `.sdd/database-mutation-verifier.json` is required. The verifier receives:

- `SDD_ORIGINAL_DATABASE`
- `SDD_TEST_DATABASE`
- `SDD_EXPECTED_MUTATIONS_FILE`

It must exit `0` only after proving the isolated test database contains the declared mutations. The harness separately hashes the original database and fails validation if the original changes.

## Compatibility Modes

- `--compat-tdd` allows legacy task completion without command-backed red/green records only with `--waiver-reason` and `--approved-by`.
- `--compat-playwright` allows title-only Playwright stdout when JSON reporter output is unavailable.

Compatibility modes are waivers, not defaults. Strict paths must remain command-backed and evidence-backed.
