# Tech Stack

The technical constitution should mandate a decoupled stack organized around domain, application, adapter, and infrastructure layers. The specific framework choices are unresolved, but whichever stack is selected must support automated unit and integration tests, Playwright UI QA, real database testing against an isolated test copy, migrations or schema control, and structured telemetry for important product and workflow events.

## Existing Project Signals

No package or tooling files detected.

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
