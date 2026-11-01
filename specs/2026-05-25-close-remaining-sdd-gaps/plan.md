# Plan: Close Remaining SDD Gaps

## 1. Contract Regressions

Group ID: `group-1-contract-regressions`

1. [x] Fix approval hash evidence tests. (Requirements: REQ-001; Validation: VAL-001)
2. [x] Require `Database Mutations` in UI flows. (Requirements: REQ-002; Validation: VAL-001)
3. [x] Tie strict task completion evidence to recorded red/green test files. (Requirements: REQ-003; Validation: VAL-002)

## 2. Adapter Replaceability

Group ID: `group-2-adapter-replaceability`

1. [x] Document adapter contracts and command-backed configuration. (Requirements: REQ-004; Validation: VAL-003)
2. [x] Add command-backed UI inventory discovery. (Requirements: REQ-005; Validation: VAL-002)
3. [x] Add shared command execution/evidence utilities. (Requirements: REQ-006; Validation: VAL-004)
4. [x] Split oversized browser, spec-store, and CLI modules. (Requirements: REQ-007; Validation: VAL-004)

## 3. Data And Telemetry Proof

Group ID: `group-3-data-telemetry-proof`

1. [x] Add real SQLite copy mutation coverage in the CLI test suite. (Requirements: REQ-008; Validation: VAL-002)
2. [x] Update the strict Playwright fixture to use a real SQLite database copy. (Requirements: REQ-008; Validation: VAL-005)
3. [x] Emit file evidence from artifact-writing telemetry outputs. (Requirements: REQ-009; Validation: VAL-001)
4. [x] Mark roadmap adapter replaceability complete after tests pass. (Requirements: REQ-004, REQ-006, REQ-007; Validation: VAL-006)
