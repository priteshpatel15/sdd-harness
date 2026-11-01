---
name: feature-spec
description: "Create the next roadmap-driven feature spec with requirements.md, plan.md, validation.md, experience.md when UI-facing, and metadata. Use when starting the next roadmap phase, planning an SDD feature, or converting a user request into a feature spec. Requires grouped scope, decisions, context, and experience answers before writing."
---

# Feature Spec

## Workflow

1. Render the canonical prompt.
2. Create branch evidence before spec creation. Use the exact feature name you will pass to `feature create`, or the exact next roadmap phase name.
3. Ask the grouped questions required by the rendered prompt, including experience. Persist the evidence with the expected workflow, prompt ID, and current prompt hash. For UI work, capture `FLOW-*` entries with role, route/screen, happy path, edge/error states, data setup, database mutations, expected visible outcome, and concrete Playwright file/title mapping. For non-UI work, record an explicit no-UI answer.
4. Save grouped question evidence as JSON and run the CLI gates.

```bash
sdd prompt render --id feature.create
sdd workflow branch --purpose feature --name "<feature-name-or-roadmap-phase>"
sdd feature create --name "<feature-name-or-roadmap-phase>" --questions feature-questions.json
sdd prompt render --id feature.validate-final --feature "<feature-id>"
sdd feature validate-spec --feature "<feature-id>"
sdd feature approve --feature "<feature-id>" --reviewer "<reviewer>"
```

Do not approve until the user has reviewed `requirements.md`, `plan.md`, `validation.md`, and `experience.md` when UI-facing. Branch waivers require both `--waiver-reason` and `--approved-by`; use them only when the user explicitly accepts bypassing git branch evidence.
