---
name: research-backlog
description: "Create research backlog items for SDD questions, tool choices, standards, frameworks, or unresolved technical decisions. Use when an issue should be researched before changing constitution, roadmap, specs, or implementation."
---

# Research Backlog

Run:

```bash
sdd prompt render --id research.backlog
sdd research backlog --question "<research question>" --context "<why it matters>" --priority normal
```

Research findings should be applied back into constitution, roadmap, or feature specs through the `replan` workflow when they change decisions.
