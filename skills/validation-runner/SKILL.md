---
name: validation-runner
description: "Run SDD validation for a feature or project, collect command evidence, enforce UI Playwright coverage, and record telemetry. Use after implementation and before deep review, changelog, or merge."
---

# Validation Runner

Render and follow the canonical prompt:

```bash
sdd prompt render --id feature.validation --feature "<feature-id>"
sdd feature run-validation --feature "<feature-id>"
```

The CLI discovers `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build` when present. Use repeated `--command "<cmd>"` flags to override. Feature validation requires at least one command and the feature must already be implemented. UI-related feature specs require `experience.md` with every `FLOW-*` mapped to an existing Playwright test file/title, plus a real Playwright command such as `playwright test`, `npx playwright test`, or an npm script that invokes one. Use `playwright test --reporter=json`; mapped titles must appear as passed or expected tests in JSON reporter output by default. Title-only stdout is accepted only with `--compat-playwright`. Validation also scans discovered routes/screens/forms and component-level forms/actions, then blocks likely user workflows that are missing from `experience.md`, unless the feature marks them out of scope by route, component path, or component name.

Any validation that can mutate data must pass `--test-database "<path>"` so validation records an isolated database copy and injects it into commands through `DATABASE_URL`/`SDD_TEST_DATABASE` or `--test-database-env`, or configure `.sdd/database-sandbox.json` for command-backed database sandboxes. This applies to UI, CLI, API, and database work. Use `.sdd/database-mutation-verifier.json` whenever expected mutations are declared in requirements, validation text, `experience.md`, or semantic scenarios.
