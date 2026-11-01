---
name: replan
description: "Record constitution, roadmap, architecture, tech-stack, or validation-policy changes as explicit SDD replanning artifacts. Use when a new idea changes existing specs, when roadmap phases should be merged or split, or when brownfield discovery changes assumptions."
---

# Replan

Render and follow the canonical prompt:

```bash
sdd workflow branch --purpose replan --name "<change>"
sdd prompt render --id replan.create
sdd replan create --name "<change>" --reason "<why>" --impact "<affected specs/code/tests>"
sdd replan impact --name "<change>" --notes "<what changed>"
```

Keep broad constitution changes separate from feature implementation where practical. `sdd replan impact` selectively marks specs whose requirements, plan, validation, experience, or semantics match the change tokens; when no specific match exists it falls back to all features and records that fallback evidence. After replanning, update impacted feature specs and validation before changing code.
