---
name: semantic-contract
description: "Create the feature semantic contract before final spec approval. Use after feature spec iteration and before approval to capture actors, outcomes, domain entities, commands, states, invariants, scenarios, oracles, data effects, telemetry, and architecture claims."
---

# Semantic Contract

Render and follow the canonical prompt:

```bash
sdd prompt render --id feature.semantics --feature "<feature-id>"
sdd feature semantics --feature "<feature-id>" --questions semantics-questions.json
```

Persist grouped semantic question evidence before running the command. The CLI owns validation, artifact writes, workflow state, telemetry, and evidence. Use explicit not-applicable rationale when actors, entities, commands, telemetry, or architecture claims truly do not apply, and write scenarios with ordered steps rather than a single summary sentence.
