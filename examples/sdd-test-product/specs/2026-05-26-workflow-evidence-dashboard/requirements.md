# Requirements: Workflow Evidence Dashboard

## Scope

Deliver the Workflow Evidence Dashboard as the first vertical slice. The product exposes a /evidence UI where an Operator can create validation evidence, a Reviewer can inspect required evidence categories, evidence is persisted through an application repository port backed by a real SQLite database adapter, telemetry is emitted for create and validation outcomes, and automated validation proves the UI, database, and telemetry behavior.

## Decisions

Use TypeScript throughout. Use a Vite React UI and a small Node HTTP API for the local app shell. Keep Clean Architecture layers explicit: src/domain for entities and rules, src/application for use cases and ports, src/adapters for SQLite and telemetry implementations, and src/interfaces for HTTP and React UI. Use SQLite through a swappable persistence adapter with DATABASE_PATH pointing to the active database. Use Vitest for unit and integration tests, Playwright for browser workflows, and structured JSONL telemetry for important actions.

## Context

This feature must prove the SDD harness expectations in a realistic greenfield product. The UI must not write directly to storage; it calls HTTP/interface code that delegates into application use cases. Tests must be written before production behavior where possible. Validation must run against an isolated copy of the real SQLite database so browser actions do not mutate the development database. Generated evidence and telemetry should remain inspectable under .sdd or test-results without coupling domain logic to those paths.

## Experience Intent

### FLOW-001: Operator creates evidence

- Role: Operator
- Route or Screen: /evidence
- Happy Path: Open the evidence dashboard, fill title, category, and status fields, submit the form, and see the saved evidence record in the list.
- Edge Cases: Empty dashboard state is shown before records exist; duplicate titles are allowed but each saved record has a unique id and timestamp.
- Data Setup: Start with an isolated SQLite test database copy migrated with the evidence table and no evidence rows.
- Database Mutations: Insert one evidence record into the isolated SQLite evidence table.
- Expected Visible Outcome: A success message appears and the new evidence row shows title, category, status, and created timestamp.
- Playwright: tests/e2e/evidence.spec.ts::operator creates evidence

### FLOW-002: Operator sees validation errors

- Role: Operator
- Route or Screen: /evidence
- Happy Path: Submit the evidence form with required fields missing and correct the visible validation messages.
- Edge Cases: Existing valid field values remain in place after a blocked submission.
- Data Setup: Start with an isolated SQLite test database copy and no evidence rows.
- Database Mutations: None
- Expected Visible Outcome: Required field messages are visible and no success message or new evidence row appears.
- Playwright: tests/e2e/evidence.spec.ts::operator sees validation errors

### FLOW-003: Reviewer inspects evidence categories

- Role: Reviewer
- Route or Screen: /evidence
- Happy Path: Open the dashboard with seeded evidence rows and verify unit, integration, database, Playwright, and telemetry categories are represented.
- Edge Cases: Missing categories are shown as missing rather than silently passing.
- Data Setup: Seed the isolated SQLite test database copy with representative evidence rows.
- Database Mutations: None
- Expected Visible Outcome: Seeded rows and category status summaries are visible, with missing categories clearly marked.
- Playwright: tests/e2e/evidence.spec.ts::reviewer inspects evidence categories

### FLOW-004: Persistence failure is visible

- Role: Operator
- Route or Screen: /evidence
- Happy Path: Attempt to create evidence while the API is configured to simulate a repository write failure.
- Edge Cases: The failure path must not show the failed record as saved and must allow retry after the failure mode is cleared.
- Data Setup: Start with an isolated SQLite test database copy and enable the test failure flag for the create endpoint.
- Database Mutations: Attempted insert is rejected; no new evidence row is persisted.
- Expected Visible Outcome: A clear failure message appears, no success message appears, and the evidence list is unchanged.
- Playwright: tests/e2e/evidence.spec.ts::persistence failure is visible

## Requirements

- **REQ-001:** Scope: deliver Deliver the Workflow Evidence Dashboard as the first vertical slice. The product exposes a /evidence UI where an Operator can create validation evidence, a Reviewer can inspect required evidence categories, evidence is persisted through an application repository port backed by a real SQLite database adapter, telemetry is emitted for create and validation outcomes, and automated validation proves the UI, database, and telemetry behavior..
- **REQ-002:** Decision: preserve Use TypeScript throughout. Use a Vite React UI and a small Node HTTP API for the local app shell. Keep Clean Architecture layers explicit: src/domain for entities and rules, src/application for use cases and ports, src/adapters for SQLite and telemetry implementations, and src/interfaces for HTTP and React UI. Use SQLite through a swappable persistence adapter with DATABASE_PATH pointing to the active database. Use Vitest for unit and integration tests, Playwright for browser workflows, and structured JSONL telemetry for important actions..
- **REQ-003:** Context: honor This feature must prove the SDD harness expectations in a realistic greenfield product. The UI must not write directly to storage; it calls HTTP/interface code that delegates into application use cases. Tests must be written before production behavior where possible. Validation must run against an isolated copy of the real SQLite database so browser actions do not mutate the development database. Generated evidence and telemetry should remain inspectable under .sdd or test-results without coupling domain logic to those paths..
- **REQ-004:** Experience and data: implement the UI/data flows recorded in experience.md with Playwright coverage and isolated test data when mutations occur.
- **REQ-005:** Evidence: record validation, review, semantic verification, and telemetry evidence under .sdd/.
