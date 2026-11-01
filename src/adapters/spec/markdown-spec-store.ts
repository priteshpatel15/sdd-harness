import path from "node:path";
import {
  FeatureSpec,
  FeatureSpecStatus,
  InterviewAnswers,
  JTBD,
  RoadmapPhase,
  SemanticContract,
  SddMetadata
} from "../../domain/models";
import { slugify } from "../../domain/slug";
import { featureAnswersRequireExperience } from "../../domain/spec-validation";
import { FileSystemPort, SpecStorePort } from "../../application/ports";
import {
  buildTaskGroups,
  buildValidationCases,
  renderFeatureExperience,
  renderFeaturePlan,
  renderFeatureRequirements,
  renderFeatureValidation
} from "./markdown-feature-renderers";
import {
  hashText,
  markRoadmapPhaseComplete,
  parseRoadmap,
  readHeadingValue,
  renderJtbd,
  renderMission,
  renderRoadmap,
  renderStakeholderReadme,
  renderTechStack
} from "./markdown-root-renderers";
import { renderSemanticContract } from "./markdown-semantic-renderer";

export class MarkdownSpecStore implements SpecStorePort {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string
  ) {}

  public async ensureProject(): Promise<void> {
    await this.fs.mkdir(this.specsPath());
    await this.fs.mkdir(path.join(this.projectRoot, ".sdd"));
    if (!(await this.fs.exists(this.metadataPath()))) {
      await this.writeMetadata({ version: 1, features: {}, waivers: [] });
    }
  }

  public async writeJtbd(jtbd: JTBD): Promise<void> {
    await this.ensureProject();
    await this.fs.writeFile(path.join(this.specsPath(), "jtbd.md"), renderJtbd(jtbd));

    const readmePath = path.join(this.projectRoot, "README.md");
    if (!(await this.fs.exists(readmePath))) {
      await this.fs.writeFile(readmePath, renderStakeholderReadme(jtbd));
    }

    const metadata = await this.readMetadata();
    await this.writeMetadata({
      ...metadata,
      project: {
        ...metadata.project,
        mode: "greenfield",
        productName: jtbd.productName,
        initializedAt: metadata.project?.initializedAt ?? new Date().toISOString()
      }
    });
  }

  public async readJtbd(): Promise<JTBD | undefined> {
    const jtbdPath = path.join(this.specsPath(), "jtbd.md");
    if (!(await this.fs.exists(jtbdPath))) {
      return undefined;
    }

    const content = await this.fs.readFile(jtbdPath);
    return {
      productName: readHeadingValue(content, "Product") ?? "Unknown product",
      audience: readHeadingValue(content, "Audience") ?? "",
      problem: readHeadingValue(content, "Problem") ?? "",
      job: readHeadingValue(content, "Job") ?? "",
      situation: readHeadingValue(content, "Situation"),
      motivation: readHeadingValue(content, "Motivation"),
      desiredOutcome: readHeadingValue(content, "Desired Outcome"),
      stakeholders: []
    };
  }

  public async writeConstitution(input: {
    readonly answers: Required<Pick<InterviewAnswers, "mission" | "targetAudience" | "techStack" | "roadmap">>;
    readonly stakeholderNotes: string;
    readonly packageSummary: string;
  }): Promise<void> {
    await this.ensureProject();
    await this.fs.writeFile(path.join(this.specsPath(), "mission.md"), renderMission(input.answers, input.stakeholderNotes));
    await this.fs.writeFile(path.join(this.specsPath(), "tech-stack.md"), renderTechStack(input.answers, input.packageSummary));
    await this.fs.writeFile(path.join(this.specsPath(), "roadmap.md"), renderRoadmap(input.answers.roadmap));

    const metadata = await this.readMetadata();
    await this.writeMetadata({
      ...metadata,
      constitution: {
        status: "draft",
        updatedAt: new Date().toISOString()
      }
    });
  }

  public async readConstitutionFiles(): Promise<{ readonly mission?: string; readonly techStack?: string; readonly roadmap?: string }> {
    return {
      mission: await this.readOptional(path.join(this.specsPath(), "mission.md")),
      techStack: await this.readOptional(path.join(this.specsPath(), "tech-stack.md")),
      roadmap: await this.readOptional(path.join(this.specsPath(), "roadmap.md"))
    };
  }

  public async readRoadmap(): Promise<readonly RoadmapPhase[]> {
    const roadmap = await this.readOptional(path.join(this.specsPath(), "roadmap.md"));
    return roadmap === undefined ? [] : parseRoadmap(roadmap);
  }

  public async findNextRoadmapPhase(): Promise<RoadmapPhase | undefined> {
    const phases = await this.readRoadmap();
    return phases.find((phase) => phase.items.length > 0 && phase.items.every((item) => !item.done));
  }

  public async writeFeatureSpec(input: {
    readonly id: string;
    readonly name: string;
    readonly createdOn: string;
    readonly answers: Required<Pick<InterviewAnswers, "scope" | "decisions" | "context" | "experience">>;
    readonly sourcePhase?: RoadmapPhase;
    readonly approved: boolean;
    readonly mvp: boolean;
  }): Promise<FeatureSpec> {
    await this.ensureProject();
    const featurePath = path.join(this.specsPath(), input.id);
    await this.fs.mkdir(featurePath);

    const taskGroups = buildTaskGroups(input.name, input.answers, input.sourcePhase, input.mvp);
    const validationCases = buildValidationCases(input.name, input.answers);
    const feature: FeatureSpec = {
      id: input.id,
      name: input.name,
      createdOn: input.createdOn,
      status: input.approved ? "approved" : "draft",
      scope: input.answers.scope,
      decisions: input.answers.decisions,
      context: input.answers.context,
      experience: input.answers.experience,
      taskGroups,
      validationCases,
      sourcePhaseId: input.sourcePhase?.id
    };

    await this.fs.writeFile(path.join(featurePath, "requirements.md"), renderFeatureRequirements(feature));
    await this.fs.writeFile(path.join(featurePath, "plan.md"), renderFeaturePlan(feature));
    await this.fs.writeFile(path.join(featurePath, "validation.md"), renderFeatureValidation(feature));
    if (featureAnswersRequireExperience(feature)) {
      await this.fs.writeFile(path.join(featurePath, "experience.md"), renderFeatureExperience(feature));
    }

    const metadata = await this.readMetadata();
    await this.writeMetadata({
      ...metadata,
      features: {
        ...metadata.features,
        [input.id]: {
          path: path.relative(this.projectRoot, featurePath),
          name: input.name,
          status: feature.status,
          createdAt: new Date().toISOString(),
          sourcePhaseId: input.sourcePhase?.id
        }
      }
    });

    return feature;
  }

  public async readFeatureFiles(featureId: string): Promise<{ readonly requirements?: string; readonly plan?: string; readonly validation?: string; readonly rawText: string }> {
    const featurePath = await this.resolveFeaturePath(featureId);
    const requirements = await this.readOptional(path.join(featurePath, "requirements.md"));
    const plan = await this.readOptional(path.join(featurePath, "plan.md"));
    const validation = await this.readOptional(path.join(featurePath, "validation.md"));

    return {
      requirements,
      plan,
      validation,
      rawText: [requirements, plan, validation].filter((item): item is string => item !== undefined).join("\n\n")
    };
  }

  public async readFeatureExperience(featureId: string): Promise<string | undefined> {
    const featurePath = await this.resolveFeaturePath(featureId);
    return this.readOptional(path.join(featurePath, "experience.md"));
  }

  public async writeSemanticContract(featureId: string, contract: SemanticContract): Promise<SemanticContract> {
    await this.ensureProject();
    const featurePath = await this.resolveFeaturePath(featureId);
    const markdownWithoutHash = renderSemanticContract({ ...contract, sourceHash: "" });
    const sourceHash = hashText(markdownWithoutHash);
    const persisted: SemanticContract = { ...contract, sourceHash };
    const markdown = renderSemanticContract(persisted);
    await this.fs.writeFile(path.join(featurePath, "semantics.md"), markdown);
    await this.fs.writeFile(path.join(this.projectRoot, ".sdd", "semantic-contracts", `${featureId}.json`), `${JSON.stringify(persisted, null, 2)}\n`);
    return persisted;
  }

  public async readSemanticContract(featureId: string): Promise<SemanticContract | undefined> {
    const contractPath = path.join(this.projectRoot, ".sdd", "semantic-contracts", `${featureId}.json`);
    if (!(await this.fs.exists(contractPath))) {
      return undefined;
    }
    return JSON.parse(await this.fs.readFile(contractPath)) as SemanticContract;
  }

  public async readFeatureSemanticFiles(featureId: string): Promise<{ readonly markdown?: string; readonly contract?: SemanticContract }> {
    const featurePath = await this.resolveFeaturePath(featureId);
    return {
      markdown: await this.readOptional(path.join(featurePath, "semantics.md")),
      contract: await this.readSemanticContract(featureId)
    };
  }

  public async writeTddPlan(featureId: string, content: string): Promise<string> {
    const outputPath = path.join(await this.resolveFeaturePath(featureId), "tdd-plan.md");
    await this.fs.writeFile(outputPath, content);
    return outputPath;
  }

  public async writeImplementationPacket(featureId: string, content: string): Promise<string> {
    const outputPath = path.join(this.projectRoot, ".sdd", "implementation-packets", `${featureId}.md`);
    await this.fs.writeFile(outputPath, content);
    return outputPath;
  }

  public async writeReviewPacket(featureId: string | undefined, content: string): Promise<string> {
    const outputPath = path.join(this.projectRoot, ".sdd", "reviews", `${new Date().toISOString().slice(0, 10)}-${slugify(featureId ?? "project")}.md`);
    await this.fs.writeFile(outputPath, content);
    return outputPath;
  }

  public async writeReplan(changeName: string, content: string): Promise<string> {
    const outputPath = path.join(this.specsPath(), "replans", `${new Date().toISOString().slice(0, 10)}-${slugify(changeName)}.md`);
    await this.fs.writeFile(outputPath, content);
    return outputPath;
  }

  public async completeRoadmapPhaseForFeature(featureId: string): Promise<{ readonly path: string; readonly updated: boolean; readonly sourcePhaseId?: string; readonly fileHash: string }> {
    const metadata = await this.readMetadata();
    const feature = metadata.features[featureId];
    if (feature === undefined) {
      throw new Error(`Unknown feature '${featureId}'.`);
    }

    const roadmapPath = path.join(this.specsPath(), "roadmap.md");
    const roadmap = await this.readOptional(roadmapPath);
    if (roadmap === undefined) {
      throw new Error("Roadmap file was not found.");
    }

    if (feature.sourcePhaseId === undefined) {
      return { path: roadmapPath, updated: false, fileHash: hashText(roadmap) };
    }

    const next = markRoadmapPhaseComplete(roadmap, feature.sourcePhaseId);
    if (next !== roadmap) {
      await this.fs.writeFile(roadmapPath, next.endsWith("\n") ? next : `${next}\n`);
    }

    return {
      path: roadmapPath,
      updated: next !== roadmap,
      sourcePhaseId: feature.sourcePhaseId,
      fileHash: hashText(next)
    };
  }

  public async readMetadata(): Promise<SddMetadata> {
    if (!(await this.fs.exists(this.metadataPath()))) {
      return { version: 1, features: {}, waivers: [] };
    }

    const parsed = JSON.parse(await this.fs.readFile(this.metadataPath())) as SddMetadata;
    return {
      version: 1,
      features: parsed.features ?? {},
      waivers: parsed.waivers ?? [],
      project: parsed.project,
      constitution: parsed.constitution
    };
  }

  public async writeMetadata(metadata: SddMetadata): Promise<void> {
    await this.fs.writeFile(this.metadataPath(), `${JSON.stringify(metadata, null, 2)}\n`);
  }

  public async updateFeatureStatus(featureId: string, status: FeatureSpecStatus): Promise<void> {
    const metadata = await this.readMetadata();
    const feature = metadata.features[featureId];
    if (feature === undefined) {
      throw new Error(`Unknown feature '${featureId}'.`);
    }

    await this.writeMetadata({
      ...metadata,
      features: {
        ...metadata.features,
        [featureId]: { ...feature, status }
      }
    });
  }

  public async updateConstitutionStatus(status: "draft" | "approved"): Promise<void> {
    const metadata = await this.readMetadata();
    await this.writeMetadata({
      ...metadata,
      constitution: {
        status,
        updatedAt: new Date().toISOString()
      }
    });
  }

  public async resolveFeaturePath(featureId: string): Promise<string> {
    const metadata = await this.readMetadata();
    const feature = metadata.features[featureId];
    if (feature !== undefined) {
      return path.join(this.projectRoot, feature.path);
    }

    const directPath = path.join(this.specsPath(), featureId);
    if (await this.fs.exists(directPath)) {
      return directPath;
    }
    throw new Error(`Feature spec '${featureId}' was not found.`);
  }

  private specsPath(): string {
    return path.join(this.projectRoot, "specs");
  }

  private metadataPath(): string {
    return path.join(this.projectRoot, ".sdd", "metadata.json");
  }

  private async readOptional(filePath: string): Promise<string | undefined> {
    return (await this.fs.exists(filePath)) ? this.fs.readFile(filePath) : undefined;
  }
}
