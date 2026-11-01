---
name: spec-validator
description: "Validate SDD constitution and feature specs against hard gates, optionally approving feature specs that pass. Use before implementation, before merging, or whenever specs may be incomplete or inconsistent."
---

# Spec Validator

Run one of:

```bash
sdd prompt render --id constitution.validate
sdd constitution validate
sdd constitution approve --reviewer "<reviewer>"
sdd prompt render --id feature.validate-final --feature "<feature-id>"
sdd feature validate-spec --feature "<feature-id>"
sdd feature approve --feature "<feature-id>" --reviewer "<reviewer>"
```

Only approve a feature after reviewing `requirements.md`, `plan.md`, `validation.md`, `semantics.md`, and `experience.md` when UI-facing. UI-facing specs must define each `FLOW-*` with role, route/screen, happy path, edge/error states, data setup, database mutations, visible outcome, and Playwright mapping before approval. Approval records file hashes; any later spec change blocks TDD planning, implementation, validation, review, and semantic verification until the feature is re-approved.
