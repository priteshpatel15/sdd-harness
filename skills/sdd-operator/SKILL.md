---
name: sdd-operator
description: "Dispatch full SDD Harness workflows across greenfield, brownfield, human-controlled, automated orchestrator, and mixed human/agent modes. Use when a user asks to run, start, resume, automate, or choose an end-to-end SDD workflow."
---

# SDD Operator

Use this skill as the workflow dispatcher. Do not duplicate SDD business rules, hand-write specs, bypass approvals, or mark completion outside the CLI. The `sdd` command owns gates, evidence, workflow state, telemetry, validation, approvals, and completion.

For detailed examples, read `docs/run-and-use-sdd-harness.md` only as needed.

## Start Every Run

Run readiness and state checks first:

```bash
sdd workflow status
sdd workflow doctor --strict
```

If the user asks to resume an existing automated run, inspect and resume instead:

```bash
sdd orchestrator status
sdd orchestrator resume
```

## Route The Workflow

Infer project mode and control mode from the request. Ask one clarifying question only when neither can be inferred.

Project mode:

- Brownfield: user mentions existing, legacy, current repo, onboard this app, or codebase discovery. Start with:

```bash
sdd brownfield discover
```

- Greenfield: default when the user is creating a new product, new app, new feature workflow, or gives no brownfield signal.

Control mode:

- Human-controlled: user wants step-by-step control, manual approval, or to choose each action. Use:

```bash
sdd workflow next
```

Then delegate to the relevant step skill and CLI command from the runbook.

- Automated: user wants automation, agent development, or the orchestrator. Configure/check the agent and run the orchestrator:

```bash
sdd agent configure --provider codex
sdd agent doctor --provider codex
sdd orchestrator init --agent codex --profile human-intent-ai-build
sdd orchestrator configure --step implement-feature --owner agent --repair agent --tdd-command "npm test"
sdd orchestrator configure --step feature-validation --owner harness --repair agent --validation-command "npm run qa"
sdd orchestrator run --target roadmap-next
```

Use `claude` instead of `codex` only when the user requests Claude or existing `.sdd/agents.json` is configured that way.

- Mixed ownership: safest automation default. Human owns stakeholder intent, constitution, feature specs, review decisions, and MVP judgment. Agent owns semantic drafting and implementation. Harness owns validation, review execution, semantic verification, changelog, and completion gates:

```bash
sdd orchestrator configure --step create-feature-spec --owner human
sdd orchestrator configure --step create-semantic-contract --owner agent
sdd orchestrator configure --step validate-final-feature-spec --owner harness
sdd orchestrator configure --step implement-feature --owner agent --repair human --tdd-command "npm test"
sdd orchestrator configure --step feature-validation --owner harness --repair human --validation-command "npm run qa"
sdd orchestrator configure --step review-subagent-recommendations --owner human
sdd orchestrator configure --step semantic-verification --owner harness
sdd orchestrator configure --step run-changelog-skill --owner harness
```

## Defaults And Guardrails

- If project mode is ambiguous, default to greenfield unless the user mentions an existing or legacy codebase.
- If control mode is ambiguous but the user asks for automation, default to mixed ownership.
- Keep data-changing validation on a test database copy or sandbox. Add `--test-database "<path>"` or configure `.sdd/database-sandbox.json` before running mutation-capable validation.
- For UI work, require Playwright coverage mapped from `experience.md`; do not treat manual screenshots as a replacement for `sdd feature run-validation`.
- For a fully new project, prefer `sdd workflow greenfield --agent codex --through feature` for early artifact creation, then use the orchestrator for implementation and validation.
- When a gate blocks, inspect the evidence path reported by `sdd`, repair only that failure, and rerun `sdd orchestrator resume` or the failed CLI command.

## Existing Step Skills

Delegate focused steps to the existing skills when appropriate:

- `jtbd-intake`
- `constitution`
- `brownfield-discovery`
- `feature-spec`
- `semantic-contract`
- `spec-validator`
- `tdd-implement`
- `validation-runner`
- `deep-review`
- `semantic-verify`
- `replan`
- `changelog`
- `mvp-planner`
- `research-backlog`
