# Semantics: 2026-05-25-close-remaining-sdd-gaps

Source Hash: 1df5e685f68d3d68ce9f28a4d7cbfc38ec175f173aa5b8b10acf7d8e2e776725

## Actors

- **ACT-001:** SDD harness maintainer
- **ACT-002:** adapter author

## Outcomes

- Remaining audit gaps are closed with command-backed evidence
- adapter authors can implement replaceable integrations without reading harness internals
- stricter contracts reject incomplete or unrelated evidence.

## Entities

- **ENT-001:** FeatureApproval States: ExperienceContract incomplete -> complete, ValidationDatabase original -> copied -> verified
- **ENT-002:** ExperienceContract States: ExperienceContract incomplete -> complete, ValidationDatabase original -> copied -> verified
- **ENT-003:** AdapterContract States: ExperienceContract incomplete -> complete, ValidationDatabase original -> copied -> verified
- **ENT-004:** ValidationDatabase States: ExperienceContract incomplete -> complete, ValidationDatabase original -> copied -> verified

## Commands

- **CMD-001:** ValidateFeatureSpec Actors: ACT-001 Entities: ENT-001
- **CMD-002:** CompleteTaskGroup Actors: ACT-001 Entities: ENT-001
- **CMD-003:** RunValidation Actors: ACT-001 Entities: ENT-001

## State Transitions

- **TRN-001:** ENT-001 ExperienceContract incomplete -> complete via semantic contract
- **TRN-002:** ENT-001 ValidationDatabase original -> copied via semantic contract

## Invariants

- **INV-001:** Approval evidence must contain real fileHashes Severity: blocking. Methods: unit-test, telemetry-evidence
- **INV-002:** experience contracts must declare database mutation behavior Severity: blocking. Methods: unit-test, telemetry-evidence
- **INV-003:** strict task completion must use the recorded red-green test file Severity: blocking. Methods: unit-test, telemetry-evidence
- **INV-004:** original databases must remain unchanged during data validation Severity: blocking. Methods: unit-test, telemetry-evidence
- **INV-005:** adapter contracts must be documented and modules must stay below architecture warning thresholds. Severity: blocking. Methods: unit-test, telemetry-evidence

## Oracles

- **ORC-001:** Focused unit and e2e tests Methods: unit-test, telemetry-evidence
- **ORC-002:** full QA command suite Methods: unit-test, telemetry-evidence
- **ORC-003:** workflow doctor strict Methods: unit-test, telemetry-evidence

## Scenarios

### SCN-001: Validate experience contracts

- Actors: ACT-001
- Preconditions: none
- Steps: run feature spec validation; inspect missing Database Mutations; require explicit None or mutation text
- Expected Visible Outcome: none
- Expected Data Mutations: none
- Expected Telemetry: feature validate-spec; feature complete-task-group; feature run-validation
- Experience Flows: none
- Oracles: ORC-001
- Evidence: EVD-TST-001:unit-test:tests/feature.test.ts; EVD-TEL-001:telemetry-evidence:feature validate-spec; EVD-TEL-001:telemetry-evidence:feature complete-task-group; EVD-TEL-001:telemetry-evidence:feature run-validation

### SCN-002: Validate SQLite copy test coverage

- Actors: ACT-001
- Preconditions: none
- Steps: run validation tests; verify copied database assertions; compare original hash assertion
- Expected Visible Outcome: none
- Expected Data Mutations: none
- Expected Telemetry: feature validate-spec; feature complete-task-group; feature run-validation
- Experience Flows: none
- Oracles: ORC-002
- Evidence: EVD-TST-002:unit-test:tests/feature.test.ts; EVD-TEL-002:telemetry-evidence:feature validate-spec; EVD-TEL-002:telemetry-evidence:feature complete-task-group; EVD-TEL-002:telemetry-evidence:feature run-validation

### SCN-003: Replace inventory adapter

- Actors: ACT-001
- Preconditions: none
- Steps: run configured inventory command; merge command inventory with static inventory; block malformed output.
- Expected Visible Outcome: none
- Expected Data Mutations: none
- Expected Telemetry: feature validate-spec; feature complete-task-group; feature run-validation
- Experience Flows: none
- Oracles: ORC-003
- Evidence: EVD-TST-003:unit-test:tests/feature.test.ts; EVD-TEL-003:telemetry-evidence:feature validate-spec; EVD-TEL-003:telemetry-evidence:feature complete-task-group; EVD-TEL-003:telemetry-evidence:feature run-validation

## Architecture Claims

- **ARCH-001:** Domain and application code remain independent of concrete shell, browser, and database adapters Method: static-rule
- **ARCH-002:** shared process execution lives in src/adapters/commands Method: static-rule
- **ARCH-003:** production database validation remains adapter-agnostic. Method: static-rule

## Telemetry

- feature validate-spec
- feature complete-task-group
- feature run-validation
