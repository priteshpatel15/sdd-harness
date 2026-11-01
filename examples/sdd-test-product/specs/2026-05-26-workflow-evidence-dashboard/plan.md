# Plan: Workflow Evidence Dashboard

## 1. Tests First

Group ID: `group-1-tests-first`

1. [ ] Write unit and module tests for Workflow Evidence Dashboard. (Requirements: REQ-001; Validation: VAL-001)
2. [ ] Add integration tests for changed adapters, persistence, or CLI behavior. (Requirements: REQ-002; Validation: VAL-002)
3. [ ] Add Playwright workflow tests if UI behavior is in scope. (Requirements: REQ-003; Validation: VAL-003)

## 2. Implementation

Group ID: `group-2-implementation`

1. [ ] Deliver roadmap item: Define acceptance criteria (Requirements: REQ-001; Validation: VAL-001)
2. [ ] Deliver roadmap item: Implement with TDD (Requirements: REQ-001; Validation: VAL-001)
3. [ ] Deliver roadmap item: Validate and collect evidence (Requirements: REQ-001; Validation: VAL-001)
4. [ ] Apply decision: Use TypeScript throughout. Use a Vite React UI and a small Node HTTP API for the local app shell. Keep Clean Architecture layers explicit: src/domain for entities and rules, src/application for use cases and ports, src/adapters for SQLite and telemetry implementations, and src/interfaces for HTTP and React UI. Use SQLite through a swappable persistence adapter with DATABASE_PATH pointing to the active database. Use Vitest for unit and integration tests, Playwright for browser workflows, and structured JSONL telemetry for important actions. (Requirements: REQ-002; Validation: VAL-002)
5. [ ] Honor context: This feature must prove the SDD harness expectations in a realistic greenfield product. The UI must not write directly to storage (Requirements: REQ-003; Validation: VAL-002)

## 3. Validation And Evidence

Group ID: `group-3-validation`

1. [ ] Run typecheck, unit tests, integration tests, and build. (Requirements: REQ-001; Validation: VAL-001, VAL-002)
2. [ ] Run UI/e2e tests against an isolated test database copy when applicable. (Requirements: REQ-003; Validation: VAL-003)
3. [ ] Record telemetry, review findings, and final acceptance evidence. (Requirements: REQ-004; Validation: VAL-004)
