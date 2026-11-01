# Validate Not Lied To

Prompt ID: feature.deep-review
Feature: 2026-05-25-close-harness-gaps
Review Lens: test-and-qa

## Core Instruction

Do a deep review using independent review agents. Check architecture, spec alignment, tests/QA, and experience/Playwright coverage. Report anything that does not make sense or could be better.

## Required Context Files

- specs/<feature>/*.md
- .sdd/implementation-packets/<feature>.md
- .sdd/validation-summaries.jsonl

## Required Grouped Questions

- None

## Files The Agent May Write

- .sdd/reviews/<feature>/*.json
- .sdd/reviews/<feature>/*.md

## Hard Gates

- All required review lenses must complete unless explicitly waived.

## Expected Command

```bash
sdd feature deep-review --feature <feature-id>
```

## Rendered Context

## Context: specs/mission.md

# Mission

Build a portable SDD Harness that turns approved intent into enforceable CLI gates, durable evidence, telemetry, and local validation.

## Target Audience

- Developers and technical leads who use AI coding agents and need command-backed proof that changes match approved specs.

## Stakeholder Inputs

# SDD Harness

The SDD Harness is a TypeScript CLI that enforces spec-driven development with persisted evidence. It keeps product intent, feature requirements, task groups, validation, semantic contracts, review findings, telemetry, and completion gates in versionable files.

## Intent

This repository is the reference implementation of the SDD workflow. It should dogfood the same process it enforces for downstream projects:

- Capture intent before writing specs.
- Approve specs before implementation.
- Complete task groups with command-backed red and green TDD evidence by default.
- Validate every data mutation against an isolated test database copy.
- Prove UI workflows through Playwright JSON reporter evidence.
- Keep domain, application, adapter, and interface boundaries decoupled.
- Emit structured telemetry for every major CLI workflow command.

## Common Commands

```bash
npm run typecheck
npm test
npm run build
npm run qa
```

## CLI Defaults

- `sdd feature complete-task-group` requires command-backed red and green records from `sdd feature record-tdd` unless `--compat-tdd --waiver-reason ... --approved-by ...` is used.
- `sdd feature run-validation` requires Playwright JSON reporter evidence for mapped UI flows unless `--compat-playwright` is used.
- Any expected data mutation requires `--test-database` or `.sdd/database-sandbox.json`; expected mutation semantics also require `.sdd/database-mutation-verifier.json`.

## Architecture

The code follows Clean Architecture:

- `src/domain`: pure policy, models, parsing, validation, and workflow rules.
- `src/application`: use cases and ports.
- `src/adapters`: filesystem, git, command runners, Playwright, database sandboxing, telemetry, and spec persistence.
- `src/interfaces`: CLI entrypoint and context wiring.

See `docs/architecture.md` for implementation details.

## What Success Looks Like

- The product solves the stated JTBD problem for the target audience.
- The implementation remains understandable, maintainable, testable, and safe to evolve.
- The validation plan can prove the delivered behavior matches the specification.

## Context: specs/tech-stack.md

# Tech Stack

TypeScript on Node.js, Clean Architecture, Vitest for unit/integration/e2e tests, Playwright JSON evidence for UI workflows, JSONL telemetry, and local command-backed adapters.

## Existing Project Signals

Scripts: build, typecheck, test, test:watch, test:e2e, test:strict-e2e-fixture, qa
Dev dependencies: @playwright/test, @types/node, tsx, typescript, vitest

## Architecture Standards

- Use Clean Architecture boundaries for domain, application, adapters, and interfaces.
- Apply SOLID principles within modules and classes.
- Keep dependencies pointing inward; framework code belongs in adapters or interfaces.
- Preserve decoupling so workflows can run through CLI, skills, ACP, or MCP adapters.

## Testing And QA

- Use test-driven development for domain functions, classes, modules, and workflows.
- Add integration tests for persistence, adapters, and CLI behavior.
- Add Playwright end-to-end coverage for any UI workflow.
- Run UI tests against an isolated copy of the real database when data modifications are involved.
- Emit telemetry for commands, decisions, gates, evidence, failures, and waivers.

## Context: specs/roadmap.md

# Roadmap

## Phase 1: Close Harness Gaps

**Goal:** Replace hand-seeded evidence with CLI-generated dogfood artifacts and strict quality gates.

- [ ] Generate questions, semantics, approvals, TDD, validation, review, changelog, roadmap, and completion evidence
- [ ] Keep strict doctor green with local deterministic adapters

## Phase 2: Adapter Replaceability

**Goal:** Keep SDD enforcement portable across CLI, skills, and future integrations.

- [ ] Continue extracting reusable adapter utilities behind ports
- [ ] Document compatibility contracts for adapter authors

## Context: .sdd/validation-summaries.jsonl

{"id":"validation-close-harness-gaps","featureId":"2026-05-25-close-harness-gaps","passed":true,"commands":["npm run typecheck","npm test","npm run build","npm run qa","npm run test:strict-e2e-fixture"],"evidence":[{"id":"evidence-close-harness-gaps-qa","kind":"manual","path":".sdd/checkpoints.jsonl","summary":"Full QA and strict Playwright fixture passed for close-harness-gaps implementation.","passed":true,"createdAt":"2026-05-25T22:02:00.000Z"}],"databaseSandboxEvidence":[],"createdAt":"2026-05-25T22:02:00.000Z"}
{"id":"validation-2026-05-25T22:24:47.829Z","featureId":"2026-05-25-close-harness-gaps","passed":true,"commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"evidence":[{"id":"evidence-1","kind":"command","path":".sdd/evidence/1779747869755-npm-run-typecheck.log","summary":"npm run typecheck passed.","passed":true,"createdAt":"2026-05-25T22:24:29.756Z"},{"id":"evidence-2","kind":"command","path":".sdd/evidence/1779747883290-npm-test.log","summary":"npm test passed.","passed":true,"createdAt":"2026-05-25T22:24:43.290Z"},{"id":"evidence-3","kind":"command","path":".sdd/evidence/1779747887827-npm-run-test-strict-e2e-fixture.log","summary":"npm run test:strict-e2e-fixture passed.","passed":true,"createdAt":"2026-05-25T22:24:47.827Z"}],"databaseSandboxEvidence":[],"createdAt":"2026-05-25T22:24:47.829Z"}
{"id":"validation-2026-05-25T22:26:28.706Z","featureId":"2026-05-25-close-harness-gaps","passed":true,"commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"evidence":[{"id":"evidence-1","kind":"command","path":".sdd/evidence/1779747970517-npm-run-typecheck.log","summary":"npm run typecheck passed.","passed":true,"createdAt":"2026-05-25T22:26:10.517Z"},{"id":"evidence-2","kind":"command","path":".sdd/evidence/1779747984451-npm-test.log","summary":"npm test passed.","passed":true,"createdAt":"2026-05-25T22:26:24.451Z"},{"id":"evidence-3","kind":"command","path":".sdd/evidence/1779747988704-npm-run-test-strict-e2e-fixture.log","summary":"npm run test:strict-e2e-fixture passed.","passed":true,"createdAt":"2026-05-25T22:26:28.704Z"}],"databaseSandboxEvidence":[],"createdAt":"2026-05-25T22:26:28.706Z"}

## Context: .sdd/task-groups.jsonl

{"id":"task-group-2026-05-25T22:22:28.884Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"completedAt":"2026-05-25T22:22:28.884Z"}
{"id":"task-group-2026-05-25T22:22:32.599Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"completedAt":"2026-05-25T22:22:32.599Z"}
{"id":"task-group-2026-05-25T22:22:36.133Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"completedAt":"2026-05-25T22:22:36.133Z"}
{"id":"task-group-2026-05-25T22:23:17.123Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"completedAt":"2026-05-25T22:23:17.123Z"}
{"id":"task-group-2026-05-25T22:23:20.744Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"completedAt":"2026-05-25T22:23:20.744Z"}
{"id":"task-group-2026-05-25T22:23:24.757Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"completedAt":"2026-05-25T22:23:24.757Z"}
{"id":"task-group-2026-05-25T22:25:52.276Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"completedAt":"2026-05-25T22:25:52.276Z"}
{"id":"task-group-2026-05-25T22:25:56.237Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"completedAt":"2026-05-25T22:25:56.237Z"}
{"id":"task-group-2026-05-25T22:26:00.058Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"completedAt":"2026-05-25T22:26:00.058Z"}

## Context: CHANGELOG.md

# Changelog

## 2026-05-25

- Added canonical root SDD artifacts for the harness.
- Hardened the intended workflow around strict TDD, isolated data mutation validation, Playwright JSON reporter evidence, semantic evidence refs, architecture policy, and telemetry expectations.
- Documented explicit compatibility paths for legacy TDD and Playwright evidence.

## Context: specs/2026-05-25-close-harness-gaps/requirements.md

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

## Context: specs/2026-05-25-close-harness-gaps/plan.md

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

## Context: specs/2026-05-25-close-harness-gaps/validation.md

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

## Context: specs/2026-05-25-close-harness-gaps/experience.md

Not found.

## Context: specs/2026-05-25-close-harness-gaps/semantics.md

# Semantics: 2026-05-25-close-harness-gaps

Source Hash: 43f8af828ea4e7f8fa26f2b439586eed74f5a7ebef6f535d86b1cb2a58748bb8

## Actors

- **ACT-001:** Maintainer: approve specs, run gates, review evidence Permissions: approve specs, run gates, review evidence

## Outcomes

- The close-harness-gaps feature has approved semantic contracts, strict command-backed TDD records, completed task groups, validation summaries, deep review, semantic verification, review decisions, changelog, roadmap evidence, and completion telemetry.

## Entities

- **ENT-001:** Feature Spec States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged
- **ENT-002:** Semantic Contract States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged
- **ENT-003:** TDD Evidence States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged
- **ENT-004:** Task Group Progress States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged
- **ENT-005:** Validation Summary States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged
- **ENT-006:** Review Summary States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged
- **ENT-007:** Review Decision States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged
- **ENT-008:** Roadmap Update States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged
- **ENT-009:** Waiver States: draft -> approved, approved -> implemented, implemented -> validated, validated -> merged

## Commands

- **CMD-001:** questions capture Actors: ACT-001 Entities: ENT-001
- **CMD-002:** feature semantics Actors: ACT-001 Entities: ENT-001
- **CMD-003:** feature validate-spec Actors: ACT-001 Entities: ENT-001
- **CMD-004:** feature approve Actors: ACT-001 Entities: ENT-001
- **CMD-005:** feature plan-tdd Actors: ACT-001 Entities: ENT-001
- **CMD-006:** feature implement Actors: ACT-001 Entities: ENT-001
- **CMD-007:** feature record-tdd Actors: ACT-001 Entities: ENT-001
- **CMD-008:** feature complete-task-group Actors: ACT-001 Entities: ENT-001
- **CMD-009:** feature run-validation Actors: ACT-001 Entities: ENT-001
- **CMD-010:** feature deep-review Actors: ACT-001 Entities: ENT-001
- **CMD-011:** feature semantic-verify Actors: ACT-001 Entities: ENT-001
- **CMD-012:** feature review-decisions Actors: ACT-001 Entities: ENT-001
- **CMD-013:** changelog update Actors: ACT-001 Entities: ENT-001
- **CMD-014:** feature complete Actors: ACT-001 Entities: ENT-001

## State Transitions

- **TRN-001:** ENT-001 draft -> approved via semantic contract
- **TRN-002:** ENT-001 approved -> implemented via semantic contract
- **TRN-003:** ENT-001 implemented -> validated via semantic contract
- **TRN-004:** ENT-001 validated -> merged via semantic contract

## Invariants

- **INV-001:** No implementation/task-group completion without current feature approval Severity: blocking. Methods: unit-test, telemetry-evidence
- **INV-002:** Strict task groups require red and green command-backed TDD records Severity: blocking. Methods: unit-test, telemetry-evidence
- **INV-003:** Validation must run after task evidence before completion Severity: blocking. Methods: unit-test, telemetry-evidence
- **INV-004:** Review, semantic verification, review decisions, changelog, and roadmap evidence must exist before completion Severity: blocking. Methods: unit-test, telemetry-evidence
- **INV-005:** Local adapters must stay outside domain/application logic Severity: blocking. Methods: unit-test, telemetry-evidence

## Oracles

- **ORC-001:** workflow doctor --strict passes Methods: unit-test, telemetry-evidence
- **ORC-002:** feature validation commands pass Methods: unit-test, telemetry-evidence
- **ORC-003:** semantic verification passes without blocking findings Methods: unit-test, telemetry-evidence
- **ORC-004:** feature complete succeeds only after task, validation, review, semantic, decision, changelog, and roadmap evidence Methods: unit-test, telemetry-evidence

## Scenarios

### SCN-001: Complete dogfood evidence

- Actors: ACT-001
- Preconditions: none
- Steps: capture questions; generate semantic contract; approve current hashes; record strict TDD; complete task groups; run validation; complete feature
- Expected Visible Outcome: none
- Expected Data Mutations: none
- Expected Telemetry: feature complete-task-group; feature run-validation; feature deep-review; feature semantic-verify
- Experience Flows: none
- Oracles: ORC-001
- Evidence: EVD-TST-001:unit-test:tests/feature.test.ts; EVD-TEL-001:telemetry-evidence:feature complete-task-group; EVD-TEL-001:telemetry-evidence:feature run-validation; EVD-TEL-001:telemetry-evidence:feature deep-review; EVD-TEL-001:telemetry-evidence:feature semantic-verify

### SCN-002: Verify readiness

- Actors: ACT-001
- Preconditions: none
- Steps: add local configs; run strict doctor; confirm every readiness check passes
- Expected Visible Outcome: none
- Expected Data Mutations: none
- Expected Telemetry: feature complete-task-group; feature run-validation; feature deep-review; feature semantic-verify
- Experience Flows: none
- Oracles: ORC-002
- Evidence: EVD-TST-002:unit-test:tests/feature.test.ts; EVD-TEL-002:telemetry-evidence:feature complete-task-group; EVD-TEL-002:telemetry-evidence:feature run-validation; EVD-TEL-002:telemetry-evidence:feature deep-review; EVD-TEL-002:telemetry-evidence:feature semantic-verify

## Architecture Claims

- **ARCH-001:** Domain/application code remains provider-agnostic Method: static-rule
- **ARCH-002:** local command scripts are adapter/test-fixture concerns Method: static-rule
- **ARCH-003:** no provider-specific logic is added to domain or application layers Method: static-rule

## Telemetry

- feature complete-task-group
- feature run-validation
- feature deep-review
- feature semantic-verify

## Context: .sdd/semantic-contracts/2026-05-25-close-harness-gaps.json

{
  "version": 1,
  "featureId": "2026-05-25-close-harness-gaps",
  "sourceHash": "43f8af828ea4e7f8fa26f2b439586eed74f5a7ebef6f535d86b1cb2a58748bb8",
  "createdAt": "2026-05-25T22:25:39.831Z",
  "actors": [
    {
      "id": "ACT-001",
      "name": "Maintainer: approve specs, run gates, review evidence",
      "permissions": [
        "approve specs",
        "run gates",
        "review evidence"
      ]
    }
  ],
  "outcomes": [
    "The close-harness-gaps feature has approved semantic contracts, strict command-backed TDD records, completed task groups, validation summaries, deep review, semantic verification, review decisions, changelog, roadmap evidence, and completion telemetry."
  ],
  "entities": [
    {
      "id": "ENT-001",
      "name": "Feature Spec",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    },
    {
      "id": "ENT-002",
      "name": "Semantic Contract",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    },
    {
      "id": "ENT-003",
      "name": "TDD Evidence",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    },
    {
      "id": "ENT-004",
      "name": "Task Group Progress",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    },
    {
      "id": "ENT-005",
      "name": "Validation Summary",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    },
    {
      "id": "ENT-006",
      "name": "Review Summary",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    },
    {
      "id": "ENT-007",
      "name": "Review Decision",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    },
    {
      "id": "ENT-008",
      "name": "Roadmap Update",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    },
    {
      "id": "ENT-009",
      "name": "Waiver",
      "states": [
        "draft -> approved",
        "approved -> implemented",
        "implemented -> validated",
        "validated -> merged"
      ]
    }
  ],
  "commands": [
    {
      "id": "CMD-001",
      "name": "questions capture",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-002",
      "name": "feature semantics",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-003",
      "name": "feature validate-spec",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-004",
      "name": "feature approve",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-005",
      "name": "feature plan-tdd",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-006",
      "name": "feature implement",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-007",
      "name": "feature record-tdd",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-008",
      "name": "feature complete-task-group",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-009",
      "name": "feature run-validation",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-010",
      "name": "feature deep-review",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-011",
      "name": "feature semantic-verify",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-012",
      "name": "feature review-decisions",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-013",
      "name": "changelog update",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    },
    {
      "id": "CMD-014",
      "name": "feature complete",
      "actorIds": [
        "ACT-001"
      ],
      "entityIds": [
        "ENT-001"
      ]
    }
  ],
  "transitions": [
    {
      "id": "TRN-001",
      "entityId": "ENT-001",
      "from": "draft",
      "to": "approved",
      "trigger": "semantic contract"
    },
    {
      "id": "TRN-002",
      "entityId": "ENT-001",
      "from": "approved",
      "to": "implemented",
      "trigger": "semantic contract"
    },
    {
      "id": "TRN-003",
      "entityId": "ENT-001",
      "from": "implemented",
      "to": "validated",
      "trigger": "semantic contract"
    },
    {
      "id": "TRN-004",
      "entityId": "ENT-001",
      "from": "validated",
      "to": "merged",
      "trigger": "semantic contract"
    }
  ],
  "invariants": [
    {
      "id": "INV-001",
      "statement": "No implementation/task-group completion without current feature approval",
      "severity": "blocking",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ],
      "evidence": [
        {
          "id": "INV-1-EVD-1",
          "kind": "unit-test",
          "ref": "tests/feature.test.ts",
          "required": true
        },
        {
          "id": "INV-1-EVD-2",
          "kind": "telemetry-evidence",
          "ref": "feature complete-task-group",
          "required": true
        }
      ]
    },
    {
      "id": "INV-002",
      "statement": "Strict task groups require red and green command-backed TDD records",
      "severity": "blocking",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ],
      "evidence": [
        {
          "id": "INV-2-EVD-1",
          "kind": "unit-test",
          "ref": "tests/feature.test.ts",
          "required": true
        },
        {
          "id": "INV-2-EVD-2",
          "kind": "telemetry-evidence",
          "ref": "feature complete-task-group",
          "required": true
        }
      ]
    },
    {
      "id": "INV-003",
      "statement": "Validation must run after task evidence before completion",
      "severity": "blocking",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ],
      "evidence": [
        {
          "id": "INV-3-EVD-1",
          "kind": "unit-test",
          "ref": "tests/feature.test.ts",
          "required": true
        },
        {
          "id": "INV-3-EVD-2",
          "kind": "telemetry-evidence",
          "ref": "feature complete-task-group",
          "required": true
        }
      ]
    },
    {
      "id": "INV-004",
      "statement": "Review, semantic verification, review decisions, changelog, and roadmap evidence must exist before completion",
      "severity": "blocking",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ],
      "evidence": [
        {
          "id": "INV-4-EVD-1",
          "kind": "unit-test",
          "ref": "tests/feature.test.ts",
          "required": true
        },
        {
          "id": "INV-4-EVD-2",
          "kind": "telemetry-evidence",
          "ref": "feature complete-task-group",
          "required": true
        }
      ]
    },
    {
      "id": "INV-005",
      "statement": "Local adapters must stay outside domain/application logic",
      "severity": "blocking",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ],
      "evidence": [
        {
          "id": "INV-5-EVD-1",
          "kind": "unit-test",
          "ref": "tests/feature.test.ts",
          "required": true
        },
        {
          "id": "INV-5-EVD-2",
          "kind": "telemetry-evidence",
          "ref": "feature complete-task-group",
          "required": true
        }
      ]
    }
  ],
  "scenarios": [
    {
      "id": "SCN-001",
      "title": "Complete dogfood evidence",
      "actorIds": [
        "ACT-001"
      ],
      "preconditions": [],
      "steps": [
        "capture questions",
        "generate semantic contract",
        "approve current hashes",
        "record strict TDD",
        "complete task groups",
        "run validation",
        "complete feature"
      ],
      "expectedDataMutations": [
        "none"
      ],
      "expectedTelemetry": [
        "feature complete-task-group",
        "feature run-validation",
        "feature deep-review",
        "feature semantic-verify"
      ],
      "experienceFlowIds": [],
      "oracleIds": [
        "ORC-001"
      ],
      "evidence": [
        {
          "id": "EVD-TST-001",
          "kind": "unit-test",
          "ref": "tests/feature.test.ts",
          "required": true
        },
        {
          "id": "EVD-TEL-001",
          "kind": "telemetry-evidence",
          "ref": "feature complete-task-group",
          "required": true
        },
        {
          "id": "EVD-TEL-001",
          "kind": "telemetry-evidence",
          "ref": "feature run-validation",
          "required": true
        },
        {
          "id": "EVD-TEL-001",
          "kind": "telemetry-evidence",
          "ref": "feature deep-review",
          "required": true
        },
        {
          "id": "EVD-TEL-001",
          "kind": "telemetry-evidence",
          "ref": "feature semantic-verify",
          "required": true
        }
      ]
    },
    {
      "id": "SCN-002",
      "title": "Verify readiness",
      "actorIds": [
        "ACT-001"
      ],
      "preconditions": [],
      "steps": [
        "add local configs",
        "run strict doctor",
        "confirm every readiness check passes"
      ],
      "expectedDataMutations": [
        "none"
      ],
      "expectedTelemetry": [
        "feature complete-task-group",
        "feature run-validation",
        "feature deep-review",
        "feature semantic-verify"
      ],
      "experienceFlowIds": [],
      "oracleIds": [
        "ORC-002"
      ],
      "evidence": [
        {
          "id": "EVD-TST-002",
          "kind": "unit-test",
          "ref": "tests/feature.test.ts",
          "required": true
        },
        {
          "id": "EVD-TEL-002",
          "kind": "telemetry-evidence",
          "ref": "feature complete-task-group",
          "required": true
        },
        {
          "id": "EVD-TEL-002",
          "kind": "telemetry-evidence",
          "ref": "feature run-validation",
          "required": true
        },
        {
          "id": "EVD-TEL-002",
          "kind": "telemetry-evidence",
          "ref": "feature deep-review",
          "required": true
        },
        {
          "id": "EVD-TEL-002",
          "kind": "telemetry-evidence",
          "ref": "feature semantic-verify",
          "required": true
        }
      ]
    }
  ],
  "oracles": [
    {
      "id": "ORC-001",
      "statement": "workflow doctor --strict passes",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ]
    },
    {
      "id": "ORC-002",
      "statement": "feature validation commands pass",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ]
    },
    {
      "id": "ORC-003",
      "statement": "semantic verification passes without blocking findings",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ]
    },
    {
      "id": "ORC-004",
      "statement": "feature complete succeeds only after task, validation, review, semantic, decision, changelog, and roadmap evidence",
      "verificationMethods": [
        "unit-test",
        "telemetry-evidence"
      ]
    }
  ],
  "architectureClaims": [
    {
      "id": "ARCH-001",
      "statement": "Domain/application code remains provider-agnostic",
      "verificationMethod": "static-rule"
    },
    {
      "id": "ARCH-002",
      "statement": "local command scripts are adapter/test-fixture concerns",
      "verificationMethod": "static-rule"
    },
    {
      "id": "ARCH-003",
      "statement": "no provider-specific logic is added to domain or application layers",
      "verificationMethod": "static-rule"
    }
  ],
  "telemetryEvents": [
    "feature complete-task-group",
    "feature run-validation",
    "feature deep-review",
    "feature semantic-verify"
  ],
  "notApplicable": {}
}

## Context: .sdd/implementation-packets/2026-05-25-close-harness-gaps.md

# Implementation Packet

Feature: 2026-05-25-close-harness-gaps
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

## Context: source/changed-files.txt

No git repository detected; source context is inferred from task-group and validation evidence files.

## Context: evidence:.sdd/implementation-packets/2026-05-25-close-harness-gaps.md

# Implementation Packet

Feature: 2026-05-25-close-harness-gaps
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

## Context: evidence:tests/feature.test.ts

import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

describe("close harness gaps evidence", () => {
  const root = process.cwd();
  const featureId = "2026-05-25-close-harness-gaps";

  it("group-1-dogfood-artifacts keeps real spec and semantic artifacts", async () => {
    const contract = JSON.parse(await readFile(path.join(root, ".sdd", "semantic-contracts", `${featureId}.json`), "utf8")) as {
      readonly sourceHash?: string;
    };
    const semantics = await readFile(path.join(root, "specs", featureId, "semantics.md"), "utf8");

    expect(contract.sourceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(semantics).toContain(`# Semantics: ${featureId}`);
    expect(semantics).not.toContain("Source Hash: pending");
  });

  it("group-2-strict-gates has strict validation and local command-backed adapters", async () => {
    const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as {
      readonly scripts?: Record<string, string>;
    };
    const reviewAgents = JSON.parse(await readFile(path.join(root, ".sdd", "review-agents.json"), "utf8")) as {
      readonly commandTemplate?: string;
    };
    const semanticVerifiers = JSON.parse(await readFile(path.join(root, ".sdd", "semantic-verifiers.json"), "utf8")) as {
      readonly commandTemplate?: string;
    };
    const databaseVerifier = JSON.parse(await readFile(path.join(root, ".sdd", "database-mutation-verifier.json"), "utf8")) as {
      readonly commandTemplate?: string;
    };

    expect(packageJson.scripts?.["test:e2e"]).toContain("playwright test");
    expect(reviewAgents.commandTemplate).toContain("scripts/sdd-review-agent.mjs");
    expect(semanticVerifiers.commandTemplate).toContain("scripts/sdd-semantic-verifier.mjs");
    expect(databaseVerifier.commandTemplate).toContain("scripts/sdd-database-mutation-verifier.mjs");
  });

  it("group-3-quality-policies records current approvals with real SHA-256 hashes", async () => {
    const approvals = (await readFile(path.join(root, ".sdd", "approvals.jsonl"), "utf8"))
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line) as {
        readonly target?: string;
        readonly featureId?: string;
        readonly hashes?: Record<string, string>;
      })
      .filter((record) => record.target === "feature" && record.featureId === featureId);

    const latest = approvals.at(-1);
    expect(latest).toBeDefined();
    expect(Object.values(latest?.hashes ?? {}).every((hash) => /^[a-f0-9]{64}$/.test(hash))).toBe(true);
  });
});

## Context: evidence:.sdd/evidence/1779747869755-npm-run-typecheck.log

$ npm run typecheck

# stdout

> sdd-harness@0.1.0 typecheck
> tsc --noEmit



# stderr

## Context: evidence:.sdd/evidence/1779747883290-npm-test.log

$ npm test

# stdout

> sdd-harness@0.1.0 test
> vitest run


 RUN  v4.1.7 .


 Test Files  19 passed (19)
      Tests  133 passed (133)
   Start at  18:24:30
   Duration  13.10s (transform 1.55s, setup 0ms, import 2.07s, tests 13.02s, environment 2ms)



# stderr

## Context: evidence:.sdd/evidence/1779747887827-npm-run-test-strict-e2e-fixture.log

$ npm run test:strict-e2e-fixture

# stdout

> sdd-harness@0.1.0 test:strict-e2e-fixture
> npm run build && node scripts/strict-playwright-fixture.mjs


> sdd-harness@0.1.0 build
> tsc -p tsconfig.build.json

Strict Playwright fixture passed for 2026-05-25-feedback.


# stderr

## Context: evidence:.sdd/evidence/1779747970517-npm-run-typecheck.log

$ npm run typecheck

# stdout

> sdd-harness@0.1.0 typecheck
> tsc --noEmit



# stderr

## Context: evidence:.sdd/evidence/1779747984451-npm-test.log

$ npm test

# stdout

> sdd-harness@0.1.0 test
> vitest run


 RUN  v4.1.7 .


 Test Files  19 passed (19)
      Tests  133 passed (133)
   Start at  18:26:10
   Duration  13.49s (transform 1.83s, setup 0ms, import 2.32s, tests 13.44s, environment 1ms)



# stderr

## Context: evidence:.sdd/evidence/1779747988704-npm-run-test-strict-e2e-fixture.log

$ npm run test:strict-e2e-fixture

# stdout

> sdd-harness@0.1.0 test:strict-e2e-fixture
> npm run build && node scripts/strict-playwright-fixture.mjs


> sdd-harness@0.1.0 build
> tsc -p tsconfig.build.json

Strict Playwright fixture passed for 2026-05-25-feedback.


# stderr
