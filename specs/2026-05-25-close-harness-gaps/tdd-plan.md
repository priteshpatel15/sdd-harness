# TDD Plan

## Unit

- Write edge-case tests for pure domain functions before implementation.
- Cover invalid, empty, and boundary inputs.

## Class And Module

- Test each application use case through ports with fake adapters.
- Test adapter behavior against real temporary files or isolated services.

## Integration

- Run CLI workflows against a temporary project directory.
- Verify metadata, telemetry, and evidence artifacts are written.

## UI And E2E

- If this feature touches UI, add Playwright tests for all expected user workflows.
- If data changes occur, run against a copied test database.

## Spec Context

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

No UI-facing experience; no experience.md required.

## Requirements

- **REQ-001:** Add canonical root SDD artifacts and a feature spec for this hardening work.
- **REQ-002:** Require command-backed red and green TDD evidence by default for task-group completion.
- **REQ-003:** Require isolated test data and mutation verification for all expected data mutations.
- **REQ-004:** Require Playwright JSON reporter execution proof for every mapped `FLOW-*` by default.
- **REQ-005:** Tighten generated spec, semantic, architecture, telemetry, docs, skills, and tests without breaking explicit compatibility workflows.


# Plan: Close Harness Gaps

## 1. Dogfood Artifacts

Group ID: `group-1-dogfood-artifacts`

1. [ ] Add `README.md`, `CHANGELOG.md`, `specs/jtbd.md`, `specs/mission.md`, `specs/tech-stack.md`, and `specs/roadmap.md`. (Requirements: REQ-001; Validation: VAL-001)
2. [ ] Add this feature spec with requirements, plan, validation, and semantics. (Requirements: REQ-001; Validation: VAL-001)

## 2. Strict Gates

Group ID: `group-2-strict-gates`

1. [ ] Make task-group completion require command-backed red and green TDD evidence by default. (Requirements: REQ-002; Validation: VAL-002)
2. [ ] Extend data mutation detection and require isolated validation data for non-UI mutations. (Requirements: REQ-003; Validation: VAL-003)
3. [ ] Make Playwright JSON reporter evidence the default execution proof. (Requirements: REQ-004; Validation: VAL-004)

## 3. Quality Policies

Group ID: `group-3-quality-policies`

1. [ ] Tighten semantic evidence reference validation. (Requirements: REQ-005; Validation: VAL-005)
2. [ ] Expand deterministic architecture policy findings. (Requirements: REQ-005; Validation: VAL-006)
3. [ ] Update telemetry expectations, docs, skills, prompts, and test coverage. (Requirements: REQ-005; Validation: VAL-007)


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

