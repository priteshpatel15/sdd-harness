# Mission

Build a portable SDD Harness that turns approved intent into enforceable CLI gates, durable evidence, telemetry, and local validation.

## Target Audience

- Developers and technical leads who use AI coding agents and need command-backed proof that changes match approved specs.

## Stakeholder Inputs

# SDD Harness

The SDD Harness is a TypeScript CLI that enforces spec-driven development with persisted evidence. It keeps product intent, feature requirements, task groups, validation, semantic contracts, review findings, telemetry, and completion gates in versionable files.

## Intent

This repository is the reference implementation of the SDD workflow. It should dogfood the same process it enforces for downstream projects:

- Capture intent before writing specs.
- Approve specs before implementation.
- Complete task groups with command-backed red and green TDD evidence by default.
- Validate every data mutation against an isolated test database copy.
- Prove UI workflows through Playwright JSON reporter evidence.
- Keep domain, application, adapter, and interface boundaries decoupled.
- Emit structured telemetry for every major CLI workflow command.

## Common Commands

```bash
npm run typecheck
npm test
npm run build
npm run qa
```

## CLI Defaults

- `sdd feature complete-task-group` requires command-backed red and green records from `sdd feature record-tdd` unless `--compat-tdd --waiver-reason ... --approved-by ...` is used.
- `sdd feature run-validation` requires Playwright JSON reporter evidence for mapped UI flows unless `--compat-playwright` is used.
- Any expected data mutation requires `--test-database` or `.sdd/database-sandbox.json`; expected mutation semantics also require `.sdd/database-mutation-verifier.json`.

## Architecture

The code follows Clean Architecture:

- `src/domain`: pure policy, models, parsing, validation, and workflow rules.
- `src/application`: use cases and ports.
- `src/adapters`: filesystem, git, command runners, Playwright, database sandboxing, telemetry, and spec persistence.
- `src/interfaces`: CLI entrypoint and context wiring.

See `docs/architecture.md` for implementation details.

## What Success Looks Like

- The product solves the stated JTBD problem for the target audience.
- The implementation remains understandable, maintainable, testable, and safe to evolve.
- The validation plan can prove the delivered behavior matches the specification.
