# Experience: Workflow Evidence Dashboard

## Experience Flows

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

## Coverage Mapping Rules

- Every `FLOW-*` entry must include a non-TODO `Playwright:` reference.
- Every `FLOW-*` entry must include `Database Mutations:`; read-only flows must say `Database Mutations: None`.
- The Playwright reference must identify a Playwright test file and test title with `path::title`.
- Data-changing workflows must run against an isolated test database copy.
