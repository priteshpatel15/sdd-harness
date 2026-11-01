---
name: jtbd-intake
description: "Capture Jobs To Be Done, stakeholder thoughts, problem framing, audience, and desired outcomes before SDD constitution work. Use when starting a greenfield SDD project, creating initial README/stakeholder notes, or anchoring mission and roadmap in the what and why."
---

# JTBD Intake

Run this before constitution creation.

## Workflow

1. Render the canonical prompts.
2. Capture product name, target audience, problem, job, stakeholder thoughts, and desired outcome.
3. Run the CLI commands.

```bash
sdd prompt render --id stakeholder.setup
sdd stakeholder setup --product "<name>" --thought "Name(role): Thought"
sdd prompt render --id jtbd.intake
sdd jtbd intake --product "<name>" --audience "<audience>" --problem "<problem>" --job "<job>" --stakeholder "Name(role)=Thought"
```

## Output

The CLI writes `README.md`, `specs/jtbd.md`, `.sdd/metadata.json`, and telemetry. Do not create constitution files from this skill.
