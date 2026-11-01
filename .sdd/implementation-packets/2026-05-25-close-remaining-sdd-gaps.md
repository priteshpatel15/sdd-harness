# Implementation Packet

Feature: 2026-05-25-close-remaining-sdd-gaps
Task group: remaining task groups

## Required Inputs

Read and follow:

- `requirements.md`
- `plan.md`
- `validation.md`
- `specs/mission.md`
- `specs/tech-stack.md`

## Hard Gates

- Implement tests before or with production code.
- Do not mark tasks complete without validation evidence.
- Add Playwright workflow coverage for UI work.
- Use an isolated test database copy for data-changing UI workflows.
- Emit telemetry and evidence under `.sdd/`.

## Current Spec

# Requirements: Close Remaining SDD Gaps

## Scope

Close the remaining SDD harness gaps found in the implementation audit: evidence correctness, stricter UI/data/TDD contracts, adapter replaceability, real SQLite validation proof, telemetry evidence completeness, and SOLID module boundaries.

## Decisions

- Keep production database validation adapter-agnostic.
- Use `sql.js` only in tests and fixture scripts.
- Keep CLI command names stable.
- Add `.sdd/ui-inventory.json` as an optional command-backed UI inventory adapter.
- Treat compatibility flags as explicit waivers, not defaults.

## Context

The harness already enforces approval freshness, TDD, Playwright JSON proof, database copies, deep review, semantic verification, and telemetry. The missing work is tightening edge contracts and reducing outer-layer module size so adapters are easier to replace.

## Experience Intent

No UI-facing experience; no experience.md required.

## Requirements

- **REQ-001:** Approval evidence tests must verify persisted `fileHashes` and require at least one SHA-256 hash.
- **REQ-002:** UI `FLOW-*` entries must declare `Database Mutations`; read-only flows must say `None`.
- **REQ-003:** Strict task completion must tie final test evidence to the same test file used by the recorded red/green TDD pair.
- **REQ-004:** Adapter contracts must document command templates, JSON shapes, env vars, evidence, failures, and compatibility behavior.
- **REQ-005:** UI inventory can be supplied by `.sdd/ui-inventory.json`, and failed or malformed inventory commands must block validation.
- **REQ-006:** Command-backed adapters should share execution/evidence utilities instead of duplicating shell handling.
- **REQ-007:** Oversized adapter/interface modules should be split below deterministic architecture warning thresholds.
- **REQ-008:** At least one validation path must mutate a real SQLite test copy while proving the original database stays unchanged.
- **REQ-009:** Successful artifact-writing commands should emit useful file evidence in telemetry.


# Plan: Close Remaining SDD Gaps

## 1. Contract Regressions

Group ID: `group-1-contract-regressions`

1. [x] Fix approval hash evidence tests. (Requirements: REQ-001; Validation: VAL-001)
2. [x] Require `Database Mutations` in UI flows. (Requirements: REQ-002; Validation: VAL-001)
3. [x] Tie strict task completion evidence to recorded red/green test files. (Requirements: REQ-003; Validation: VAL-002)

## 2. Adapter Replaceability

Group ID: `group-2-adapter-replaceability`

1. [x] Document adapter contracts and command-backed configuration. (Requirements: REQ-004; Validation: VAL-003)
2. [x] Add command-backed UI inventory discovery. (Requirements: REQ-005; Validation: VAL-002)
3. [x] Add shared command execution/evidence utilities. (Requirements: REQ-006; Validation: VAL-004)
4. [x] Split oversized browser, spec-store, and CLI modules. (Requirements: REQ-007; Validation: VAL-004)

## 3. Data And Telemetry Proof

Group ID: `group-3-data-telemetry-proof`

1. [x] Add real SQLite copy mutation coverage in the CLI test suite. (Requirements: REQ-008; Validation: VAL-002)
2. [x] Update the strict Playwright fixture to use a real SQLite database copy. (Requirements: REQ-008; Validation: VAL-005)
3. [x] Emit file evidence from artifact-writing telemetry outputs. (Requirements: REQ-009; Validation: VAL-001)
4. [x] Mark roadmap adapter replaceability complete after tests pass. (Requirements: REQ-004, REQ-006, REQ-007; Validation: VAL-006)


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

