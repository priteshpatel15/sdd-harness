---
name: mvp-planner
description: "Create an MVP feature spec from remaining roadmap work and existing specs. Use when the constitution and feature specs are trusted enough to plan the rest of the MVP in a focused SDD branch."
---

# MVP Planner

## Workflow

1. Render the canonical prompt.
2. Ask grouped MVP scope, decisions, context, and experience questions. For UI-facing MVP work, capture `FLOW-*` entries with role, route/screen, happy path, edge/error states, data setup, database mutations, expected visible outcome, and Playwright mapping. For non-UI work, record an explicit no-UI answer.
3. Create MVP branch evidence with the same name passed to `mvp plan`, then save grouped question evidence as JSON and run:

```bash
sdd workflow branch --purpose mvp --name "MVP"
sdd prompt render --id mvp.plan
sdd mvp plan --name "MVP" --questions mvp-questions.json
```

Use `--waiver-reason` only when the user explicitly accepts planning before all confidence gates are green or bypassing branch evidence. Branch waivers also require `--approved-by`.
