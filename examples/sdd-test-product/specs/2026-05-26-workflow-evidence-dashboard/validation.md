# Validation: Workflow Evidence Dashboard

## Automated

- **VAL-001:** Unit and module tests prove REQ-001 for Workflow Evidence Dashboard. Command: `npm test`.
- **VAL-002:** Typecheck/build constraints prove REQ-002 and architecture assumptions. Command: `npm run typecheck`.
- **VAL-003:** Playwright JSON reporter evidence proves REQ-001 for mapped UI flows. Command: `npm run test:e2e`.

## Manual

- **VAL-004:** Manual acceptance confirms REQ-001, REQ-002, REQ-003, REQ-004, REQ-005.

## Definition Of Done

- All automated checks pass.
- Manual acceptance matches `requirements.md`.
- UI work has Playwright workflow coverage.
- Database changes use an isolated test copy for validation.
- Telemetry and evidence are recorded under `.sdd/`.
