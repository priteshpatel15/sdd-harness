import { ClockPort, FileSystemPort, SpecStorePort, TelemetrySink, WorkflowStatePort } from "../ports";
import { requireCurrentFeatureApproval, requireFeatureStatus, traceUseCase } from "./common";

export class PlanTddUseCase {
  public constructor(
    private readonly store: SpecStorePort,
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly workflow: WorkflowStatePort,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(featureId: string): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "feature plan-tdd", { featureId }, async () => {
      await requireFeatureStatus(this.store, featureId, ["approved", "implemented"], "TDD planning");
      await requireCurrentFeatureApproval(this.store, this.workflow, this.fs, this.projectRoot, featureId);
      const files = await this.store.readFeatureFiles(featureId);
      const content = `# TDD Plan

## Unit

- Write edge-case tests for pure domain functions before implementation.
- Cover invalid, empty, and boundary inputs.

## Class And Module

- Test each application use case through ports with fake adapters.
- Test adapter behavior against real temporary files or isolated services.

## Integration

- Run CLI workflows against a temporary project directory.
- Verify metadata, telemetry, and evidence artifacts are written.

## UI And E2E

- If this feature touches UI, add Playwright tests for all expected user workflows.
- If data changes occur, run against a copied test database.

## Spec Context

${files.rawText}
`;
      const outputPath = await this.store.writeTddPlan(featureId, content);
      await this.workflow.updateStep("implement-feature", {
        status: "ready",
        featureId,
        evidence: [outputPath]
      });
      return { result: { path: outputPath }, outputs: { path: outputPath } };
    });
  }
}
