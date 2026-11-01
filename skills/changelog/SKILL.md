---
name: changelog
description: "Update CHANGELOG.md before merge using git commit history when available, otherwise SDD telemetry. Use after validation and deep review to communicate completed work to stakeholders."
---

# Changelog

Render and follow the canonical prompt:

```bash
sdd prompt render --id changelog.update
sdd changelog update
```

Review the generated bullets for stakeholder clarity before merging. The command is idempotent and writes telemetry for the changelog run.
