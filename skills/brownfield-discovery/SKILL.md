---
name: brownfield-discovery
description: "Inventory an existing or legacy codebase before SDD onboarding. Use when creating specs for a brownfield project, inferring current architecture, finding tests/routes/database/deployment files, or deciding what user questions remain before constitution creation."
---

# Brownfield Discovery

Render and follow the canonical prompt:

```bash
sdd prompt render --id brownfield.discover
sdd brownfield discover
```

Use `.sdd/brownfield-profile.json` to ground follow-up questions. The profile includes package script command maps, validation command candidates, route summaries, database schema or migration summaries, and UI entry candidates when they can be inferred. Ask only for product intent or risky gaps that cannot be inferred from the repository. After discovery, use the `constitution` skill to create `specs/mission.md`, `specs/tech-stack.md`, and `specs/roadmap.md`.
