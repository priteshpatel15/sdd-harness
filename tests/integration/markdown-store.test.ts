import { afterEach, beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import { createTempProject, TempProject } from "../helpers/temp-project";
import { NodeFileSystem } from "../../src/adapters/fs/node-file-system";
import { MarkdownSpecStore } from "../../src/adapters/spec/markdown-spec-store";
import type { SemanticContract } from "../../src/domain/models";

describe("MarkdownSpecStore", () => {
  let project: TempProject;
  let store: MarkdownSpecStore;

  beforeEach(async () => {
    project = await createTempProject();
    store = new MarkdownSpecStore(new NodeFileSystem(), project.root);
  });

  afterEach(async () => {
    await project.cleanup();
  });

  it("writes JTBD intake and metadata", async () => {
    await store.writeJtbd({
      productName: "SpecPilot",
      audience: "Developers",
      problem: "Specs drift from code",
      job: "Keep implementation aligned with specs",
      stakeholders: [{ name: "Mary", thought: "Needs strict validation" }]
    });

    await expect(project.read("specs/jtbd.md")).resolves.toContain("Keep implementation aligned");
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { project: { productName: string } };
    expect(metadata.project.productName).toBe("SpecPilot");
  });

  it("finds the first wholly incomplete roadmap phase", async () => {
    await project.write("specs/roadmap.md", `# Roadmap

## Phase 1: Done

- [x] Finished

## Phase 2: Next

- [ ] One
- [ ] Two
`);

    const phase = await store.findNextRoadmapPhase();

    expect(phase?.name).toBe("Next");
  });

  it("writes feature spec docs and metadata", async () => {
    await store.ensureProject();
    const feature = await store.writeFeatureSpec({
      id: "2026-05-23-next",
      name: "Next",
      createdOn: "2026-05-23",
      answers: {
        scope: "Build next capability",
        decisions: "Use existing stack",
        context: "Keep it small",
        experience: "No UI-facing experience; no experience.md required."
      },
      approved: false,
      mvp: false
    });

    expect(feature.status).toBe("draft");
    await expect(project.read(path.join("specs", "2026-05-23-next", "validation.md"))).resolves.toContain("Definition Of Done");
    const metadata = JSON.parse(await project.read(".sdd/metadata.json")) as { features: Record<string, { status: string }> };
    expect(metadata.features["2026-05-23-next"]?.status).toBe("draft");
  });

  it("marks the source roadmap phase complete for a feature", async () => {
    await project.write("specs/roadmap.md", `# Roadmap

## Phase 1: Next

- [ ] One
- [ ] Two
`);
    const phase = await store.findNextRoadmapPhase();
    await store.writeFeatureSpec({
      id: "2026-05-23-next",
      name: "Next",
      createdOn: "2026-05-23",
      answers: {
        scope: "Build next capability",
        decisions: "Use existing stack",
        context: "Keep it small",
        experience: "No UI-facing experience; no experience.md required."
      },
      sourcePhase: phase,
      approved: false,
      mvp: false
    });

    const result = await store.completeRoadmapPhaseForFeature("2026-05-23-next");

    expect(result.updated).toBe(true);
    await expect(project.read("specs/roadmap.md")).resolves.toContain("- [x] One");
    await expect(project.read("specs/roadmap.md")).resolves.toContain("- [x] Two");
  });

  it("renders semantic not-applicable rationale for empty semantic sections", async () => {
    const featureId = "2026-05-23-semantic-rationale";
    await store.writeFeatureSpec({
      id: featureId,
      name: "Semantic Rationale",
      createdOn: "2026-05-23",
      answers: {
        scope: "Document semantic rationale rendering",
        decisions: "Keep renderer output aligned with semantic JSON",
        context: "Human-readable semantics should expose explicit not-applicable rationale",
        experience: "No UI-facing experience; no experience.md required."
      },
      approved: false,
      mvp: false
    });

    const contract: SemanticContract = {
      version: 1,
      featureId,
      sourceHash: "",
      createdAt: "2026-05-23T00:00:00.000Z",
      actors: [{ id: "ACT-001", name: "Developer", permissions: [] }],
      outcomes: ["Semantic rationale is visible in markdown"],
      entities: [],
      commands: [],
      transitions: [],
      invariants: [{
        id: "INV-001",
        statement: "Markdown mirrors semantic JSON rationale",
        severity: "blocking",
        verificationMethods: ["unit-test"],
        evidence: [{ id: "EVD-001", kind: "unit-test", ref: "tests/integration/markdown-store.test.ts", required: true }]
      }],
      scenarios: [{
        id: "SCN-001",
        title: "Render semantic rationale",
        actorIds: ["ACT-001"],
        preconditions: [],
        steps: ["Write semantic contract", "Read generated markdown"],
        expectedDataMutations: ["none"],
        expectedTelemetry: [],
        experienceFlowIds: [],
        oracleIds: ["ORC-001"],
        evidence: [{ id: "EVD-002", kind: "unit-test", ref: "tests/integration/markdown-store.test.ts", required: true }]
      }],
      oracles: [{ id: "ORC-001", statement: "Not-applicable rationale appears in markdown", verificationMethods: ["unit-test"] }],
      architectureClaims: [],
      telemetryEvents: [],
      notApplicable: {
        entities: "Entity modeling is not applicable for this documentation-only feature.",
        commands: "No runtime commands are introduced by this rendering polish.",
        architecture: "No new architecture claims are needed for a renderer-only change.",
        telemetry: "not applicable"
      }
    };

    await store.writeSemanticContract(featureId, contract);

    const semantics = await project.read(path.join("specs", featureId, "semantics.md"));
    expect(semantics).toContain("Not applicable: Entity modeling is not applicable for this documentation-only feature.");
    expect(semantics).toContain("Not applicable: No runtime commands are introduced by this rendering polish.");
    expect(semantics).toContain("Not applicable: No new architecture claims are needed for a renderer-only change.");
  });
});
