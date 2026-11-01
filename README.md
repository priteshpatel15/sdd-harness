# SDD Harness

**A TypeScript CLI that makes coding agents do spec-driven development for real: intent, approved specs, red/green TDD, isolated DB validation and Playwright proof, all persisted as evidence.**

Agents skip steps when nothing checks them. The SDD Harness keeps product intent, feature requirements, task groups, validation, semantic contracts, review findings, telemetry and completion gates in versionable files, and refuses to mark work complete without command-backed evidence.

Author: Pritesh Patel

## Quickstart

Requires Node.js 20+.

```bash
npm ci
npm run qa                      # typecheck + unit/integration tests + build
node dist/bin/sdd.js --help     # the `sdd` CLI
```

Try it on the sample app:

```bash
cd examples/sdd-test-product
npm ci
npx playwright install chromium   # first time only
npm run qa                        # typecheck + vitest + Playwright e2e
```

## Features

- Gated workflow: stakeholder/JTBD intake, constitution, feature spec, TDD plan, implementation, validation, deep review, semantic verify, completion.
- Command-backed red/green TDD evidence (`sdd feature record-tdd`), with explicit, approved waivers only.
- Data mutations validated against an isolated test-database copy plus a mutation verifier.
- UI flows proven by Playwright JSON reporter evidence.
- Resumable orchestrator (`sdd orchestrator ...`) that drives Codex or Claude for bounded drafting/implementation packets while the harness owns approvals and gates.
- Thin agent skills in `skills/` (with `sdd-operator` as the dispatcher) and exports to OpenSpec / Spec Kit.

## Repository layout

- `src/` - the CLI (Clean Architecture; see below).
- `skills/` - agent skills that call the CLI.
- `specs/` and `.sdd/` - this repo dogfooding itself: its own constitution, feature specs and the persisted evidence from building the harness. `tests/feature.test.ts` reads these files.
- `examples/sdd-test-product/` - a small React + Vite "Workflow Evidence Dashboard" built end to end by the harness's orchestrator. Its `specs/` and `.sdd/` show what the harness produces for a downstream project (constitution, feature spec, TDD/validation evidence); its own tests (Vitest + Playwright) run independently with their own `npm ci`.
- `docs/` - operator guide, architecture and adapter contracts.

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

For end-to-end operator workflows, see [Run And Use The SDD Harness](docs/run-and-use-sdd-harness.md). It covers greenfield and brownfield usage, human-controlled runs, orchestrated automation, mixed human/agent ownership, validation, database sandboxing, Playwright evidence, review, semantic verification, and generated artifacts. Use the project-local `sdd-operator` skill as the dispatcher for these workflows.

## CLI Defaults

- `sdd feature complete-task-group` requires command-backed red and green records from `sdd feature record-tdd` unless `--compat-tdd --waiver-reason ... --approved-by ...` is used.
- `sdd feature run-validation` requires Playwright JSON reporter evidence for mapped UI flows unless `--compat-playwright` is used.
- Any expected data mutation requires `--test-database` or `.sdd/database-sandbox.json`; expected mutation semantics also require `.sdd/database-mutation-verifier.json`.
- `sdd orchestrator init|configure|run|status|resume` provides a resumable control plane over the hard-gated workflow. The default profile pauses for human intent/spec answers, review decisions, and MVP judgment steps; uses the configured Codex/Claude provider only for bounded semantic drafting, implementation, refactor, and repair packets; and keeps harness-owned gates responsible for approvals, validation, review, telemetry, and completion.

## Architecture

The code follows Clean Architecture:

- `src/domain`: pure policy, models, parsing, validation, and workflow rules.
- `src/application`: use cases and ports.
- `src/adapters`: filesystem, git, command runners, Playwright, database sandboxing, telemetry, and spec persistence.
- `src/interfaces`: CLI entrypoint and context wiring.

See `docs/architecture.md` for implementation details.

## Testing

```bash
npm run qa                       # typecheck + vitest (unit, integration) + build
npm run test:e2e                 # Playwright fixture checks (tests/playwright)
npm run test:strict-e2e-fixture  # strict Playwright evidence fixture
```

## License

MIT - see [LICENSE](LICENSE).
