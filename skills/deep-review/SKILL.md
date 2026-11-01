---
name: deep-review
description: "Create a multi-lens SDD review packet for architecture, spec alignment, tests, QA, and validation evidence. Use after implementation validation and before accepting recommendations or merging."
---

# Deep Review

Render and follow the canonical prompt:

```bash
sdd prompt render --id feature.deep-review --feature "<feature-id>"
sdd feature deep-review --feature "<feature-id>"
sdd prompt render --id feature.review-decisions --feature "<feature-id>"
sdd feature review-decisions --feature "<feature-id>" --decision "finding|accepted|reason"
```

Review the generated `.sdd/reviews/*.md` packet before applying recommendations. Deep review requires a validated feature and current approval snapshot. Structured JSON findings must use severity `info`, `warning`, or `blocking` and include non-empty `id`, `summary`, and `recommendation`; malformed structured output blocks the review. If review findings reveal missing requirements or validation, update the feature spec first, then re-approve, update implementation/tests, and rerun validation. Waiving unavailable review agents requires both `--waiver-reason` and `--approved-by`.
