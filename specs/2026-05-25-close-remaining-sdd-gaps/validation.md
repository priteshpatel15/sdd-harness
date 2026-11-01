# Validation: Close Remaining SDD Gaps

## Automated

- **VAL-001:** Unit tests prove approval hash, experience validation, and telemetry evidence behavior. Command: `npm test -- tests/feature.test.ts tests/unit/spec-validation.test.ts tests/unit/telemetry-evidence.test.ts`.
- **VAL-002:** CLI workflow e2e tests prove strict TDD evidence matching, UI inventory command behavior, and real SQLite isolated mutation validation. Command: `npm test -- tests/e2e/cli-workflow.test.ts tests/unit/experience-coverage.test.ts`.
- **VAL-003:** Adapter contracts are documented. Command: `test -s docs/adapter-contracts.md`.
- **VAL-004:** Typecheck and deterministic architecture policy prove module boundaries and split outer modules. Command: `npm run typecheck && npm test -- tests/unit/architecture-policy.test.ts`.
- **VAL-005:** Strict Playwright fixture proves real browser JSON evidence and real SQLite copy mutation. Command: `npm run test:strict-e2e-fixture`.
- **VAL-006:** Full QA passes. Command: `npm run typecheck && npm test && npm run build && npm run test:e2e && npm run test:strict-e2e-fixture && npm run qa`.

## Manual

- **VAL-007:** Review the changed adapter contracts, public config shapes, and roadmap updates for compatibility.

## Definition Of Done

- Contract regression tests fail before the fix and pass after.
- Data-changing validation mutates only the copied SQLite database.
- The original database hash remains unchanged during validation.
- Oversized module warnings are cleared for the touched browser/spec-store/CLI surfaces.
- Phase 2 roadmap items are checked complete.
