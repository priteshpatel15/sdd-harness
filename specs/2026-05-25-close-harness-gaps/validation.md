# Validation: Close Harness Gaps

## Automated

- **VAL-001:** Root SDD artifacts exist and feature specs validate. Command: `npm test -- tests/e2e/cli-workflow.test.ts`.
- **VAL-002:** Strict TDD default blocks task completion without command-backed red and green records and accepts explicit compatibility waivers. Command: `npm test -- tests/e2e/cli-workflow.test.ts`.
- **VAL-003:** Non-UI data mutations require `--test-database` or `.sdd/database-sandbox.json`, require mutation verifier config for expected mutations, and fail if the original database changes. Command: `npm test -- tests/e2e/cli-workflow.test.ts`.
- **VAL-004:** Mapped Playwright flows require passed test titles from JSON reporter output by default and allow title-only stdout only with `--compat-playwright`. Command: `npm test -- tests/e2e/cli-workflow.test.ts`.
- **VAL-005:** Semantic contract validation rejects vague evidence refs and raw telemetry file refs. Command: `npm test -- tests/unit/semantic-validation.test.ts`.
- **VAL-006:** Architecture policy flags oversized adapters, mixed use-case helpers, direct process usage, and adapter-to-adapter coupling. Command: `npm test -- tests/unit/architecture-policy.test.ts`.
- **VAL-007:** Full QA passes. Command: `npm run typecheck && npm test && npm run build && npm run qa`.

## Manual

- Review changed files for Clean Architecture, SOLID boundaries, plug-and-play adapters, and explicit telemetry expectations.

## Definition Of Done

- All automated checks pass.
- Compatibility escape hatches require explicit waiver evidence and approver.
- Documentation, skills, prompt catalog, and root SDD artifacts describe the stricter defaults.
