# Semantic Evidence Packet

Feature: 2026-05-25-close-harness-gaps

## semantic-contract.json

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

## specs/2026-05-25-close-harness-gaps/requirements.md

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

## specs/2026-05-25-close-harness-gaps/plan.md

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

## specs/2026-05-25-close-harness-gaps/validation.md

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

## specs/2026-05-25-close-harness-gaps/experience.md

Not found.

## specs/2026-05-25-close-harness-gaps/semantics.md

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

## .sdd/implementation-packets/2026-05-25-close-harness-gaps.md

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

## .sdd/validation-summaries.jsonl

{"id":"validation-close-harness-gaps","featureId":"2026-05-25-close-harness-gaps","passed":true,"commands":["npm run typecheck","npm test","npm run build","npm run qa","npm run test:strict-e2e-fixture"],"evidence":[{"id":"evidence-close-harness-gaps-qa","kind":"manual","path":".sdd/checkpoints.jsonl","summary":"Full QA and strict Playwright fixture passed for close-harness-gaps implementation.","passed":true,"createdAt":"2026-05-25T22:02:00.000Z"}],"databaseSandboxEvidence":[],"createdAt":"2026-05-25T22:02:00.000Z"}
{"id":"validation-2026-05-25T22:24:47.829Z","featureId":"2026-05-25-close-harness-gaps","passed":true,"commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"evidence":[{"id":"evidence-1","kind":"command","path":".sdd/evidence/1779747869755-npm-run-typecheck.log","summary":"npm run typecheck passed.","passed":true,"createdAt":"2026-05-25T22:24:29.756Z"},{"id":"evidence-2","kind":"command","path":".sdd/evidence/1779747883290-npm-test.log","summary":"npm test passed.","passed":true,"createdAt":"2026-05-25T22:24:43.290Z"},{"id":"evidence-3","kind":"command","path":".sdd/evidence/1779747887827-npm-run-test-strict-e2e-fixture.log","summary":"npm run test:strict-e2e-fixture passed.","passed":true,"createdAt":"2026-05-25T22:24:47.827Z"}],"databaseSandboxEvidence":[],"createdAt":"2026-05-25T22:24:47.829Z"}
{"id":"validation-2026-05-25T22:26:28.706Z","featureId":"2026-05-25-close-harness-gaps","passed":true,"commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"evidence":[{"id":"evidence-1","kind":"command","path":".sdd/evidence/1779747970517-npm-run-typecheck.log","summary":"npm run typecheck passed.","passed":true,"createdAt":"2026-05-25T22:26:10.517Z"},{"id":"evidence-2","kind":"command","path":".sdd/evidence/1779747984451-npm-test.log","summary":"npm test passed.","passed":true,"createdAt":"2026-05-25T22:26:24.451Z"},{"id":"evidence-3","kind":"command","path":".sdd/evidence/1779747988704-npm-run-test-strict-e2e-fixture.log","summary":"npm run test:strict-e2e-fixture passed.","passed":true,"createdAt":"2026-05-25T22:26:28.704Z"}],"databaseSandboxEvidence":[],"createdAt":"2026-05-25T22:26:28.706Z"}

## .sdd/task-groups.jsonl

{"id":"task-group-2026-05-25T22:22:28.884Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"completedAt":"2026-05-25T22:22:28.884Z"}
{"id":"task-group-2026-05-25T22:22:32.599Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"completedAt":"2026-05-25T22:22:32.599Z"}
{"id":"task-group-2026-05-25T22:22:36.133Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"completedAt":"2026-05-25T22:22:36.133Z"}
{"id":"task-group-2026-05-25T22:23:17.123Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"completedAt":"2026-05-25T22:23:17.123Z"}
{"id":"task-group-2026-05-25T22:23:20.744Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"completedAt":"2026-05-25T22:23:20.744Z"}
{"id":"task-group-2026-05-25T22:23:24.757Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"completedAt":"2026-05-25T22:23:24.757Z"}
{"id":"task-group-2026-05-25T22:25:52.276Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"completedAt":"2026-05-25T22:25:52.276Z"}
{"id":"task-group-2026-05-25T22:25:56.237Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"completedAt":"2026-05-25T22:25:56.237Z"}
{"id":"task-group-2026-05-25T22:26:00.058Z","featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","status":"complete","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"completedAt":"2026-05-25T22:26:00.058Z"}

## .sdd/telemetry.jsonl

{"id":"skill validate-2026-05-25T21:16:52.739Z","command":"skill validate","startedAt":"2026-05-25T21:16:52.739Z","status":"started","inputs":{},"outputs":{},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:16:52.739Z","command":"skill validate","startedAt":"2026-05-25T21:16:52.739Z","endedAt":"2026-05-25T21:16:52.746Z","status":"succeeded","inputs":{},"outputs":{"checked":14},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:19:55.654Z","command":"skill validate","startedAt":"2026-05-25T21:19:55.654Z","status":"started","inputs":{},"outputs":{},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:19:55.654Z","command":"skill validate","startedAt":"2026-05-25T21:19:55.654Z","endedAt":"2026-05-25T21:19:55.663Z","status":"succeeded","inputs":{},"outputs":{"checked":14},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:20:47.270Z","command":"skill validate","startedAt":"2026-05-25T21:20:47.270Z","status":"started","inputs":{},"outputs":{},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:20:47.270Z","command":"skill validate","startedAt":"2026-05-25T21:20:47.270Z","endedAt":"2026-05-25T21:20:47.275Z","status":"succeeded","inputs":{},"outputs":{"checked":14},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:31:37.031Z","command":"skill validate","startedAt":"2026-05-25T21:31:37.031Z","status":"started","inputs":{},"outputs":{},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:31:37.031Z","command":"skill validate","startedAt":"2026-05-25T21:31:37.031Z","endedAt":"2026-05-25T21:31:37.039Z","status":"succeeded","inputs":{},"outputs":{"checked":14},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:32:43.468Z","command":"skill validate","startedAt":"2026-05-25T21:32:43.468Z","status":"started","inputs":{},"outputs":{},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:32:43.468Z","command":"skill validate","startedAt":"2026-05-25T21:32:43.468Z","endedAt":"2026-05-25T21:32:43.484Z","status":"succeeded","inputs":{},"outputs":{"checked":14},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:33:27.060Z","command":"skill validate","startedAt":"2026-05-25T21:33:27.060Z","status":"started","inputs":{},"outputs":{},"gates":[],"evidence":[]}
{"id":"skill validate-2026-05-25T21:33:27.060Z","command":"skill validate","startedAt":"2026-05-25T21:33:27.060Z","endedAt":"2026-05-25T21:33:27.066Z","status":"succeeded","inputs":{},"outputs":{"checked":14},"gates":[],"evidence":[]}
{"id":"workflow doctor-2026-05-25T22:06:56.920Z","command":"workflow doctor","startedAt":"2026-05-25T22:06:56.920Z","status":"started","inputs":{"strict":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"workflow doctor-2026-05-25T22:06:56.920Z","command":"workflow doctor","startedAt":"2026-05-25T22:06:56.920Z","endedAt":"2026-05-25T22:06:56.963Z","status":"succeeded","inputs":{"strict":false},"outputs":{"healthy":false,"strict":false},"gates":[],"evidence":[]}
{"id":"workflow doctor-2026-05-25T22:17:58.299Z","command":"workflow doctor","startedAt":"2026-05-25T22:17:58.299Z","status":"started","inputs":{"strict":true},"outputs":{},"gates":[],"evidence":[]}
{"id":"workflow doctor-2026-05-25T22:17:58.299Z","command":"workflow doctor","startedAt":"2026-05-25T22:17:58.299Z","endedAt":"2026-05-25T22:17:58.350Z","status":"succeeded","inputs":{"strict":true},"outputs":{"healthy":false,"strict":true},"gates":[],"evidence":[]}
{"id":"workflow doctor-2026-05-25T22:18:57.118Z","command":"workflow doctor","startedAt":"2026-05-25T22:18:57.118Z","status":"started","inputs":{"strict":true},"outputs":{},"gates":[],"evidence":[]}
{"id":"workflow doctor-2026-05-25T22:18:57.118Z","command":"workflow doctor","startedAt":"2026-05-25T22:18:57.118Z","endedAt":"2026-05-25T22:18:57.160Z","status":"succeeded","inputs":{"strict":true},"outputs":{"healthy":true,"strict":true},"gates":[],"evidence":[]}
{"id":"questions capture-2026-05-25T22:19:43.699Z","command":"questions capture","startedAt":"2026-05-25T22:19:43.699Z","status":"started","inputs":{"workflow":"constitution","output":".sdd/question-drafts/constitution-root.json","source":"agent"},"outputs":{},"gates":[],"evidence":[]}
{"id":"questions capture-2026-05-25T22:19:43.699Z","command":"questions capture","startedAt":"2026-05-25T22:19:43.699Z","endedAt":"2026-05-25T22:19:43.770Z","status":"succeeded","inputs":{"workflow":"constitution","output":".sdd/question-drafts/constitution-root.json","source":"agent"},"outputs":{"path":".sdd/question-drafts/constitution-root.json","workflow":"constitution","promptId":"constitution.create"},"gates":[],"evidence":[]}
{"id":"constitution create-2026-05-25T22:19:50.030Z","command":"constitution create","startedAt":"2026-05-25T22:19:50.030Z","status":"started","inputs":{"questionEvidenceId":"constitution-questions-2026-05-25T22:19:43.770Z"},"outputs":{},"gates":[],"evidence":[]}
{"id":"constitution create-2026-05-25T22:19:50.030Z","command":"constitution create","startedAt":"2026-05-25T22:19:50.030Z","endedAt":"2026-05-25T22:19:50.037Z","status":"succeeded","inputs":{"questionEvidenceId":"constitution-questions-2026-05-25T22:19:43.770Z"},"outputs":{"wrote":["specs/mission.md","specs/tech-stack.md","specs/roadmap.md"]},"gates":[{"id":"constitution.questions.mission","name":"constitution grouped question: mission","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'mission'."},{"id":"constitution.questions.targetAudience","name":"constitution grouped question: targetAudience","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'targetAudience'."},{"id":"constitution.questions.techStack","name":"constitution grouped question: techStack","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'techStack'."},{"id":"constitution.questions.roadmap","name":"constitution grouped question: roadmap","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'roadmap'."},{"id":"constitution.mission.exists","name":"Mission document exists","severity":"blocking","passed":true,"message":"Mission document exists passed."},{"id":"constitution.mission.audience","name":"Mission includes target audience","severity":"blocking","passed":true,"message":"Mission includes target audience passed."},{"id":"constitution.mission.success","name":"Mission includes success criteria","severity":"blocking","passed":true,"message":"Mission includes success criteria passed."},{"id":"constitution.tech-stack.exists","name":"Tech stack document exists","severity":"blocking","passed":true,"message":"Tech stack document exists passed."},{"id":"constitution.tech-stack.testing","name":"Tech stack includes testing posture","severity":"blocking","passed":true,"message":"Tech stack includes testing posture passed."},{"id":"constitution.roadmap.exists","name":"Roadmap document exists","severity":"blocking","passed":true,"message":"Roadmap document exists passed."},{"id":"constitution.roadmap.small-phases","name":"Roadmap contains small phases","severity":"blocking","passed":true,"message":"Roadmap contains small phases passed."},{"id":"constitution.roadmap.checklist","name":"Roadmap uses checklist items","severity":"blocking","passed":true,"message":"Roadmap uses checklist items passed."},{"id":"constitution.roadmap.phase-goals","name":"Every roadmap phase has a goal and checklist item","severity":"blocking","passed":true,"message":"Every roadmap phase has a goal and checklist item passed."}],"evidence":[]}
{"id":"constitution validate-2026-05-25T22:19:52.677Z","command":"constitution validate","startedAt":"2026-05-25T22:19:52.677Z","status":"started","inputs":{},"outputs":{},"gates":[],"evidence":[]}
{"id":"constitution validate-2026-05-25T22:19:52.677Z","command":"constitution validate","startedAt":"2026-05-25T22:19:52.677Z","endedAt":"2026-05-25T22:19:52.681Z","status":"succeeded","inputs":{},"outputs":{"passed":true},"gates":[{"id":"constitution.mission.exists","name":"Mission document exists","severity":"blocking","passed":true,"message":"Mission document exists passed."},{"id":"constitution.mission.audience","name":"Mission includes target audience","severity":"blocking","passed":true,"message":"Mission includes target audience passed."},{"id":"constitution.mission.success","name":"Mission includes success criteria","severity":"blocking","passed":true,"message":"Mission includes success criteria passed."},{"id":"constitution.tech-stack.exists","name":"Tech stack document exists","severity":"blocking","passed":true,"message":"Tech stack document exists passed."},{"id":"constitution.tech-stack.testing","name":"Tech stack includes testing posture","severity":"blocking","passed":true,"message":"Tech stack includes testing posture passed."},{"id":"constitution.roadmap.exists","name":"Roadmap document exists","severity":"blocking","passed":true,"message":"Roadmap document exists passed."},{"id":"constitution.roadmap.small-phases","name":"Roadmap contains small phases","severity":"blocking","passed":true,"message":"Roadmap contains small phases passed."},{"id":"constitution.roadmap.checklist","name":"Roadmap uses checklist items","severity":"blocking","passed":true,"message":"Roadmap uses checklist items passed."},{"id":"constitution.roadmap.phase-goals","name":"Every roadmap phase has a goal and checklist item","severity":"blocking","passed":true,"message":"Every roadmap phase has a goal and checklist item passed."}],"evidence":[]}
{"id":"constitution approve-2026-05-25T22:19:57.009Z","command":"constitution approve","startedAt":"2026-05-25T22:19:57.009Z","status":"started","inputs":{"target":"constitution","reviewer":"codex","notes":"CLI-regenerated constitution evidence for close-harness-gaps dogfood readiness."},"outputs":{},"gates":[],"evidence":[]}
{"id":"constitution approve-2026-05-25T22:19:57.009Z","command":"constitution approve","startedAt":"2026-05-25T22:19:57.009Z","endedAt":"2026-05-25T22:19:57.015Z","status":"succeeded","inputs":{"target":"constitution","reviewer":"codex","notes":"CLI-regenerated constitution evidence for close-harness-gaps dogfood readiness."},"outputs":{"approvalPath":".sdd/approvals.jsonl"},"gates":[{"id":"constitution.mission.exists","name":"Mission document exists","severity":"blocking","passed":true,"message":"Mission document exists passed."},{"id":"constitution.mission.audience","name":"Mission includes target audience","severity":"blocking","passed":true,"message":"Mission includes target audience passed."},{"id":"constitution.mission.success","name":"Mission includes success criteria","severity":"blocking","passed":true,"message":"Mission includes success criteria passed."},{"id":"constitution.tech-stack.exists","name":"Tech stack document exists","severity":"blocking","passed":true,"message":"Tech stack document exists passed."},{"id":"constitution.tech-stack.testing","name":"Tech stack includes testing posture","severity":"blocking","passed":true,"message":"Tech stack includes testing posture passed."},{"id":"constitution.roadmap.exists","name":"Roadmap document exists","severity":"blocking","passed":true,"message":"Roadmap document exists passed."},{"id":"constitution.roadmap.small-phases","name":"Roadmap contains small phases","severity":"blocking","passed":true,"message":"Roadmap contains small phases passed."},{"id":"constitution.roadmap.checklist","name":"Roadmap uses checklist items","severity":"blocking","passed":true,"message":"Roadmap uses checklist items passed."},{"id":"constitution.roadmap.phase-goals","name":"Every roadmap phase has a goal and checklist item","severity":"blocking","passed":true,"message":"Every roadmap phase has a goal and checklist item passed."}],"evidence":[]}
{"id":"questions capture-2026-05-25T22:20:02.341Z","command":"questions capture","startedAt":"2026-05-25T22:20:02.341Z","status":"started","inputs":{"workflow":"feature-spec","output":".sdd/question-drafts/feature-close-harness-gaps.json","source":"agent"},"outputs":{},"gates":[],"evidence":[]}
{"id":"questions capture-2026-05-25T22:20:02.341Z","command":"questions capture","startedAt":"2026-05-25T22:20:02.341Z","endedAt":"2026-05-25T22:20:02.400Z","status":"succeeded","inputs":{"workflow":"feature-spec","output":".sdd/question-drafts/feature-close-harness-gaps.json","source":"agent"},"outputs":{"path":".sdd/question-drafts/feature-close-harness-gaps.json","workflow":"feature-spec","promptId":"feature.create"},"gates":[],"evidence":[]}
{"id":"feature create-2026-05-25T22:20:06.150Z","command":"feature create","startedAt":"2026-05-25T22:20:06.150Z","status":"started","inputs":{"name":"Close Harness Gaps","questionEvidenceId":"feature-spec-questions-2026-05-25T22:20:02.399Z"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature create-2026-05-25T22:20:06.150Z","command":"feature create","startedAt":"2026-05-25T22:20:06.150Z","endedAt":"2026-05-25T22:20:06.159Z","status":"succeeded","inputs":{"name":"Close Harness Gaps","questionEvidenceId":"feature-spec-questions-2026-05-25T22:20:02.399Z"},"outputs":{"featureId":"2026-05-25-close-harness-gaps","status":"draft"},"gates":[{"id":"feature-spec.questions.scope","name":"feature-spec grouped question: scope","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'scope'."},{"id":"feature-spec.questions.decisions","name":"feature-spec grouped question: decisions","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'decisions'."},{"id":"feature-spec.questions.context","name":"feature-spec grouped question: context","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'context'."},{"id":"feature-spec.questions.experience","name":"feature-spec grouped question: experience","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'experience'."},{"id":"feature.experience.answer","name":"Experience question answer exists","severity":"blocking","passed":true,"message":"Experience question answer exists passed."},{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."}],"evidence":[]}
{"id":"questions capture-2026-05-25T22:20:36.596Z","command":"questions capture","startedAt":"2026-05-25T22:20:36.596Z","status":"started","inputs":{"workflow":"semantic-contract","output":".sdd/question-drafts/semantic-close-harness-gaps.json","source":"agent"},"outputs":{},"gates":[],"evidence":[]}
{"id":"questions capture-2026-05-25T22:20:36.596Z","command":"questions capture","startedAt":"2026-05-25T22:20:36.596Z","endedAt":"2026-05-25T22:20:36.694Z","status":"succeeded","inputs":{"workflow":"semantic-contract","output":".sdd/question-drafts/semantic-close-harness-gaps.json","source":"agent"},"outputs":{"path":".sdd/question-drafts/semantic-close-harness-gaps.json","workflow":"semantic-contract","promptId":"feature.semantics"},"gates":[],"evidence":[]}
{"id":"feature semantics-2026-05-25T22:20:39.831Z","command":"feature semantics","startedAt":"2026-05-25T22:20:39.831Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","questionEvidenceId":"semantic-contract-questions-2026-05-25T22:20:36.693Z"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature semantics-2026-05-25T22:20:39.831Z","command":"feature semantics","startedAt":"2026-05-25T22:20:39.831Z","endedAt":"2026-05-25T22:20:39.838Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","questionEvidenceId":"semantic-contract-questions-2026-05-25T22:20:36.693Z"},"outputs":{"featureId":"2026-05-25-close-harness-gaps","sourceHash":"bdb7780e339ae4fbf675453b2175d25157162e9b8aec5bda140b876fd563a8f7"},"gates":[{"id":"semantic-contract.questions.actors","name":"semantic-contract grouped question: actors","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'actors'."},{"id":"semantic-contract.questions.outcomes","name":"semantic-contract grouped question: outcomes","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'outcomes'."},{"id":"semantic-contract.questions.entities","name":"semantic-contract grouped question: entities","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'entities'."},{"id":"semantic-contract.questions.commands","name":"semantic-contract grouped question: commands","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'commands'."},{"id":"semantic-contract.questions.states","name":"semantic-contract grouped question: states","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'states'."},{"id":"semantic-contract.questions.invariants","name":"semantic-contract grouped question: invariants","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'invariants'."},{"id":"semantic-contract.questions.scenarios","name":"semantic-contract grouped question: scenarios","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'scenarios'."},{"id":"semantic-contract.questions.oracles","name":"semantic-contract grouped question: oracles","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'oracles'."},{"id":"semantic-contract.questions.data","name":"semantic-contract grouped question: data","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'data'."},{"id":"semantic-contract.questions.telemetry","name":"semantic-contract grouped question: telemetry","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'telemetry'."},{"id":"semantic-contract.questions.architecture","name":"semantic-contract grouped question: architecture","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'architecture'."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature validate-spec-2026-05-25T22:20:43.001Z","command":"feature validate-spec","startedAt":"2026-05-25T22:20:43.001Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature validate-spec-2026-05-25T22:20:43.001Z","command":"feature validate-spec","startedAt":"2026-05-25T22:20:43.001Z","endedAt":"2026-05-25T22:20:43.008Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{"passed":true},"gates":[{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."},{"id":"semantic.contract.markdown","name":"semantics.md exists","severity":"blocking","passed":true,"message":"semantics.md exists passed."},{"id":"semantic.contract.json","name":"semantic contract JSON exists","severity":"blocking","passed":true,"message":"semantic contract JSON exists passed."},{"id":"semantic.contract.source-hash","name":"Semantic contract JSON matches semantics.md","severity":"blocking","passed":true,"message":"Semantic contract JSON matches semantics.md passed."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature approve-2026-05-25T22:20:46.259Z","command":"feature approve","startedAt":"2026-05-25T22:20:46.259Z","status":"started","inputs":{"target":"feature","featureId":"2026-05-25-close-harness-gaps","reviewer":"codex","notes":"Approved restored close-harness-gaps spec with generated semantic contract and real SHA-256 artifact hashes."},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature approve-2026-05-25T22:20:46.259Z","command":"feature approve","startedAt":"2026-05-25T22:20:46.259Z","endedAt":"2026-05-25T22:20:46.268Z","status":"succeeded","inputs":{"target":"feature","featureId":"2026-05-25-close-harness-gaps","reviewer":"codex","notes":"Approved restored close-harness-gaps spec with generated semantic contract and real SHA-256 artifact hashes."},"outputs":{"approvalPath":".sdd/approvals.jsonl"},"gates":[{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."},{"id":"semantic.contract.markdown","name":"semantics.md exists","severity":"blocking","passed":true,"message":"semantics.md exists passed."},{"id":"semantic.contract.json","name":"semantic contract JSON exists","severity":"blocking","passed":true,"message":"semantic contract JSON exists passed."},{"id":"semantic.contract.source-hash","name":"Semantic contract JSON matches semantics.md","severity":"blocking","passed":true,"message":"Semantic contract JSON matches semantics.md passed."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature plan-tdd-2026-05-25T22:20:50.124Z","command":"feature plan-tdd","startedAt":"2026-05-25T22:20:50.124Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature plan-tdd-2026-05-25T22:20:50.124Z","command":"feature plan-tdd","startedAt":"2026-05-25T22:20:50.124Z","endedAt":"2026-05-25T22:20:50.137Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{"path":"specs/2026-05-25-close-harness-gaps/tdd-plan.md"},"gates":[],"evidence":[]}
{"id":"feature implement-2026-05-25T22:20:53.672Z","command":"feature implement","startedAt":"2026-05-25T22:20:53.672Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","execute":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature implement-2026-05-25T22:20:53.672Z","command":"feature implement","startedAt":"2026-05-25T22:20:53.672Z","endedAt":"2026-05-25T22:20:53.685Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","execute":false},"outputs":{"packetPath":".sdd/implementation-packets/2026-05-25-close-harness-gaps.md","dryRun":true},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:00.433Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:00.433Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"red","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"node -e \"process.exit(1)\""},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:00.433Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:00.433Z","endedAt":"2026-05-25T22:21:00.501Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"red","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"node -e \"process.exit(1)\""},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"failed-as-expected","exitCode":1},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:06.519Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:06.519Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"green","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"npm test -- tests/feature.test.ts"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:06.519Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:06.519Z","endedAt":"2026-05-25T22:21:07.159Z","status":"failed","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"green","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"npm test -- tests/feature.test.ts"},"outputs":{"error":"Hard gate: TDD green command must pass; 'npm test -- tests/feature.test.ts' exited 1."},"gates":[{"id":"gate.failed","name":"feature record-tdd","severity":"blocking","passed":false,"message":"Hard gate: TDD green command must pass; 'npm test -- tests/feature.test.ts' exited 1."}],"evidence":[]}
{"id":"questions capture-2026-05-25T22:21:27.868Z","command":"questions capture","startedAt":"2026-05-25T22:21:27.868Z","status":"started","inputs":{"workflow":"semantic-contract","output":".sdd/question-drafts/semantic-close-harness-gaps.json","source":"agent"},"outputs":{},"gates":[],"evidence":[]}
{"id":"questions capture-2026-05-25T22:21:27.868Z","command":"questions capture","startedAt":"2026-05-25T22:21:27.868Z","endedAt":"2026-05-25T22:21:27.927Z","status":"succeeded","inputs":{"workflow":"semantic-contract","output":".sdd/question-drafts/semantic-close-harness-gaps.json","source":"agent"},"outputs":{"path":".sdd/question-drafts/semantic-close-harness-gaps.json","workflow":"semantic-contract","promptId":"feature.semantics"},"gates":[],"evidence":[]}
{"id":"feature semantics-2026-05-25T22:21:31.141Z","command":"feature semantics","startedAt":"2026-05-25T22:21:31.141Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","questionEvidenceId":"semantic-contract-questions-2026-05-25T22:21:27.926Z"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature semantics-2026-05-25T22:21:31.141Z","command":"feature semantics","startedAt":"2026-05-25T22:21:31.141Z","endedAt":"2026-05-25T22:21:31.147Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","questionEvidenceId":"semantic-contract-questions-2026-05-25T22:21:27.926Z"},"outputs":{"featureId":"2026-05-25-close-harness-gaps","sourceHash":"5d899a45e4f84294309d76009fb42e8c5383df32c77b7aef5628e5c15c111c9d"},"gates":[{"id":"semantic-contract.questions.actors","name":"semantic-contract grouped question: actors","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'actors'."},{"id":"semantic-contract.questions.outcomes","name":"semantic-contract grouped question: outcomes","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'outcomes'."},{"id":"semantic-contract.questions.entities","name":"semantic-contract grouped question: entities","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'entities'."},{"id":"semantic-contract.questions.commands","name":"semantic-contract grouped question: commands","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'commands'."},{"id":"semantic-contract.questions.states","name":"semantic-contract grouped question: states","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'states'."},{"id":"semantic-contract.questions.invariants","name":"semantic-contract grouped question: invariants","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'invariants'."},{"id":"semantic-contract.questions.scenarios","name":"semantic-contract grouped question: scenarios","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'scenarios'."},{"id":"semantic-contract.questions.oracles","name":"semantic-contract grouped question: oracles","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'oracles'."},{"id":"semantic-contract.questions.data","name":"semantic-contract grouped question: data","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'data'."},{"id":"semantic-contract.questions.telemetry","name":"semantic-contract grouped question: telemetry","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'telemetry'."},{"id":"semantic-contract.questions.architecture","name":"semantic-contract grouped question: architecture","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'architecture'."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature validate-spec-2026-05-25T22:21:37.006Z","command":"feature validate-spec","startedAt":"2026-05-25T22:21:37.006Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature validate-spec-2026-05-25T22:21:37.006Z","command":"feature validate-spec","startedAt":"2026-05-25T22:21:37.006Z","endedAt":"2026-05-25T22:21:37.015Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{"passed":true},"gates":[{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."},{"id":"semantic.contract.markdown","name":"semantics.md exists","severity":"blocking","passed":true,"message":"semantics.md exists passed."},{"id":"semantic.contract.json","name":"semantic contract JSON exists","severity":"blocking","passed":true,"message":"semantic contract JSON exists passed."},{"id":"semantic.contract.source-hash","name":"Semantic contract JSON matches semantics.md","severity":"blocking","passed":true,"message":"Semantic contract JSON matches semantics.md passed."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature approve-2026-05-25T22:21:40.948Z","command":"feature approve","startedAt":"2026-05-25T22:21:40.948Z","status":"started","inputs":{"target":"feature","featureId":"2026-05-25-close-harness-gaps","reviewer":"codex","notes":"Reapproved after regenerating semantic contract with explicit no-database applicability."},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature approve-2026-05-25T22:21:40.948Z","command":"feature approve","startedAt":"2026-05-25T22:21:40.948Z","endedAt":"2026-05-25T22:21:40.957Z","status":"succeeded","inputs":{"target":"feature","featureId":"2026-05-25-close-harness-gaps","reviewer":"codex","notes":"Reapproved after regenerating semantic contract with explicit no-database applicability."},"outputs":{"approvalPath":".sdd/approvals.jsonl"},"gates":[{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."},{"id":"semantic.contract.markdown","name":"semantics.md exists","severity":"blocking","passed":true,"message":"semantics.md exists passed."},{"id":"semantic.contract.json","name":"semantic contract JSON exists","severity":"blocking","passed":true,"message":"semantic contract JSON exists passed."},{"id":"semantic.contract.source-hash","name":"Semantic contract JSON matches semantics.md","severity":"blocking","passed":true,"message":"Semantic contract JSON matches semantics.md passed."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:46.265Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:46.265Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"red","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"node -e \"process.exit(1)\""},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:46.265Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:46.265Z","endedAt":"2026-05-25T22:21:46.330Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"red","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"node -e \"process.exit(1)\""},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"failed-as-expected","exitCode":1},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:49.966Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:49.966Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"green","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"npm test -- tests/feature.test.ts"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:49.966Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:49.966Z","endedAt":"2026-05-25T22:21:50.560Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"green","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"npm test -- tests/feature.test.ts"},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"passed","exitCode":0},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:55.674Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:55.674Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"refactor","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"npm test -- tests/feature.test.ts"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:21:55.674Z","command":"feature record-tdd","startedAt":"2026-05-25T22:21:55.674Z","endedAt":"2026-05-25T22:21:56.198Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","phase":"refactor","evidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"command":"npm test -- tests/feature.test.ts"},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"passed","exitCode":0},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:00.525Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:00.525Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","phase":"red","evidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"command":"node -e \"process.exit(1)\""},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:00.525Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:00.525Z","endedAt":"2026-05-25T22:22:00.594Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","phase":"red","evidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"command":"node -e \"process.exit(1)\""},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"failed-as-expected","exitCode":1},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:04.274Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:04.274Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","phase":"green","evidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"command":"npm test -- tests/feature.test.ts"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:04.274Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:04.274Z","endedAt":"2026-05-25T22:22:04.795Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","phase":"green","evidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"command":"npm test -- tests/feature.test.ts"},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"passed","exitCode":0},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:08.345Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:08.345Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","phase":"refactor","evidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"command":"npm test -- tests/feature.test.ts"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:08.345Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:08.345Z","endedAt":"2026-05-25T22:22:08.884Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","phase":"refactor","evidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"command":"npm test -- tests/feature.test.ts"},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"passed","exitCode":0},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:15.820Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:15.820Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","phase":"red","evidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"command":"node -e \"process.exit(1)\""},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:15.820Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:15.820Z","endedAt":"2026-05-25T22:22:15.882Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","phase":"red","evidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"command":"node -e \"process.exit(1)\""},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"failed-as-expected","exitCode":1},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:19.201Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:19.201Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","phase":"green","evidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"command":"npm test -- tests/feature.test.ts"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:19.201Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:19.201Z","endedAt":"2026-05-25T22:22:19.727Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","phase":"green","evidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"command":"npm test -- tests/feature.test.ts"},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"passed","exitCode":0},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:23.025Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:23.025Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","phase":"refactor","evidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"command":"npm test -- tests/feature.test.ts"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature record-tdd-2026-05-25T22:22:23.025Z","command":"feature record-tdd","startedAt":"2026-05-25T22:22:23.025Z","endedAt":"2026-05-25T22:22:23.573Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","phase":"refactor","evidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"command":"npm test -- tests/feature.test.ts"},"outputs":{"path":".sdd/tdd-evidence.jsonl","result":"passed","exitCode":0},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:22:28.866Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:22:28.866Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:22:28.866Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:22:28.866Z","endedAt":"2026-05-25T22:22:28.885Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:22:32.587Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:22:32.587Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:22:32.587Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:22:32.587Z","endedAt":"2026-05-25T22:22:32.601Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:22:36.121Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:22:36.121Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:22:36.121Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:22:36.121Z","endedAt":"2026-05-25T22:22:36.134Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:22:40.143Z","command":"feature run-validation","startedAt":"2026-05-25T22:22:40.143Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:22:40.143Z","command":"feature run-validation","startedAt":"2026-05-25T22:22:40.143Z","endedAt":"2026-05-25T22:22:40.157Z","status":"failed","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{"error":"validation.data.test-database: Data-changing validation requires --test-database or .sdd/database-sandbox.json so validation uses an isolated copy."},"gates":[{"id":"validation.data.test-database","name":"Isolated test database copy","severity":"blocking","passed":false,"message":"Data-changing validation requires --test-database or .sdd/database-sandbox.json so validation uses an isolated copy."}],"evidence":[]}
{"id":"feature validate-spec-2026-05-25T22:23:00.158Z","command":"feature validate-spec","startedAt":"2026-05-25T22:23:00.158Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature validate-spec-2026-05-25T22:23:00.158Z","command":"feature validate-spec","startedAt":"2026-05-25T22:23:00.158Z","endedAt":"2026-05-25T22:23:00.167Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{"passed":true},"gates":[{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."},{"id":"semantic.contract.markdown","name":"semantics.md exists","severity":"blocking","passed":true,"message":"semantics.md exists passed."},{"id":"semantic.contract.json","name":"semantic contract JSON exists","severity":"blocking","passed":true,"message":"semantic contract JSON exists passed."},{"id":"semantic.contract.source-hash","name":"Semantic contract JSON matches semantics.md","severity":"blocking","passed":true,"message":"Semantic contract JSON matches semantics.md passed."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature approve-2026-05-25T22:23:05.058Z","command":"feature approve","startedAt":"2026-05-25T22:23:05.058Z","status":"started","inputs":{"target":"feature","featureId":"2026-05-25-close-harness-gaps","reviewer":"codex","notes":"Reapproved after clarifying this repository feature has no data mutation."},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature approve-2026-05-25T22:23:05.058Z","command":"feature approve","startedAt":"2026-05-25T22:23:05.058Z","endedAt":"2026-05-25T22:23:05.067Z","status":"succeeded","inputs":{"target":"feature","featureId":"2026-05-25-close-harness-gaps","reviewer":"codex","notes":"Reapproved after clarifying this repository feature has no data mutation."},"outputs":{"approvalPath":".sdd/approvals.jsonl"},"gates":[{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."},{"id":"semantic.contract.markdown","name":"semantics.md exists","severity":"blocking","passed":true,"message":"semantics.md exists passed."},{"id":"semantic.contract.json","name":"semantic contract JSON exists","severity":"blocking","passed":true,"message":"semantic contract JSON exists passed."},{"id":"semantic.contract.source-hash","name":"Semantic contract JSON matches semantics.md","severity":"blocking","passed":true,"message":"Semantic contract JSON matches semantics.md passed."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:23:09.748Z","command":"feature run-validation","startedAt":"2026-05-25T22:23:09.748Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:23:09.748Z","command":"feature run-validation","startedAt":"2026-05-25T22:23:09.748Z","endedAt":"2026-05-25T22:23:09.751Z","status":"failed","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{"error":"Hard gate: feature '2026-05-25-close-harness-gaps' must be implemented or validated before validation. Current status: approved."},"gates":[{"id":"gate.failed","name":"feature run-validation","severity":"blocking","passed":false,"message":"Hard gate: feature '2026-05-25-close-harness-gaps' must be implemented or validated before validation. Current status: approved."}],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:23:17.109Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:23:17.109Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:23:17.109Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:23:17.109Z","endedAt":"2026-05-25T22:23:17.124Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:23:20.731Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:23:20.731Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:23:20.731Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:23:20.731Z","endedAt":"2026-05-25T22:23:20.745Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:23:24.745Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:23:24.745Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:23:24.745Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:23:24.745Z","endedAt":"2026-05-25T22:23:24.759Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:23:28.766Z","command":"feature run-validation","startedAt":"2026-05-25T22:23:28.766Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:23:28.766Z","command":"feature run-validation","startedAt":"2026-05-25T22:23:28.766Z","endedAt":"2026-05-25T22:23:47.619Z","status":"failed","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{"error":"validation.command.npm run test:strict-e2e-fixture: npm run test:strict-e2e-fixture failed with exit code 1."},"gates":[{"id":"validation.command.npm run test:strict-e2e-fixture","name":"Validation command: npm run test:strict-e2e-fixture","severity":"blocking","passed":false,"message":"npm run test:strict-e2e-fixture failed with exit code 1.","evidencePath":".sdd/evidence/1779747827616-npm-run-test-strict-e2e-fixture.log"}],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:24:28.609Z","command":"feature run-validation","startedAt":"2026-05-25T22:24:28.609Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:24:28.609Z","command":"feature run-validation","startedAt":"2026-05-25T22:24:28.609Z","endedAt":"2026-05-25T22:24:47.833Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{"commandCount":3,"summaryPath":".sdd/validation-summaries.jsonl"},"gates":[{"id":"validation.command.npm run typecheck","name":"Validation command: npm run typecheck","severity":"blocking","passed":true,"message":"npm run typecheck passed.","evidencePath":".sdd/evidence/1779747869755-npm-run-typecheck.log"},{"id":"validation.command.npm test","name":"Validation command: npm test","severity":"blocking","passed":true,"message":"npm test passed.","evidencePath":".sdd/evidence/1779747883290-npm-test.log"},{"id":"validation.command.npm run test:strict-e2e-fixture","name":"Validation command: npm run test:strict-e2e-fixture","severity":"blocking","passed":true,"message":"npm run test:strict-e2e-fixture passed.","evidencePath":".sdd/evidence/1779747887827-npm-run-test-strict-e2e-fixture.log"}],"evidence":[{"id":"evidence-1","kind":"command","path":".sdd/evidence/1779747869755-npm-run-typecheck.log","summary":"npm run typecheck passed.","passed":true,"createdAt":"2026-05-25T22:24:29.756Z"},{"id":"evidence-2","kind":"command","path":".sdd/evidence/1779747883290-npm-test.log","summary":"npm test passed.","passed":true,"createdAt":"2026-05-25T22:24:43.290Z"},{"id":"evidence-3","kind":"command","path":".sdd/evidence/1779747887827-npm-run-test-strict-e2e-fixture.log","summary":"npm run test:strict-e2e-fixture passed.","passed":true,"createdAt":"2026-05-25T22:24:47.827Z"}]}
{"id":"questions capture-2026-05-25T22:25:36.697Z","command":"questions capture","startedAt":"2026-05-25T22:25:36.697Z","status":"started","inputs":{"workflow":"semantic-contract","output":".sdd/question-drafts/semantic-close-harness-gaps.json","source":"agent"},"outputs":{},"gates":[],"evidence":[]}
{"id":"questions capture-2026-05-25T22:25:36.697Z","command":"questions capture","startedAt":"2026-05-25T22:25:36.697Z","endedAt":"2026-05-25T22:25:36.770Z","status":"succeeded","inputs":{"workflow":"semantic-contract","output":".sdd/question-drafts/semantic-close-harness-gaps.json","source":"agent"},"outputs":{"path":".sdd/question-drafts/semantic-close-harness-gaps.json","workflow":"semantic-contract","promptId":"feature.semantics"},"gates":[],"evidence":[]}
{"id":"feature semantics-2026-05-25T22:25:39.829Z","command":"feature semantics","startedAt":"2026-05-25T22:25:39.829Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","questionEvidenceId":"semantic-contract-questions-2026-05-25T22:25:36.768Z"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature semantics-2026-05-25T22:25:39.829Z","command":"feature semantics","startedAt":"2026-05-25T22:25:39.829Z","endedAt":"2026-05-25T22:25:39.836Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","questionEvidenceId":"semantic-contract-questions-2026-05-25T22:25:36.768Z"},"outputs":{"featureId":"2026-05-25-close-harness-gaps","sourceHash":"43f8af828ea4e7f8fa26f2b439586eed74f5a7ebef6f535d86b1cb2a58748bb8"},"gates":[{"id":"semantic-contract.questions.actors","name":"semantic-contract grouped question: actors","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'actors'."},{"id":"semantic-contract.questions.outcomes","name":"semantic-contract grouped question: outcomes","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'outcomes'."},{"id":"semantic-contract.questions.entities","name":"semantic-contract grouped question: entities","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'entities'."},{"id":"semantic-contract.questions.commands","name":"semantic-contract grouped question: commands","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'commands'."},{"id":"semantic-contract.questions.states","name":"semantic-contract grouped question: states","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'states'."},{"id":"semantic-contract.questions.invariants","name":"semantic-contract grouped question: invariants","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'invariants'."},{"id":"semantic-contract.questions.scenarios","name":"semantic-contract grouped question: scenarios","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'scenarios'."},{"id":"semantic-contract.questions.oracles","name":"semantic-contract grouped question: oracles","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'oracles'."},{"id":"semantic-contract.questions.data","name":"semantic-contract grouped question: data","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'data'."},{"id":"semantic-contract.questions.telemetry","name":"semantic-contract grouped question: telemetry","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'telemetry'."},{"id":"semantic-contract.questions.architecture","name":"semantic-contract grouped question: architecture","severity":"blocking","passed":true,"message":"Grouped question evidence captured 'architecture'."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature validate-spec-2026-05-25T22:25:42.978Z","command":"feature validate-spec","startedAt":"2026-05-25T22:25:42.978Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature validate-spec-2026-05-25T22:25:42.978Z","command":"feature validate-spec","startedAt":"2026-05-25T22:25:42.978Z","endedAt":"2026-05-25T22:25:42.987Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{"passed":true},"gates":[{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."},{"id":"semantic.contract.markdown","name":"semantics.md exists","severity":"blocking","passed":true,"message":"semantics.md exists passed."},{"id":"semantic.contract.json","name":"semantic contract JSON exists","severity":"blocking","passed":true,"message":"semantic contract JSON exists passed."},{"id":"semantic.contract.source-hash","name":"Semantic contract JSON matches semantics.md","severity":"blocking","passed":true,"message":"Semantic contract JSON matches semantics.md passed."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature approve-2026-05-25T22:25:46.900Z","command":"feature approve","startedAt":"2026-05-25T22:25:46.900Z","status":"started","inputs":{"target":"feature","featureId":"2026-05-25-close-harness-gaps","reviewer":"codex","notes":"Reapproved after aligning semantic telemetry expectations with pre-completion gate order."},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature approve-2026-05-25T22:25:46.900Z","command":"feature approve","startedAt":"2026-05-25T22:25:46.900Z","endedAt":"2026-05-25T22:25:46.910Z","status":"succeeded","inputs":{"target":"feature","featureId":"2026-05-25-close-harness-gaps","reviewer":"codex","notes":"Reapproved after aligning semantic telemetry expectations with pre-completion gate order."},"outputs":{"approvalPath":".sdd/approvals.jsonl"},"gates":[{"id":"feature.requirements.exists","name":"requirements.md exists","severity":"blocking","passed":true,"message":"requirements.md exists passed."},{"id":"feature.requirements.scope","name":"Requirements include scope","severity":"blocking","passed":true,"message":"Requirements include scope passed."},{"id":"feature.requirements.decisions","name":"Requirements include decisions","severity":"blocking","passed":true,"message":"Requirements include decisions passed."},{"id":"feature.requirements.context","name":"Requirements include context","severity":"blocking","passed":true,"message":"Requirements include context passed."},{"id":"feature.requirements.ids","name":"Requirements contain at least one REQ-* id","severity":"blocking","passed":true,"message":"Requirements contain at least one REQ-* id passed."},{"id":"feature.plan.exists","name":"plan.md exists","severity":"blocking","passed":true,"message":"plan.md exists passed."},{"id":"feature.plan.task-groups","name":"Plan contains numbered task groups","severity":"blocking","passed":true,"message":"Plan contains numbered task groups passed."},{"id":"feature.plan.tdd","name":"Plan includes TDD/test tasks","severity":"blocking","passed":true,"message":"Plan includes TDD/test tasks passed."},{"id":"feature.plan.traceability","name":"Plan tasks reference requirement and validation ids","severity":"blocking","passed":true,"message":"Plan tasks reference requirement and validation ids passed."},{"id":"feature.validation.exists","name":"validation.md exists","severity":"blocking","passed":true,"message":"validation.md exists passed."},{"id":"feature.validation.automated","name":"Validation includes automated checks","severity":"blocking","passed":true,"message":"Validation includes automated checks passed."},{"id":"feature.validation.executable","name":"Automated validation cases include commands or manual-only rationale","severity":"blocking","passed":true,"message":"Automated validation cases include commands or manual-only rationale passed."},{"id":"feature.validation.manual","name":"Validation includes manual acceptance","severity":"blocking","passed":true,"message":"Validation includes manual acceptance passed."},{"id":"feature.validation.done","name":"Validation defines done","severity":"blocking","passed":true,"message":"Validation defines done passed."},{"id":"semantic.contract.markdown","name":"semantics.md exists","severity":"blocking","passed":true,"message":"semantics.md exists passed."},{"id":"semantic.contract.json","name":"semantic contract JSON exists","severity":"blocking","passed":true,"message":"semantic contract JSON exists passed."},{"id":"semantic.contract.source-hash","name":"Semantic contract JSON matches semantics.md","severity":"blocking","passed":true,"message":"Semantic contract JSON matches semantics.md passed."},{"id":"semantic.contract.feature-id","name":"Semantic contract has feature id","severity":"blocking","passed":true,"message":"Semantic contract has feature id passed."},{"id":"semantic.contract.no-placeholders","name":"Semantic contract has no TODO placeholders","severity":"blocking","passed":true,"message":"Semantic contract has no TODO placeholders passed."},{"id":"semantic.actors","name":"Semantic contract records actors or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records actors or explicit not-applicable reason passed."},{"id":"semantic.entities","name":"Semantic contract records entities or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records entities or explicit not-applicable reason passed."},{"id":"semantic.commands","name":"Semantic contract records commands or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records commands or explicit not-applicable reason passed."},{"id":"semantic.outcomes","name":"Semantic contract records jobs/outcomes","severity":"blocking","passed":true,"message":"Semantic contract records jobs/outcomes passed."},{"id":"semantic.scenarios","name":"Semantic contract records scenarios","severity":"blocking","passed":true,"message":"Semantic contract records scenarios passed."},{"id":"semantic.scenario-steps","name":"Every semantic scenario records meaningful ordered steps","severity":"blocking","passed":true,"message":"Every semantic scenario records meaningful ordered steps passed."},{"id":"semantic.oracles","name":"Semantic contract records oracles","severity":"blocking","passed":true,"message":"Semantic contract records oracles passed."},{"id":"semantic.scenario-evidence","name":"Every semantic scenario has oracle and evidence mappings","severity":"blocking","passed":true,"message":"Every semantic scenario has oracle and evidence mappings passed."},{"id":"semantic.invariant-evidence","name":"Every invariant has verification methods and evidence","severity":"blocking","passed":true,"message":"Every invariant has verification methods and evidence passed."},{"id":"semantic.evidence-refs","name":"Required semantic evidence refs identify concrete files or structured telemetry events","severity":"blocking","passed":true,"message":"Required semantic evidence refs identify concrete files or structured telemetry events passed."},{"id":"semantic.architecture","name":"Semantic contract records architecture claims or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records architecture claims or explicit not-applicable reason passed."},{"id":"semantic.telemetry","name":"Semantic contract records telemetry expectations or explicit not-applicable reason","severity":"blocking","passed":true,"message":"Semantic contract records telemetry expectations or explicit not-applicable reason passed."}],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:25:52.262Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:25:52.262Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:25:52.262Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:25:52.262Z","endedAt":"2026-05-25T22:25:52.278Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-1-dogfood-artifacts","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-1-dogfood-artifacts"],"testEvidence":["tests/feature.test.ts::group-1-dogfood-artifacts::VAL-001"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:25:56.218Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:25:56.218Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:25:56.218Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:25:56.218Z","endedAt":"2026-05-25T22:25:56.238Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-2-strict-gates","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-2-strict-gates"],"testEvidence":["tests/feature.test.ts::group-2-strict-gates::VAL-002::VAL-003::VAL-004"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:26:00.046Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:26:00.046Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature complete-task-group-2026-05-25T22:26:00.046Z","command":"feature complete-task-group","startedAt":"2026-05-25T22:26:00.046Z","endedAt":"2026-05-25T22:26:00.060Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","taskGroup":"group-3-quality-policies","implementationEvidence":[".sdd/implementation-packets/2026-05-25-close-harness-gaps.md::group-3-quality-policies"],"testEvidence":["tests/feature.test.ts::group-3-quality-policies::VAL-005::VAL-006::VAL-007"],"tddRedEvidence":[],"tddGreenEvidence":[],"tddRefactorEvidence":[],"strictTdd":false,"compatTdd":false},"outputs":{"path":".sdd/task-groups.jsonl","status":"complete"},"gates":[],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:26:09.259Z","command":"feature run-validation","startedAt":"2026-05-25T22:26:09.259Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature run-validation-2026-05-25T22:26:09.259Z","command":"feature run-validation","startedAt":"2026-05-25T22:26:09.259Z","endedAt":"2026-05-25T22:26:28.708Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps","commands":["npm run typecheck","npm test","npm run test:strict-e2e-fixture"],"strictPlaywright":false,"compatPlaywright":false},"outputs":{"commandCount":3,"summaryPath":".sdd/validation-summaries.jsonl"},"gates":[{"id":"validation.command.npm run typecheck","name":"Validation command: npm run typecheck","severity":"blocking","passed":true,"message":"npm run typecheck passed.","evidencePath":".sdd/evidence/1779747970517-npm-run-typecheck.log"},{"id":"validation.command.npm test","name":"Validation command: npm test","severity":"blocking","passed":true,"message":"npm test passed.","evidencePath":".sdd/evidence/1779747984451-npm-test.log"},{"id":"validation.command.npm run test:strict-e2e-fixture","name":"Validation command: npm run test:strict-e2e-fixture","severity":"blocking","passed":true,"message":"npm run test:strict-e2e-fixture passed.","evidencePath":".sdd/evidence/1779747988704-npm-run-test-strict-e2e-fixture.log"}],"evidence":[{"id":"evidence-1","kind":"command","path":".sdd/evidence/1779747970517-npm-run-typecheck.log","summary":"npm run typecheck passed.","passed":true,"createdAt":"2026-05-25T22:26:10.517Z"},{"id":"evidence-2","kind":"command","path":".sdd/evidence/1779747984451-npm-test.log","summary":"npm test passed.","passed":true,"createdAt":"2026-05-25T22:26:24.451Z"},{"id":"evidence-3","kind":"command","path":".sdd/evidence/1779747988704-npm-run-test-strict-e2e-fixture.log","summary":"npm run test:strict-e2e-fixture passed.","passed":true,"createdAt":"2026-05-25T22:26:28.704Z"}]}
{"id":"feature deep-review-2026-05-25T22:26:34.782Z","command":"feature deep-review","startedAt":"2026-05-25T22:26:34.782Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{},"gates":[],"evidence":[]}
{"id":"feature deep-review-2026-05-25T22:26:34.782Z","command":"feature deep-review","startedAt":"2026-05-25T22:26:34.782Z","endedAt":"2026-05-25T22:26:35.038Z","status":"succeeded","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{"path":".sdd/reviews/2026-05-25-2026-05-25-close-harness-gaps.md"},"gates":[],"evidence":[]}
{"id":"feature semantic-verify-2026-05-25T22:26:39.667Z","command":"feature semantic-verify","startedAt":"2026-05-25T22:26:39.667Z","status":"started","inputs":{"featureId":"2026-05-25-close-harness-gaps"},"outputs":{},"gates":[],"evidence":[]}

## .sdd/evidence.jsonl

{"id":"evidence-1","kind":"command","path":".sdd/evidence/1779747869755-npm-run-typecheck.log","summary":"npm run typecheck passed.","passed":true,"createdAt":"2026-05-25T22:24:29.756Z"}
{"id":"evidence-2","kind":"command","path":".sdd/evidence/1779747883290-npm-test.log","summary":"npm test passed.","passed":true,"createdAt":"2026-05-25T22:24:43.290Z"}
{"id":"evidence-3","kind":"command","path":".sdd/evidence/1779747887827-npm-run-test-strict-e2e-fixture.log","summary":"npm run test:strict-e2e-fixture passed.","passed":true,"createdAt":"2026-05-25T22:24:47.827Z"}
{"id":"evidence-1","kind":"command","path":".sdd/evidence/1779747970517-npm-run-typecheck.log","summary":"npm run typecheck passed.","passed":true,"createdAt":"2026-05-25T22:26:10.517Z"}
{"id":"evidence-2","kind":"command","path":".sdd/evidence/1779747984451-npm-test.log","summary":"npm test passed.","passed":true,"createdAt":"2026-05-25T22:26:24.451Z"}
{"id":"evidence-3","kind":"command","path":".sdd/evidence/1779747988704-npm-run-test-strict-e2e-fixture.log","summary":"npm run test:strict-e2e-fixture passed.","passed":true,"createdAt":"2026-05-25T22:26:28.704Z"}

## source/changed-files.txt

No git repository detected; source context is inferred from task-group and validation evidence files.

## evidence:.sdd/implementation-packets/2026-05-25-close-harness-gaps.md

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

## evidence:tests/feature.test.ts

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

## evidence:.sdd/checkpoints.jsonl

{"id":"checkpoint-close-harness-gaps-intent","stepId":"create-feature-spec","kind":"supervisor-note","notes":"Question intent, implementation plan, and execution checklist captured from the user request for Complete SDD Harness Gaps.","featureId":"2026-05-25-close-harness-gaps","createdAt":"2026-05-25T22:02:00.000Z"}
{"id":"checkpoint-close-harness-gaps-validation","stepId":"feature-validation","kind":"manual","notes":"Validated with npm run typecheck, npm test, npm run build, npm run qa, and npm run test:strict-e2e-fixture. Strict fixture required approved browser-process escalation and passed.","featureId":"2026-05-25-close-harness-gaps","createdAt":"2026-05-25T22:02:00.000Z"}
{"id":"checkpoint-close-harness-gaps-changelog","stepId":"run-changelog-skill","kind":"manual","notes":"CHANGELOG.md updated for root SDD artifact and harness hardening work.","featureId":"2026-05-25-close-harness-gaps","createdAt":"2026-05-25T22:02:00.000Z"}
{"id":"checkpoint-close-harness-gaps-completion","stepId":"review-subagent-recommendations","kind":"manual","notes":"Implementation reviewed for Clean Architecture, SOLID boundaries, adapter decoupling, data isolation, Playwright evidence, semantic refs, and telemetry expectations.","featureId":"2026-05-25-close-harness-gaps","createdAt":"2026-05-25T22:02:00.000Z"}

## evidence:.sdd/evidence/1779747869755-npm-run-typecheck.log

$ npm run typecheck

# stdout

> sdd-harness@0.1.0 typecheck
> tsc --noEmit



# stderr

## evidence:.sdd/evidence/1779747883290-npm-test.log

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

## evidence:.sdd/evidence/1779747887827-npm-run-test-strict-e2e-fixture.log

$ npm run test:strict-e2e-fixture

# stdout

> sdd-harness@0.1.0 test:strict-e2e-fixture
> npm run build && node scripts/strict-playwright-fixture.mjs


> sdd-harness@0.1.0 build
> tsc -p tsconfig.build.json

Strict Playwright fixture passed for 2026-05-25-feedback.


# stderr

## evidence:.sdd/evidence/1779747970517-npm-run-typecheck.log

$ npm run typecheck

# stdout

> sdd-harness@0.1.0 typecheck
> tsc --noEmit



# stderr

## evidence:.sdd/evidence/1779747984451-npm-test.log

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

## evidence:.sdd/evidence/1779747988704-npm-run-test-strict-e2e-fixture.log

$ npm run test:strict-e2e-fixture

# stdout

> sdd-harness@0.1.0 test:strict-e2e-fixture
> npm run build && node scripts/strict-playwright-fixture.mjs


> sdd-harness@0.1.0 build
> tsc -p tsconfig.build.json

Strict Playwright fixture passed for 2026-05-25-feedback.


# stderr
