# Tech Stack

TypeScript on Node.js, Clean Architecture, Vitest for unit/integration/e2e tests, Playwright JSON evidence for UI workflows, JSONL telemetry, and local command-backed adapters.

## Existing Project Signals

Scripts: build, typecheck, test, test:watch, test:e2e, test:strict-e2e-fixture, qa
Dev dependencies: @playwright/test, @types/node, tsx, typescript, vitest

## Architecture Standards

- Use Clean Architecture boundaries for domain, application, adapters, and interfaces.
- Apply SOLID principles within modules and classes.
- Keep dependencies pointing inward; framework code belongs in adapters or interfaces.
- Preserve decoupling so workflows can run through CLI, skills, ACP, or MCP adapters.

## Testing And QA

- Use test-driven development for domain functions, classes, modules, and workflows.
- Add integration tests for persistence, adapters, and CLI behavior.
- Add Playwright end-to-end coverage for any UI workflow.
- Run UI tests against an isolated copy of the real database when data modifications are involved.
- Emit telemetry for commands, decisions, gates, evidence, failures, and waivers.
