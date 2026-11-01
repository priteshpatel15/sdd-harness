# Orchestrator Dogfood Evidence

Feature: 2026-05-25-close-remaining-sdd-gaps

This deterministic dogfood snapshot exercises the orchestrator as a persisted control plane without requiring live Codex or Claude calls in repo QA. CI proof uses fake providers so typecheck, unit, e2e, build, and QA remain deterministic.

Evidence checked:

- Config is persisted at `.sdd/orchestrator.json` with version `1` and the `human-intent-ai-build` profile.
- State is persisted at `.sdd/orchestrator-state.json` with version `1`, a paused run, and resumable next-command guidance.
- Harness-owned validation evidence is available in `.sdd/validation-summaries.jsonl` and `.sdd/evidence`.
- Review and semantic evidence for this feature is available under `.sdd/reviews/2026-05-25-close-remaining-sdd-gaps` and `.sdd/semantic/2026-05-25-close-remaining-sdd-gaps`.
- Provider readiness is checked by `sdd agent doctor --provider <provider>`, which distinguishes CLI availability from `.sdd/agents.json` template readiness for draft, review, implementation, and repair.

Optional live-provider acceptance:

- Run `sdd agent doctor --provider codex` or `sdd agent doctor --provider claude` in a temp project after configuring the provider.
- Run a non-repository smoke with `sdd workflow greenfield --agent <provider> --through constitution --draft-only --project <temp-project>`.
- Confirm `.sdd/agent-runs`, `.sdd/thinking`, `.sdd/question-drafts`, `.sdd/telemetry.jsonl`, and command evidence are produced.

The snapshot intentionally pauses at `review-subagent-recommendations`; accepting or rejecting review findings remains a human-owned workflow boundary.
