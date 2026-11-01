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
