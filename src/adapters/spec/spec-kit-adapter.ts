import path from "node:path";
import { FileSystemPort, SpecStorePort } from "../../application/ports";

export class SpecKitAdapter {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly store: SpecStorePort,
    private readonly projectRoot: string
  ) {}

  public async exportFeature(featureId: string): Promise<{ readonly featurePath: string }> {
    const files = await this.store.readFeatureFiles(featureId);
    const featurePath = path.join(this.projectRoot, ".specify", "specs", featureId);
    await this.fs.writeFile(path.join(featurePath, "spec.md"), files.requirements ?? "# Specification\n");
    await this.fs.writeFile(path.join(featurePath, "plan.md"), files.plan ?? "# Implementation Plan\n");
    await this.fs.writeFile(path.join(featurePath, "tasks.md"), files.validation ?? "# Validation Tasks\n");
    return { featurePath };
  }

  public async exportConstitution(): Promise<{ readonly path: string }> {
    const files = await this.store.readConstitutionFiles();
    const outputPath = path.join(this.projectRoot, ".specify", "memory", "constitution.md");
    await this.fs.writeFile(outputPath, `# Constitution

## Mission

${files.mission ?? "No mission.md found."}

## Tech Stack

${files.techStack ?? "No tech-stack.md found."}

## Roadmap

${files.roadmap ?? "No roadmap.md found."}
`);
    return { path: outputPath };
  }
}
