# Run And Use The SDD Harness

This guide explains how to run the SDD Harness as an operator. It covers greenfield and brownfield projects, with human-controlled, automated, and mixed human/agent modes.

The harness is intentionally strict. Specs, approvals, validation, database mutation proof, Playwright UI evidence, semantic verification, review decisions, changelog updates, and telemetry are stored as files so the workflow can be audited and repeated.

## Prerequisites

- Node.js 20 or newer.
- Project dependencies installed with `npm install`.
- A built CLI when using the local `sdd` binary from this repository.
- Git when using branch gates such as `sdd workflow branch`.
- Playwright when the feature has UI workflows.
- A test database copy or sandbox config for data-changing validation.
- Optional Codex or Claude CLI access when using agent-owned drafting or implementation.

From this repository:

```bash
npm install
npm run build
npm run typecheck
npm test
npm run qa
```

Run the CLI from the repository root after build:

```bash
node dist/bin/sdd.js help
```

If the package is linked or installed, use:

```bash
sdd help
```

All commands accept `--project <path>`. Use it when the harness command is launched outside the target project root:

```bash
sdd workflow status --project /path/to/project
```

## First-Time Readiness

Run doctor before starting real work:

```bash
sdd workflow doctor
sdd workflow doctor --strict
```

Normal doctor checks for the minimum practical workflow: package scripts, Playwright readiness for UI validation, review agents or `.sdd/agents.json`, semantic verifiers or `.sdd/agents.json`, and database sandbox readiness guidance.

Strict doctor also expects optional but production-grade integrations:

- `.sdd/user-question-adapter.json` for live grouped question capture.
- `.sdd/database-mutation-verifier.json` for expected database mutation assertions.
- `.sdd/docs-lookup.json` for docs lookup readiness.
- `.sdd/issue-tracker.json` for issue context readiness.
- Clean Architecture policy compliance under `src/domain`, `src/application`, and `src/adapters`.

Check current progress at any time:

```bash
sdd workflow status
sdd workflow next
```

`workflow status` prints every SDD step, its status, automation level, command, blockers, and the next command. `workflow next` prints the first incomplete course step.

## Operator Skill

Use the project-local `sdd-operator` skill as the meta workflow dispatcher for this guide. It routes greenfield vs brownfield and human-controlled vs automated vs mixed ownership requests, then delegates to `sdd` and the existing step skills. The skill does not replace the CLI gates; `sdd` remains the source of truth for workflow state, validation, approvals, evidence, telemetry, and completion.

Invoke it when you want the agent to choose and run the right workflow shape:

```text
Use $sdd-operator to start a greenfield SDD workflow with mixed human/agent ownership.
Use $sdd-operator to onboard this existing app as brownfield and pause for human spec decisions.
Use $sdd-operator to resume the current orchestrated run.
Use $sdd-operator to automate implementation and validation for the current approved feature.
```

The operator skill starts by checking current state and readiness:

```bash
sdd workflow status
sdd workflow doctor --strict
```

If the request is a resume request, it checks the orchestrator instead:

```bash
sdd orchestrator status
sdd orchestrator resume
```

Routing defaults:

| Signal | Operator route |
| --- | --- |
| Existing, legacy, current repo, or onboard this app | Brownfield; run `sdd brownfield discover` before constitution or feature work. |
| New product, new app, or no brownfield signal | Greenfield. |
| Step-by-step, manual, control each step | Human-controlled; use `sdd workflow next` and the relevant step skill. |
| Automate, agent development, or orchestrator | Automated or mixed ownership; configure agent/orchestrator and run `sdd orchestrator run`. |
| Automation requested but ownership is not specified | Mixed ownership by default. |

The mixed default is intentionally conservative: humans own stakeholder intent, constitution, feature specs, review decisions, and MVP judgment; agents own semantic drafting and implementation; the harness owns validation, review execution, semantic verification, changelog, and completion gates.

The operator skill is not a replacement for the focused step skills. It should delegate when work narrows to a specific phase:

| Phase | Focused skill |
| --- | --- |
| JTBD intake | `jtbd-intake` |
| Constitution | `constitution` |
| Brownfield discovery | `brownfield-discovery` |
| Feature spec | `feature-spec` |
| Semantic contract | `semantic-contract` |
| Spec validation | `spec-validator` |
| TDD implementation | `tdd-implement` |
| Validation | `validation-runner` |
| Deep review | `deep-review` |
| Semantic verification | `semantic-verify` |
| Replanning | `replan` |
| Changelog | `changelog` |
| MVP planning | `mvp-planner` |
| Research backlog | `research-backlog` |

Keep the same guardrails when using the skill: do not hand-write specs outside `sdd`, do not bypass approvals, do not treat manual screenshots as Playwright evidence, and do not run data-changing validation against the source database.

## Core Mental Model

The SDD Harness separates ownership into three roles:

| Owner | Meaning | Typical use |
| --- | --- | --- |
| `human` | The orchestrator pauses and prints the next command for a person to run. | Intent, product judgment, review decisions, MVP judgment. |
| `agent` | The configured Codex or Claude provider drafts or implements bounded work. | Feature drafting, semantic drafting, TDD red/green/refactor implementation, repair. |
| `harness` | The CLI executes deterministic gates and records evidence. | Validation, approvals, checkpoints, deep review, semantic verification, changelog, completion. |

Agents do not approve specs, accept review findings, mark work complete, bypass validation, or own final evidence. They draft and implement only where a step is explicitly configured as `agent`. The harness still owns gates, artifacts, telemetry, and completion.

Repair ownership controls what happens after a gate fails:

| Repair | Meaning |
| --- | --- |
| `none` | Stop as blocked or failed. A person must inspect and rerun. |
| `agent` | Let the configured agent attempt a bounded repair, then rerun the failed step. |
| `human` | Pause with the relevant next command and require a person to repair. |

## Greenfield: Human-Controlled Step By Step

Use this mode when you want to control each step and manually approve every decision.

1. Capture stakeholder context and JTBD:

```bash
sdd stakeholder setup \
  --product "Example Product" \
  --thought "Founder=Users need a faster way to complete the core workflow"

sdd jtbd intake \
  --product "Example Product" \
  --description "Short product description" \
  --audience "Primary users" \
  --problem "Problem being solved" \
  --job "Job the user hires the product to do" \
  --situation "When this job happens" \
  --motivation "Why the user cares" \
  --outcome "Desired measurable outcome"
```

2. Capture constitution answers and create the constitution:

```bash
sdd questions capture \
  --workflow constitution \
  --output constitution-questions.json

sdd constitution create --questions constitution-questions.json
sdd constitution validate
sdd constitution approve --reviewer "Architect"
```

3. Record a context reset before feature work:

```bash
sdd workflow checkpoint \
  --step clear-context-before-feature-spec \
  --kind context-reset \
  --notes "Cleared constitution context before feature spec."
```

4. Create a feature branch, capture feature answers, and create the feature spec:

```bash
sdd workflow branch --purpose feature --name "First Feature"

sdd questions capture \
  --workflow feature-spec \
  --output feature-questions.json

sdd feature create \
  --name "First Feature" \
  --questions feature-questions.json
```

Feature question evidence must include `scope`, `decisions`, `context`, and `experience`. For non-UI features, `experience` must explicitly state there is no UI-facing experience. For UI features, `experience` must include `FLOW-*` entries with role, route or screen, happy path, edge/error states, data setup, expected visible outcome, database mutations when relevant, and Playwright mapping.

5. Revise, create semantics, validate, and approve:

```bash
sdd feature revise \
  --feature <feature-id> \
  --request "Clarify acceptance criteria for the primary workflow."

sdd questions capture \
  --workflow semantic-contract \
  --output semantic-questions.json

sdd feature semantics \
  --feature <feature-id> \
  --questions semantic-questions.json

sdd feature validate-spec --feature <feature-id>
sdd feature approve --feature <feature-id> --reviewer "Architect"
```

6. Record a context reset before implementation:

```bash
sdd workflow checkpoint \
  --step clear-context-before-implementation \
  --kind context-reset \
  --feature <feature-id> \
  --notes "Cleared spec context before implementation."
```

7. Plan TDD and implement task groups manually:

```bash
sdd feature plan-tdd --feature <feature-id>
sdd feature implement --feature <feature-id> --task-group <task-group-id>
```

For strict evidence, record red and green command-backed TDD phases:

```bash
sdd feature record-tdd \
  --feature <feature-id> \
  --task-group <task-group-id> \
  --phase red \
  --command "npm test" \
  --evidence "tests/example.test.ts::<task-group-id>::VAL-001"

sdd feature record-tdd \
  --feature <feature-id> \
  --task-group <task-group-id> \
  --phase green \
  --command "npm test" \
  --evidence "tests/example.test.ts::<task-group-id>::VAL-001"

sdd feature complete-task-group \
  --feature <feature-id> \
  --task-group <task-group-id> \
  --strict-tdd \
  --implementation-evidence "src/example.ts::<task-group-id>" \
  --test-evidence "tests/example.test.ts::<task-group-id>::VAL-001"
```

8. Validate with real commands and isolated data:

```bash
sdd feature run-validation \
  --feature <feature-id> \
  --command "npm run typecheck" \
  --command "npm test" \
  --command "npm run build" \
  --command "npm run test:e2e" \
  --strict-playwright \
  --test-database ./dev.db
```

For non-file databases, configure `.sdd/database-sandbox.json` instead of passing `--test-database`. When expected mutations exist, also configure `.sdd/database-mutation-verifier.json`.

9. Run review, semantic verification, review decisions, changelog, and completion:

```bash
sdd feature deep-review --feature <feature-id>
sdd feature semantic-verify --feature <feature-id>

sdd feature review-decisions \
  --feature <feature-id> \
  --decision "finding-id|accepted|reason|evidence/path"

sdd changelog update

sdd feature complete \
  --feature <feature-id> \
  --roadmap-evidence specs/roadmap.md
```

10. Plan and validate MVP when the workflow reaches MVP steps:

```bash
sdd workflow branch --purpose mvp --name "MVP"
sdd questions capture --workflow mvp --output mvp-questions.json
sdd mvp plan --questions mvp-questions.json
sdd mvp retro --feature <feature-id> --findings "MVP validation findings."
```

## Greenfield: Automated Development

Use this mode when you want the harness to drive the workflow and delegate allowed work to a configured agent.

The orchestrator is strict about ownership. From a completely empty project, `create-constitution` is intentionally human-owned and has no bounded orchestrator action. For the lowest-touch greenfield start, use `sdd workflow greenfield --agent codex --through feature` to create the early artifacts, then use the orchestrator for implementation and validation. If you want the orchestrator to let an agent create a feature spec, configure `create-feature-spec` as `agent` and provide an approved branch-gate waiver or create branch evidence first.

1. Configure an agent provider:

```bash
sdd agent configure --provider codex
sdd agent doctor --provider codex
```

The default Codex templates use read-only sandboxing for drafting and workspace-write sandboxing for implementation. You can override templates:

```bash
sdd agent configure \
  --provider codex \
  --draft-command "codex exec -C {projectRoot} --sandbox read-only --ask-for-approval never --output-schema {schemaFile} --output-last-message {outputFile} -" \
  --review-command "codex exec -C {projectRoot} --sandbox read-only --ask-for-approval never --output-schema {schemaFile} --output-last-message {outputFile} -" \
  --implementation-command "codex exec -C {projectRoot} --sandbox workspace-write --ask-for-approval never -" \
  --required-lens architecture \
  --required-lens spec-alignment \
  --required-lens test-and-qa
```

2. Initialize orchestrator:

```bash
sdd orchestrator init \
  --agent codex \
  --profile human-intent-ai-build \
  --approved-by "Orchestrator"
```

The only supported profile is `human-intent-ai-build`. Its default policy keeps stakeholder intent, constitution creation, feature spec creation, review decisions, MVP branching, and MVP validation human-owned. It delegates semantic contract drafting and implementation to the agent. Harness-owned gates handle validation and completion work.

3. Configure automated implementation and validation:

```bash
sdd orchestrator configure \
  --step implement-feature \
  --owner agent \
  --repair agent \
  --tdd-command "npm test" \
  --refactor-enabled true

sdd orchestrator configure \
  --step feature-validation \
  --owner harness \
  --repair agent \
  --validation-command "npm run typecheck" \
  --validation-command "npm test" \
  --validation-command "npm run build" \
  --validation-command "npm run test:e2e" \
  --test-database ./dev.db
```

Optional feature-spec automation after constitution exists:

```bash
sdd orchestrator configure \
  --step create-feature-spec \
  --owner agent \
  --waiver-reason "Approved automated feature draft for this greenfield run" \
  --approved-by "Architect"
```

4. Run until it pauses, blocks, or completes:

```bash
sdd orchestrator run --target roadmap-next
sdd orchestrator status
sdd orchestrator resume
```

`run --target roadmap-next` works from the next incomplete workflow step. Use `run --feature <feature-id>` when you want to focus on a specific feature.

The orchestrator may pause for human-owned steps. Run the printed next command, then resume:

```bash
sdd orchestrator resume
```

## Greenfield: Mixed Human And Agent Control

Use mixed mode when you want to automate selected steps and keep judgment-heavy steps human-owned.

Start with the same setup:

```bash
sdd agent configure --provider codex
sdd agent doctor --provider codex
sdd orchestrator init --agent codex --profile human-intent-ai-build
```

Then choose step ownership:

```bash
sdd orchestrator configure --step create-feature-spec --owner human
sdd orchestrator configure --step create-semantic-contract --owner agent
sdd orchestrator configure --step validate-final-feature-spec --owner harness
sdd orchestrator configure --step implement-feature --owner agent --repair agent --tdd-command "npm test"
sdd orchestrator configure --step feature-validation --owner harness --repair agent --validation-command "npm run qa" --test-database ./dev.db
sdd orchestrator configure --step review-subagent-recommendations --owner human
sdd orchestrator configure --step semantic-verification --owner harness
sdd orchestrator configure --step run-changelog-skill --owner harness
```

Common mixed patterns:

| Pattern | Configuration |
| --- | --- |
| Human specs, agent code | Keep `create-constitution` and `create-feature-spec` as `human`; set `create-semantic-contract` and `implement-feature` to `agent`; keep validation as `harness`. |
| Agent drafts, human approvals | Set `create-feature-spec` to `agent` only if branch and waiver requirements are intentionally configured; keep `validate-final-feature-spec` as `harness` and review decisions as `human`. |
| Human repair on validation | Set `feature-validation --owner harness --repair human`. The run pauses with a repair command after a failing gate. |
| Automatic clean review disposition | Set `review-subagent-recommendations --owner harness --auto-record-empty-review-decisions` only when no warning or blocking findings need human disposition. |
| Disable guided no-op completion | Set a guided/no-op step with `--complete-noop-guided-steps false` to force a block instead of an automatic checkpoint. |

Run:

```bash
sdd orchestrator run --target roadmap-next
```

Then repeat:

```bash
sdd orchestrator status
sdd orchestrator resume
```

## Brownfield: Human-Controlled Step By Step

Use this mode when the target project already exists and you want to inspect what the harness discovered before writing specs.

1. Discover the existing project:

```bash
sdd brownfield discover
```

This writes `.sdd/brownfield-profile.json` and updates brownfield discovery state. The profile captures additive signals such as package scripts, validation command candidates, routes, database schema or migration summaries, and UI entry candidates.

2. Review readiness:

```bash
sdd workflow doctor --strict
sdd workflow status
```

3. Capture constitution and feature evidence using the discovered context:

```bash
sdd questions capture --workflow constitution --output constitution-questions.json
sdd constitution create --questions constitution-questions.json
sdd constitution validate
sdd constitution approve --reviewer "Architect"

sdd workflow checkpoint \
  --step clear-context-before-feature-spec \
  --kind context-reset \
  --notes "Reviewed brownfield profile before feature specification."
```

4. Create feature specs against the existing system:

```bash
sdd workflow branch --purpose feature --name "Brownfield Change"
sdd questions capture --workflow feature-spec --output feature-questions.json
sdd feature create --name "Brownfield Change" --questions feature-questions.json
```

The feature `context` answer should reference existing routes, files, database tables, migrations, commands, and constraints discovered from the brownfield profile. Do not rely on discovery alone as approval evidence; the final spec still needs explicit grouped answers and approval.

5. Continue through the same strict feature lifecycle:

```bash
sdd questions capture --workflow semantic-contract --output semantic-questions.json
sdd feature semantics --feature <feature-id> --questions semantic-questions.json
sdd feature validate-spec --feature <feature-id>
sdd feature approve --feature <feature-id> --reviewer "Architect"
sdd workflow checkpoint --step clear-context-before-implementation --kind context-reset --feature <feature-id> --notes "Ready for brownfield implementation."
sdd feature plan-tdd --feature <feature-id>
sdd feature implement --feature <feature-id> --task-group <task-group-id>
sdd feature run-validation --feature <feature-id> --command "npm run qa" --strict-playwright --test-database ./dev.db
sdd feature deep-review --feature <feature-id>
sdd feature semantic-verify --feature <feature-id>
sdd feature review-decisions --feature <feature-id> --decision "finding-id|accepted|reason|evidence/path"
sdd changelog update
sdd feature complete --feature <feature-id> --roadmap-evidence specs/roadmap.md
```

## Brownfield: Automated Development

Use this mode when the project already exists and you want automation after discovery.

1. Discover and verify readiness:

```bash
sdd brownfield discover
sdd workflow doctor --strict
```

2. Configure the agent and orchestrator:

```bash
sdd agent configure --provider codex
sdd agent doctor --provider codex
sdd orchestrator init --agent codex --profile human-intent-ai-build
```

3. Configure agent and harness-owned steps:

```bash
sdd orchestrator configure --step create-semantic-contract --owner agent
sdd orchestrator configure --step implement-feature --owner agent --repair agent --tdd-command "npm test" --refactor-enabled true
sdd orchestrator configure --step feature-validation --owner harness --repair agent --validation-command "npm run qa" --test-database ./dev.db
sdd orchestrator configure --step further-validation --owner harness --validation-command "npm run qa" --test-database ./dev.db
sdd orchestrator configure --step validate-not-lied-to --owner harness
sdd orchestrator configure --step semantic-verification --owner harness
sdd orchestrator configure --step run-changelog-skill --owner harness
```

4. Run and resume:

```bash
sdd orchestrator run --target roadmap-next
sdd orchestrator status
sdd orchestrator resume
```

The default profile still pauses for human-owned brownfield decisions such as stakeholder intent, constitution creation, feature spec creation, review decisions, MVP branching, and MVP validation. That is usually desirable because brownfield constraints are product and system judgment, not just implementation.

## Brownfield: Mixed Human And Agent Control

Use this mode when you want the harness to automate only the safe, bounded parts of a brownfield change.

Recommended brownfield mixed policy:

```bash
sdd brownfield discover
sdd agent configure --provider codex
sdd orchestrator init --agent codex --profile human-intent-ai-build

sdd orchestrator configure --step create-constitution --owner human
sdd orchestrator configure --step create-feature-spec --owner human
sdd orchestrator configure --step create-semantic-contract --owner agent
sdd orchestrator configure --step validate-final-feature-spec --owner harness
sdd orchestrator configure --step implement-feature --owner agent --repair human --tdd-command "npm test"
sdd orchestrator configure --step feature-validation --owner harness --repair human --validation-command "npm run qa" --test-database ./dev.db
sdd orchestrator configure --step validate-not-lied-to --owner harness
sdd orchestrator configure --step semantic-verification --owner harness
sdd orchestrator configure --step review-subagent-recommendations --owner human
sdd orchestrator configure --step run-changelog-skill --owner harness
```

Use `--repair human` in brownfield when an automated repair could modify too much of the existing system. Use `--repair agent` only when the approved spec and test evidence create a narrow enough repair target.

## Guided Greenfield Shortcut

`workflow greenfield` is a guided shortcut for creating early artifacts. It is useful for a new project when you want a single command to produce constitution or feature artifacts from supplied inputs and agent drafts.

```bash
sdd workflow greenfield \
  --agent codex \
  --through feature \
  --reviewer "Architect" \
  --product "Example Product" \
  --description "Short description" \
  --audience "Primary users" \
  --problem "Problem to solve" \
  --job "Job to be done" \
  --feature-name "First Feature"
```

Targets:

| `--through` | Meaning |
| --- | --- |
| `constitution` | Create or draft JTBD and constitution artifacts, then stop. |
| `feature` | Continue through feature spec, semantic contract, approval, TDD plan, and implementation packet creation. |
| `mvp` | Continue through the MVP spec path after the feature path. |

Other useful options:

| Option | Meaning |
| --- | --- |
| `--draft-only` | Write agent draft question evidence and thinking files without creating final specs. |
| `--agent codex|claude` | Agent provider for guided drafts. Omit only when `.sdd/agents.json` has a configured default provider. |
| `--reviewer <name>` | Reviewer recorded for approvals created by the guided workflow. |
| `--thought <name=thought>` | Stakeholder thoughts to seed `stakeholder setup`; repeatable. |

## Automation Control Matrix

These are the workflow step IDs accepted by `sdd orchestrator configure --step <id>`.

| Step | Default profile owner | Automatable action |
| --- | --- | --- |
| `setup-stakeholder-thoughts` | `human` | Human command for stakeholder setup and JTBD intake. |
| `create-constitution` | `human` | No bounded orchestrator automation; use human or `workflow greenfield`. |
| `validate-constitution` | `harness` | Validate and approve constitution. |
| `clear-context-before-feature-spec` | `harness` | Record context-reset checkpoint. |
| `create-feature-spec` | `human` | Agent can draft and create feature spec when configured and branch/waiver gates are satisfied. |
| `iterate-feature-spec` | `harness` | Record no-change checkpoint unless a human revision is needed. |
| `create-semantic-contract` | `agent` | Agent drafts semantic answers; harness writes and validates contract. |
| `validate-final-feature-spec` | `harness` | Validate and approve feature spec. |
| `clear-context-before-implementation` | `harness` | Record context-reset checkpoint. |
| `implement-feature` | `agent` | Agent performs red, green, optional refactor; harness records TDD and task-group completion. |
| `feature-validation` | `harness` | Run configured validation commands, Playwright checks, and database sandbox verification. |
| `replanning` | `harness` | Record guided no-op checkpoint by default. |
| `new-idea-skill` | `harness` | Record guided no-op checkpoint by default. |
| `repeat-feature-step` | `harness` | Record guided no-op checkpoint by default. |
| `further-validation` | `harness` | Run additional validation commands and checkpoint. |
| `validate-not-lied-to` | `harness` | Run deep review agents. |
| `semantic-verification` | `harness` | Run semantic verifier agents. |
| `review-subagent-recommendations` | `human` | Human review decisions by default; harness can auto-record empty decisions only when configured. |
| `run-changelog-skill` | `harness` | Update changelog and mark feature complete. |
| `mvp-spec-branch` | `human` | Human branch and MVP spec creation. |
| `validation-of-mvp` | `human` | Human MVP retro. |
| `create-auto-workflow-with-skills` | `harness` | Validate skill wrappers. |

Configure examples:

```bash
sdd orchestrator configure --step create-semantic-contract --owner agent
sdd orchestrator configure --step implement-feature --owner agent --repair agent --max-repair-attempts 3
sdd orchestrator configure --step feature-validation --owner harness --repair human --validation-command "npm run qa"
sdd orchestrator configure --step review-subagent-recommendations --owner harness --auto-record-empty-review-decisions
sdd orchestrator configure --step replanning --owner harness --complete-noop-guided-steps false
```

## Option Reference

### Project And Workflow

| Option or command | Meaning |
| --- | --- |
| `--project <path>` | Run the command against another project root. |
| `sdd workflow status` | Print all workflow steps, status, automation level, command, blockers, and next command. |
| `sdd workflow next` | Print the first incomplete non-brownfield step and command. |
| `sdd workflow doctor` | Check normal readiness. |
| `sdd workflow doctor --strict` | Check strict readiness, including optional adapters and architecture policy. |
| `sdd workflow checkpoint --step <id> --kind <kind> --notes <text>` | Mark a manual or harness checkpoint as complete. |
| `sdd workflow branch --purpose <purpose> --name <name>` | Create branch evidence for constitution, feature, replan, MVP, or workflow work. |
| `sdd workflow branch --allow-dirty` | Allow branch evidence when the working tree has uncommitted changes. |
| `sdd workflow greenfield` | Guided greenfield artifact creation using explicit inputs and/or agent drafts. |

Checkpoint kinds:

| Kind | Meaning |
| --- | --- |
| `context-reset` | A deliberate context reset before the next stage. |
| `architect-review` | Manual architecture review checkpoint. |
| `app-walkthrough` | Manual application walkthrough checkpoint. |
| `merge-decision` | Manual merge decision checkpoint. |
| `supervisor-note` | Supervisor or orchestrator note. |
| `manual` | General manual checkpoint. |

Branch purposes:

| Purpose | Meaning |
| --- | --- |
| `constitution` | Constitution branch evidence. |
| `feature` | Feature spec and implementation branch evidence. |
| `replan` | Replanning branch evidence. |
| `mvp` | MVP spec branch evidence. |
| `workflow` | Workflow or skill branch evidence. |

### Questions

| Option or command | Meaning |
| --- | --- |
| `sdd questions capture --workflow <workflow> --output <file>` | Capture grouped question evidence using a configured question adapter or interactive Node CLI prompts. |
| `--workflow constitution` | Capture mission, target audience, tech stack, and roadmap answers. |
| `--workflow feature-spec` | Capture scope, decisions, context, and experience answers. |
| `--workflow semantic-contract` | Capture actors, outcomes, entities, commands, states, invariants, scenarios, oracles, data, telemetry, and architecture answers. |
| `--workflow mvp` | Capture MVP planning answers. |
| `--answer key=value` | Provide an answer non-interactively; repeatable. |
| `--questions <file>` | Feed persisted grouped question evidence into spec-writing commands. |

Spec-writing commands reject question files with the wrong workflow, prompt ID, or prompt hash. Re-run `questions capture` after canonical prompt changes.

### Agent Provider

| Option or command | Meaning |
| --- | --- |
| `sdd agent configure --provider codex|claude` | Write `.sdd/agents.json` and set the default provider. |
| `--draft-command <template>` | Command template used for draft JSON output. |
| `--review-command <template>` | Command template used for review JSON output. |
| `--implementation-command <template>` | Command template used for red, green, refactor, and repair implementation phases. |
| `--required-lens <lens>` | Required review lens; repeatable. Valid values are `architecture`, `spec-alignment`, `test-and-qa`, `experience-and-playwright`. |
| `sdd agent doctor --provider codex|claude` | Verify provider CLI availability and `.sdd/agents.json` readiness. |

Provider command templates can use placeholders such as `{projectRoot}`, `{promptFile}`, `{schemaFile}`, `{outputFile}`, `{purpose}`, `{phase}`, `{featureId}`, `{taskGroup}`, and `{lens}`.

### Orchestrator

| Option or command | Meaning |
| --- | --- |
| `sdd orchestrator init --agent codex|claude --profile human-intent-ai-build` | Create `.sdd/orchestrator.json`. |
| `--approved-by <name>` | Default approver recorded for harness-owned approvals or waivers. |
| `--force` | Replace existing orchestrator config. |
| `sdd orchestrator configure --step <id>` | Update ownership, repair, and step-specific policy. |
| `--owner human|agent|harness` | Set who owns the step. |
| `--repair none|agent|human` | Set failure repair behavior. |
| `--max-repair-attempts <n>` | Limit agent repair attempts for the step. |
| `--validation-command <command>` | Validation command for validation steps; repeatable. |
| `--tdd-command <command>` | Command recorded for orchestrated red/green/refactor TDD evidence. |
| `--test-database <path>` | Source database file to copy into `.sdd/test-db/` for validation. |
| `--test-database-env <name>` | Environment variable name that receives the test database path or URL. |
| `--refactor-enabled true|false` | Enable or disable orchestrated refactor after green. Only valid for `implement-feature`. |
| `--complete-noop-guided-steps true|false` | Allow or block automatic checkpointing for guided/no-op steps. |
| `--auto-record-empty-review-decisions` | Let harness record empty review decisions when there are no findings to disposition. |
| `sdd orchestrator run --target roadmap-next` | Start a run from the next incomplete workflow step. |
| `sdd orchestrator run --feature <feature-id>` | Start a run focused on a feature. |
| `sdd orchestrator status` | Print config, state, current step, current policy, pause reason, and next command. |
| `sdd orchestrator resume` | Resume a paused or failed run after human work or repair. |

### Validation, TDD, Waivers, And Compatibility

| Option | Meaning |
| --- | --- |
| `--command <command>` | Validation or TDD command; repeatable in `run-validation`. |
| `--strict-playwright` | Require strict Playwright JSON reporter evidence for mapped UI flows. |
| `--compat-playwright` | Waiver path for title-only Playwright stdout when JSON reporter evidence is unavailable. |
| `--test-database <path>` | Copy a file database and mutate only the copy during validation. |
| `--test-database-env <name>` | Expose the copied/sandbox database through this environment variable instead of the default. |
| `--phase red|green|refactor` | TDD phase for `feature record-tdd`. |
| `--strict-tdd` | Require strict red/green evidence for `feature complete-task-group`. |
| `--compat-tdd` | Waiver path for legacy completion without command-backed red/green records. |
| `--waiver-reason <text>` | Required reason when using compatibility or waiver paths. |
| `--approved-by <name>` | Required approver when using compatibility or waiver paths. |

Compatibility flags are exceptions. They must not become the normal path for new work.

## Generated Artifacts And Evidence

| Path | Meaning |
| --- | --- |
| `specs/jtbd.md` | Jobs-to-be-done intake. |
| `specs/mission.md` | Product mission constitution artifact. |
| `specs/tech-stack.md` | Technical constitution artifact. |
| `specs/roadmap.md` | Roadmap constitution artifact. |
| `specs/<feature-id>/requirements.md` | Feature requirements. |
| `specs/<feature-id>/plan.md` | Feature implementation plan and task groups. |
| `specs/<feature-id>/validation.md` | Validation plan. |
| `specs/<feature-id>/experience.md` | UI experience and Playwright mapping when UI-facing. |
| `specs/<feature-id>/semantics.md` | Semantic contract in human-readable form. |
| `specs/<feature-id>/tdd-plan.md` | TDD plan. |
| `.sdd/workflow-state.json` | Current workflow step state. |
| `.sdd/question-evidence.jsonl` | Persisted grouped question evidence records. |
| `.sdd/orchestrator.json` | Orchestrator config. |
| `.sdd/orchestrator-state.json` | Current orchestrator run state. |
| `.sdd/evidence/*` | Command logs, validation evidence, expected mutation JSON, and related proof. |
| `.sdd/telemetry.jsonl` | Structured telemetry for CLI workflows. |
| `.sdd/test-db/*.copy` | Isolated file database copies used for validation. |
| `.sdd/semantic-contracts/*.json` | Machine-readable semantic contracts. |
| `.sdd/approvals.jsonl` | Constitution and feature approval records. |
| `.sdd/task-groups.jsonl` | Task-group completion records. |
| `.sdd/tdd-evidence.jsonl` | Red, green, and refactor evidence records. |
| `.sdd/validation-summaries.jsonl` | Validation summaries. |
| `.sdd/review-summaries.jsonl` | Deep review summaries. |
| `.sdd/semantic-verifications.jsonl` | Semantic verification summaries. |
| `.sdd/review-decisions.jsonl` | Human or configured harness review dispositions. |
| `.sdd/brownfield-profile.json` | Brownfield discovery profile. |
| `.sdd/agent-runs/*` | Agent prompts, schemas, outputs, and implementation evidence. |
| `.sdd/orchestrator-evidence/*` | Orchestrated TDD and repair evidence. |

## UI, Database, Review, And Telemetry Expectations

UI work must be represented in `experience.md` with concrete `FLOW-*` entries. Validation must map each flow to Playwright test file and title evidence. Prefer:

```bash
npm run test:e2e
sdd feature run-validation --feature <feature-id> --command "npm run test:e2e" --strict-playwright
```

Data-changing work must validate against an isolated test database:

```bash
sdd feature run-validation \
  --feature <feature-id> \
  --command "npm run qa" \
  --test-database ./dev.db \
  --test-database-env DATABASE_URL
```

When expected mutations are declared, configure `.sdd/database-mutation-verifier.json` so the harness can prove the isolated database contains the expected changes while the original database remains unchanged.

Deep review and semantic verification use command-backed adapters from `.sdd/review-agents.json`, `.sdd/semantic-verifiers.json`, or `.sdd/agents.json`. Their output is evidence, not automatic permission to merge. Findings still need review decisions unless the orchestrator is explicitly configured to auto-record empty decisions.

Telemetry is written for major CLI workflows to `.sdd/telemetry.jsonl` and command evidence is written under `.sdd/evidence/`. Treat these files as part of the audit trail.

## Troubleshooting

| Symptom | Meaning | Next action |
| --- | --- | --- |
| `Orchestrator paused` | Current step is human-owned or repair is human-owned. | Run `sdd orchestrator status`, execute the printed next command, then run `sdd orchestrator resume`. |
| `Orchestrator blocked` | The step has no supported automation or ownership is wrong for the action. | Configure the step owner correctly or run the step manually. |
| `requires --feature` | The step needs a feature context. | Run with `sdd orchestrator run --feature <feature-id>` or create/select a feature first. |
| `Agent provider is not configured` | `.sdd/agents.json` is missing or lacks that provider. | Run `sdd agent configure --provider codex` or `sdd agent configure --provider claude`. |
| `Agent output did not contain valid JSON` | Draft/review agent did not produce schema-compatible JSON. | Inspect `.sdd/agent-runs/*/prompt.md`, `schema.json`, and `output.json`; fix the command template or agent prompt. |
| `Hard gate: working tree has uncommitted changes` | Branch evidence refuses dirty state. | Commit, stash, or use `sdd workflow branch --allow-dirty` when that is intentional. |
| `Question evidence promptHash mismatch` | Canonical prompt changed after the question file was captured. | Re-run `sdd questions capture` for that workflow. |
| `Playwright evidence unavailable` | UI flow mapping lacks strict reporter evidence. | Run Playwright with JSON reporter through validation or use `--compat-playwright` with an approved waiver. |
| `database mutation verifier` missing | Expected mutations were found but no verifier is configured. | Add `.sdd/database-mutation-verifier.json` or remove incorrect mutation expectations from the spec. |
| `spec edits after approval` | Approved spec files changed after approval. | Re-run spec validation and approval, or use a formal feature revision. |

## Recommended End-To-End Commands

Human-controlled greenfield:

```bash
sdd workflow doctor --strict
sdd stakeholder setup --product "Example Product" --thought "Founder=Core user workflow"
sdd jtbd intake --product "Example Product" --audience "Users" --problem "Problem" --job "Job"
sdd questions capture --workflow constitution --output constitution-questions.json
sdd constitution create --questions constitution-questions.json
sdd constitution validate
sdd constitution approve --reviewer "Architect"
sdd workflow branch --purpose feature --name "First Feature"
sdd questions capture --workflow feature-spec --output feature-questions.json
sdd feature create --name "First Feature" --questions feature-questions.json
```

Automated greenfield:

```bash
sdd workflow doctor --strict
sdd agent configure --provider codex
sdd agent doctor --provider codex
sdd orchestrator init --agent codex --profile human-intent-ai-build
sdd orchestrator configure --step implement-feature --owner agent --repair agent --tdd-command "npm test"
sdd orchestrator configure --step feature-validation --owner harness --repair agent --validation-command "npm run qa" --test-database ./dev.db
sdd orchestrator run --target roadmap-next
```

Mixed brownfield:

```bash
sdd brownfield discover
sdd workflow doctor --strict
sdd agent configure --provider codex
sdd orchestrator init --agent codex --profile human-intent-ai-build
sdd orchestrator configure --step create-feature-spec --owner human
sdd orchestrator configure --step create-semantic-contract --owner agent
sdd orchestrator configure --step implement-feature --owner agent --repair human --tdd-command "npm test"
sdd orchestrator configure --step feature-validation --owner harness --repair human --validation-command "npm run qa" --test-database ./dev.db
sdd orchestrator run --target roadmap-next
```
