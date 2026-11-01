---
name: semantic-verify
description: "Run semantic verification after validation and deep review. Use before review decisions and completion to verify implementation evidence against the semantic contract."
---

# Semantic Verify

Render and follow the canonical prompt:

```bash
sdd prompt render --id feature.semantic-verify --feature "<feature-id>"
sdd feature semantic-verify --feature "<feature-id>"
```

Review `.sdd/semantic/<feature-id>/evidence-packet.md` and `.sdd/semantic-verifications.jsonl`. Semantic verification requires a validated feature, current approval snapshot, kind-specific evidence files/commands, database copy evidence when required, and exact structured telemetry JSONL fields or event arrays when the semantic contract names telemetry events. It also runs the shared architecture policy for domain/application/adapters dependency direction, direct side effects in domain/application code, and oversized use-case SOLID warnings. Blocking semantic findings require cited evidence before they can block completion; malformed structured verifier JSON blocks verification; waivers require both `--waiver-reason` and `--approved-by`.
