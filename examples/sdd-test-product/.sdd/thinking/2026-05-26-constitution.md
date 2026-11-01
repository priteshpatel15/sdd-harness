# Guided Thinking: constitution

## Thinking

README.md and specs/jtbd.md define the product as a small greenfield SDD proof product for software teams using the SDD harness. The constitution can be drafted from that source material, but mission details, audience boundaries, concrete technology choices, and release sequencing remain underspecified. Stakeholder thoughts are already captured and should not be re-asked.

## Unresolved Questions

- Mission: Should the mission be limited to proving the SDD automated delivery workflow end to end, or should this product also become a reusable reference app for future teams?
- Target audience: Is the audience only software teams actively using the SDD harness, or should it also include engineering managers, QA reviewers, and delivery stakeholders who inspect evidence?
- Tech stack: Which concrete stack should be standardized for the greenfield app, including frontend, backend, database, ORM or migration tool, test runners, Playwright setup, and telemetry provider?
- Roadmap: What should the first validated product slice be, and should the roadmap prioritize architecture foundation, workflow evidence UI, test database isolation, telemetry, or end-to-end QA first?

## Risks

- Without a concrete tech stack, implementation can satisfy architectural principles but still diverge from expected project conventions.
- Without a precise first roadmap slice, the product may over-invest in framework setup before proving a user-visible workflow.
- The audience is broadly stated as software teams, so UI and reporting depth may be mis-scoped without confirming whether reviewers and managers are primary users.
- The mission currently emphasizes proving the SDD workflow, not a standalone market problem, which may limit product decisions unless intentionally accepted.

## Answers

### mission

SDD Test Product exists to prove that the SDD harness can bootstrap, implement, validate, and document a realistic small product foundation without manual handoffs. Its constitution should require Clean Architecture, SOLID boundaries, plug-and-play adapters, full TDD, Playwright end-to-end coverage for every UI workflow, isolated real-database validation, and telemetry evidence for important actions.

### targetAudience

The primary target audience is software teams using the SDD harness to evaluate or practice automated spec-driven delivery. Secondary users may include reviewers who need confidence that architecture, tests, QA evidence, database isolation, and telemetry are complete and inspectable.

### techStack

The technical constitution should mandate a decoupled stack organized around domain, application, adapter, and infrastructure layers. The specific framework choices are unresolved, but whichever stack is selected must support automated unit and integration tests, Playwright UI QA, real database testing against an isolated test copy, migrations or schema control, and structured telemetry for important product and workflow events.

### roadmap

The roadmap should start with a constitution and architecture foundation, then define the first small vertical slice of the product, implement it through clean boundaries and adapters, validate it with unit, integration, database, Playwright end-to-end, and telemetry checks, and finally use the resulting evidence to prove the SDD workflow is complete and repeatable.
