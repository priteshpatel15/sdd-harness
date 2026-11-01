---
name: tdd-implement
description: "Prepare or execute implementation for an approved SDD feature using TDD, Clean Architecture, SOLID, validation evidence, and telemetry gates. Use only after a feature spec has been validated and approved."
---

# TDD Implement

## Workflow

1. Confirm the feature status is approved:

```bash
sdd prompt render --id feature.validate-final --feature "<feature-id>"
sdd feature validate-spec --feature "<feature-id>"
sdd feature approve --feature "<feature-id>" --reviewer "<reviewer>"
```

2. Generate the TDD plan and implementation packet:

```bash
sdd prompt render --id feature.implement --feature "<feature-id>"
sdd feature plan-tdd --feature "<feature-id>"
sdd feature implement --feature "<feature-id>"
sdd feature record-tdd --feature "<feature-id>" --task-group "<task-group>" --phase red --evidence "<test-path>::<task-group-id>::VAL-1" --command "<failing-test-command>"
sdd feature record-tdd --feature "<feature-id>" --task-group "<task-group>" --phase green --evidence "<test-path>::<task-group-id>::VAL-1" --command "<passing-test-command>"
sdd feature record-tdd --feature "<feature-id>" --task-group "<task-group>" --phase refactor --evidence "<test-path>::<task-group-id>::VAL-1" --command "<passing-test-command>"
sdd feature complete-task-group --feature "<feature-id>" --task-group "<task-group>" --implementation-evidence "<path>::<task-group-id>" --test-evidence "<test-path>::<task-group-id>::VAL-1"
```

3. Implement from the packet. Keep edits scoped to the approved spec and record red test evidence before accepting green implementation evidence. If any approved spec file changes, re-run spec validation and approval before implementation continues.

The CLI blocks implementation packets for unapproved feature specs, specs changed after approval, unknown task-group ids, and task-group completion evidence that does not point to existing files. Task-group completion requires command-backed red and green records from `sdd feature record-tdd` for the same test file by default, mapped to the task group and a `VAL-*` id; red must fail, green/refactor must pass, and records are appended to `.sdd/tdd-evidence.jsonl`. Use `--compat-tdd --waiver-reason "<reason>" --approved-by "<approver>"` only for explicit legacy/non-strict cases. Feature completion requires every planned task group to be completed or explicitly waived.
