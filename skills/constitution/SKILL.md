---
name: constitution
description: "Create and validate SDD constitution files: specs/mission.md, specs/tech-stack.md, and specs/roadmap.md. Use after JTBD intake for greenfield projects or after brownfield discovery for legacy projects. Requires grouped mission, target audience, tech stack, and roadmap answers before writing files."
---

# Constitution

## Workflow

1. Render the canonical prompt.
2. Ask the grouped questions required by the rendered prompt.
3. Save grouped question evidence as JSON, then run the CLI gates.

```bash
sdd prompt render --id constitution.create
sdd constitution create --questions constitution-questions.json
sdd prompt render --id constitution.validate
sdd constitution validate
sdd constitution approve --reviewer "<reviewer>"
```

## Gates

The CLI blocks missing grouped answers and validates audience, success criteria, testing posture, and roadmap checklist phases.
