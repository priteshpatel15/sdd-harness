import path from "node:path";
import { FileSystemPort, SpecStorePort } from "../../application/ports";

export class OpenSpecAdapter {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly store: SpecStorePort,
    private readonly projectRoot: string
  ) {}

  public async exportFeature(featureId: string): Promise<{ readonly changePath: string }> {
    const files = await this.store.readFeatureFiles(featureId);
    const changePath = path.join(this.projectRoot, "openspec", "changes", featureId);
    await this.fs.writeFile(path.join(changePath, "proposal.md"), files.requirements ?? "# Proposal\n");
    await this.fs.writeFile(path.join(changePath, "design.md"), renderDesign(files));
    await this.fs.writeFile(path.join(changePath, "tasks.md"), files.plan ?? "# Tasks\n");
    await this.fs.writeFile(path.join(changePath, "specs", featureId, "spec.md"), files.validation ?? "# Specification Delta\n");
    return { changePath };
  }
}

function renderDesign(files: { readonly requirements?: string; readonly validation?: string }): string {
  return `# Design

This OpenSpec view was exported from the hybrid Markdown SDD harness.

## Requirements Source

${files.requirements ?? "No requirements file found."}

## Validation Source

${files.validation ?? "No validation file found."}
`;
}
