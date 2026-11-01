# SDD Test Product

## Stakeholder Thoughts

- Operator=Use Clean Architecture, SOLID boundaries, plug-and-play adapters, full TDD, Playwright e2e coverage for every UI workflow, real database validation against an isolated test copy, and telemetry for important actions.

## About This Example

This sample app (a Workflow Evidence Dashboard) was bootstrapped and implemented by the SDD Harness orchestrator in the repo root. `specs/` and `.sdd/` are the artifacts the harness produced. Run it on its own:

```bash
npm ci
npx playwright install chromium   # first time only
npm run qa                        # typecheck + vitest + Playwright e2e
```
