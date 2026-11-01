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
