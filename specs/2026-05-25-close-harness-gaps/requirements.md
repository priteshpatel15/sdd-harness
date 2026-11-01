# Requirements: Close Harness Gaps

## Scope

Close the identified harness gaps by making this repository dogfood SDD, tightening defaults, and expanding deterministic tests around stricter gates.

## Decisions

- Strict TDD is the default task-group completion path.
- Compatibility paths stay available only with explicit waiver reason and approver.
- Any expected data mutation requires isolated validation data, including non-UI work.
- Playwright JSON reporter output is required by default for mapped UI workflow execution proof.
- Semantic evidence refs must identify concrete files or exact structured telemetry events.
- Architecture policy remains deterministic and framework-neutral.

## Context

The harness already has Clean Architecture layers, CLI workflows, specs, semantic contracts, Playwright coverage checks, database sandbox adapters, and telemetry traces. The missing work is tightening defaults and dogfooding the artifacts.

## Experience Intent

No UI-facing experience and no data mutation in this repository feature; no experience.md required.

## Requirements

- **REQ-001:** Add canonical root SDD artifacts and a feature spec for this hardening work.
- **REQ-002:** Require command-backed red and green TDD evidence by default for task-group completion.
- **REQ-003:** Require isolated test data and mutation verification for all expected data mutations.
- **REQ-004:** Require Playwright JSON reporter execution proof for every mapped `FLOW-*` by default.
- **REQ-005:** Tighten generated spec, semantic, architecture, telemetry, docs, skills, and tests without breaking explicit compatibility workflows.
