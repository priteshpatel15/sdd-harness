# Semantics: 2026-05-26-workflow-evidence-dashboard

Source Hash: 67bc9630d17aa0b161355aed5f9fc5f479d263380432fc89dd838155b20d8943

## Actors

- **ACT-001:** Operator: create evidence records and see save/failure outcomes Permissions: create evidence records and see save/failure outcomes
- **ACT-002:** Reviewer: inspect evidence categories and status summaries Permissions: inspect evidence categories and status summaries

## Outcomes

- Evidence creation is visible, persisted, and traceable through telemetry.
- Invalid evidence submissions are blocked without database writes.
- Reviewers can see represented and missing validation categories.
- Persistence failures are visible and do not masquerade as successful saves.

## Entities

- **ENT-001:** EvidenceRecord States: EvidenceRecord: draft -> validated -> persisted, EvidenceRecord: draft -> rejected, EvidenceDashboard: empty -> editing -> saving -> success, EvidenceDashboard: editing -> validation_error, EvidenceDashboard: saving -> persistence_failure
- **ENT-002:** EvidenceCategorySummary States: EvidenceRecord: draft -> validated -> persisted, EvidenceRecord: draft -> rejected, EvidenceDashboard: empty -> editing -> saving -> success, EvidenceDashboard: editing -> validation_error, EvidenceDashboard: saving -> persistence_failure
- **ENT-003:** TelemetryEvent States: EvidenceRecord: draft -> validated -> persisted, EvidenceRecord: draft -> rejected, EvidenceDashboard: empty -> editing -> saving -> success, EvidenceDashboard: editing -> validation_error, EvidenceDashboard: saving -> persistence_failure
- **ENT-004:** EvidenceDashboard States: EvidenceRecord: draft -> validated -> persisted, EvidenceRecord: draft -> rejected, EvidenceDashboard: empty -> editing -> saving -> success, EvidenceDashboard: editing -> validation_error, EvidenceDashboard: saving -> persistence_failure

## Commands

- **CMD-001:** CreateEvidence Actors: ACT-001 Entities: ENT-001
- **CMD-002:** ListEvidence Actors: ACT-001 Entities: ENT-001
- **CMD-003:** ValidateEvidenceInput Actors: ACT-001 Entities: ENT-001
- **CMD-004:** SimulatePersistenceFailure Actors: ACT-001 Entities: ENT-001

## State Transitions

- **TRN-001:** ENT-001 EvidenceRecord: draft -> validated via semantic contract
- **TRN-002:** ENT-001 EvidenceRecord: draft -> rejected via semantic contract
- **TRN-003:** ENT-001 EvidenceDashboard: empty -> editing via semantic contract
- **TRN-004:** ENT-001 EvidenceDashboard: editing -> validation_error via semantic contract
- **TRN-005:** ENT-001 EvidenceDashboard: saving -> persistence_failure via semantic contract

## Invariants

- **INV-001:** The UI never writes directly to SQLite and must call interface/application code. Severity: blocking. Methods: playwright-flow, database-evidence, telemetry-evidence
- **INV-002:** CreateEvidence persists through a repository port backed by the SQLite adapter. Severity: blocking. Methods: playwright-flow, database-evidence, telemetry-evidence
- **INV-003:** Data-changing browser validation uses an isolated SQLite test database copy. Severity: blocking. Methods: playwright-flow, database-evidence, telemetry-evidence
- **INV-004:** Successful create emits evidence_create_started and evidence_create_succeeded telemetry. Severity: blocking. Methods: playwright-flow, database-evidence, telemetry-evidence
- **INV-005:** Validation and persistence failures emit failure telemetry and do not persist a successful evidence row. Severity: blocking. Methods: playwright-flow, database-evidence, telemetry-evidence

## Oracles

- **ORC-001:** tests/e2e/evidence.spec.ts::operator creates evidence proves FLOW-001 UI, database, and telemetry behavior. Methods: playwright-flow, database-evidence, telemetry-evidence
- **ORC-002:** tests/e2e/evidence.spec.ts::operator sees validation errors proves FLOW-002 validation behavior. Methods: playwright-flow, database-evidence, telemetry-evidence
- **ORC-003:** tests/e2e/evidence.spec.ts::reviewer inspects evidence categories proves FLOW-003 reviewer behavior. Methods: playwright-flow, database-evidence, telemetry-evidence
- **ORC-004:** tests/e2e/evidence.spec.ts::persistence failure is visible proves FLOW-004 failure behavior. Methods: playwright-flow, database-evidence, telemetry-evidence
- **ORC-005:** Vitest unit and integration tests prove domain, application, SQLite repository, and telemetry adapter behavior. Methods: playwright-flow, database-evidence, telemetry-evidence

## Scenarios

### SCN-001: FLOW-001 Operator creates evidence

- Actors: ACT-001
- Preconditions: none
- Steps: open /evidence; submit valid title category and status; repository inserts one EvidenceRecord in the isolated SQLite test database; UI shows success and the new row; telemetry records evidence_create_started and evidence_create_succeeded
- Expected Visible Outcome: FLOW-001 Operator creates evidence
- Expected Data Mutations: FLOW-001 inserts one evidence record into the isolated SQLite evidence table.; FLOW-002 performs no database mutation.; FLOW-003 seeds representative evidence rows in the isolated SQLite test database before read-only inspection.; FLOW-004 rejects the attempted insert and persists no new evidence row.
- Expected Telemetry: evidence_create_started; evidence_create_succeeded; evidence_create_failed; validation_checked; database_write_failed
- Experience Flows: FLOW-001, FLOW-002, FLOW-003, FLOW-004
- Oracles: ORC-001
- Evidence: EVD-UI-001:playwright-flow:tests/e2e/evidence.spec.ts::operator creates evidence; EVD-DB-001:database-evidence:.sdd/test-db; EVD-TEL-001:telemetry-evidence:evidence_create_started; EVD-TEL-001:telemetry-evidence:evidence_create_succeeded; EVD-TEL-001:telemetry-evidence:evidence_create_failed; EVD-TEL-001:telemetry-evidence:validation_checked; EVD-TEL-001:telemetry-evidence:database_write_failed

### SCN-002: FLOW-002 Operator sees validation errors

- Actors: ACT-001
- Preconditions: none
- Steps: open /evidence; submit missing required fields; application validation rejects the command; UI shows field errors; no EvidenceRecord is inserted
- Expected Visible Outcome: FLOW-002 Operator sees validation errors
- Expected Data Mutations: FLOW-001 inserts one evidence record into the isolated SQLite evidence table.; FLOW-002 performs no database mutation.; FLOW-003 seeds representative evidence rows in the isolated SQLite test database before read-only inspection.; FLOW-004 rejects the attempted insert and persists no new evidence row.
- Expected Telemetry: evidence_create_started; evidence_create_succeeded; evidence_create_failed; validation_checked; database_write_failed
- Experience Flows: FLOW-002, FLOW-001, FLOW-003, FLOW-004
- Oracles: ORC-002
- Evidence: EVD-UI-002:playwright-flow:tests/e2e/evidence.spec.ts::operator sees validation errors; EVD-DB-002:database-evidence:.sdd/test-db; EVD-TEL-002:telemetry-evidence:evidence_create_started; EVD-TEL-002:telemetry-evidence:evidence_create_succeeded; EVD-TEL-002:telemetry-evidence:evidence_create_failed; EVD-TEL-002:telemetry-evidence:validation_checked; EVD-TEL-002:telemetry-evidence:database_write_failed

### SCN-003: FLOW-003 Reviewer inspects evidence categories

- Actors: ACT-001
- Preconditions: none
- Steps: seed isolated SQLite test database with evidence rows; open /evidence; list evidence records; summarize represented and missing categories; reviewer sees category status summaries
- Expected Visible Outcome: FLOW-003 Reviewer inspects evidence categories
- Expected Data Mutations: FLOW-001 inserts one evidence record into the isolated SQLite evidence table.; FLOW-002 performs no database mutation.; FLOW-003 seeds representative evidence rows in the isolated SQLite test database before read-only inspection.; FLOW-004 rejects the attempted insert and persists no new evidence row.
- Expected Telemetry: evidence_create_started; evidence_create_succeeded; evidence_create_failed; validation_checked; database_write_failed
- Experience Flows: FLOW-003, FLOW-001, FLOW-002, FLOW-004
- Oracles: ORC-003
- Evidence: EVD-UI-003:playwright-flow:tests/e2e/evidence.spec.ts::reviewer inspects evidence categories; EVD-DB-003:database-evidence:.sdd/test-db; EVD-TEL-003:telemetry-evidence:evidence_create_started; EVD-TEL-003:telemetry-evidence:evidence_create_succeeded; EVD-TEL-003:telemetry-evidence:evidence_create_failed; EVD-TEL-003:telemetry-evidence:validation_checked; EVD-TEL-003:telemetry-evidence:database_write_failed

### SCN-004: FLOW-004 Persistence failure is visible

- Actors: ACT-001
- Preconditions: none
- Steps: enable repository write failure flag; submit valid evidence; SQLite adapter rejects the write; UI shows failure state; no saved row appears; telemetry records database_write_failed and evidence_create_failed
- Expected Visible Outcome: FLOW-004 Persistence failure is visible
- Expected Data Mutations: FLOW-001 inserts one evidence record into the isolated SQLite evidence table.; FLOW-002 performs no database mutation.; FLOW-003 seeds representative evidence rows in the isolated SQLite test database before read-only inspection.; FLOW-004 rejects the attempted insert and persists no new evidence row.
- Expected Telemetry: evidence_create_started; evidence_create_succeeded; evidence_create_failed; validation_checked; database_write_failed
- Experience Flows: FLOW-004, FLOW-001, FLOW-002, FLOW-003
- Oracles: ORC-004
- Evidence: EVD-UI-004:playwright-flow:tests/e2e/evidence.spec.ts::persistence failure is visible; EVD-DB-004:database-evidence:.sdd/test-db; EVD-TEL-004:telemetry-evidence:evidence_create_started; EVD-TEL-004:telemetry-evidence:evidence_create_succeeded; EVD-TEL-004:telemetry-evidence:evidence_create_failed; EVD-TEL-004:telemetry-evidence:validation_checked; EVD-TEL-004:telemetry-evidence:database_write_failed

## Architecture Claims

- **ARCH-001:** Domain entities and validation rules have no dependency on React, HTTP, SQLite, filesystem telemetry, or Playwright. Method: static-rule
- **ARCH-002:** Application use cases depend on repository and telemetry ports. Method: static-rule
- **ARCH-003:** SQLite and JSONL telemetry are replaceable adapters. Method: static-rule
- **ARCH-004:** HTTP and React interfaces delegate to application use cases instead of owning business rules. Method: static-rule
- **ARCH-005:** Tests exercise domain/application contracts before adapter and UI behavior. Method: static-rule

## Telemetry

- evidence_create_started
- evidence_create_succeeded
- evidence_create_failed
- validation_checked
- database_write_failed
