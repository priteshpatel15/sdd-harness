import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { evaluateArchitecturePolicy } from "../../src/application/architecture-policy";
import { NodeFileSystem } from "../../src/adapters/fs/node-file-system";

describe("architecture policy", () => {
  const fs = new NodeFileSystem();

  it("blocks domain imports from application or adapters", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "domain"), { recursive: true });
    await writeFile(path.join(root, "src", "domain", "bad.ts"), "import { UseCase } from '../application/use-case';\nexport const value = UseCase;\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "blocking" && finding.id.includes("domain-boundary"))).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("blocks application imports from adapters", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "application"), { recursive: true });
    await writeFile(path.join(root, "src", "application", "bad.ts"), "import { Repo } from '../adapters/repo';\nexport const value = Repo;\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "blocking" && finding.id.includes("application-boundary"))).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("allows domain helper names that mention adapter concerns when import specifiers stay clean", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "application"), { recursive: true });
    await mkdir(path.join(root, "src", "domain"), { recursive: true });
    await writeFile(path.join(root, "src", "application", "good.ts"), "import { validationCommandResolvesToPlaywright } from '../domain/spec-validation';\nexport const value = validationCommandResolvesToPlaywright;\n");
    await writeFile(path.join(root, "src", "domain", "spec-validation.ts"), "export const validationCommandResolvesToPlaywright = true;\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "blocking" && finding.id.includes("application-boundary"))).toBe(false);
    await rm(root, { recursive: true, force: true });
  });

  it("blocks direct side effects in application code", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "application"), { recursive: true });
    await writeFile(path.join(root, "src", "application", "bad.ts"), "export const value = process.env.DATABASE_URL;\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "blocking" && finding.id.includes("application-side-effect"))).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("does not confuse RegExp exec property calls with process execution", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "domain"), { recursive: true });
    await writeFile(path.join(root, "src", "domain", "parser.ts"), "export const parsed = /^ok$/.exec('ok')?.[0];\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "blocking" && finding.id.includes("process-boundary"))).toBe(false);
    await rm(root, { recursive: true, force: true });
  });

  it("blocks direct shell/process usage outside approved adapters", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "application"), { recursive: true });
    await writeFile(path.join(root, "src", "application", "bad.ts"), "import { exec } from 'node:child_process';\nexport const run = () => exec('ls');\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "blocking" && finding.id.includes("process-boundary"))).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("allows the shared adapter command executor to own process execution", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "adapters", "commands"), { recursive: true });
    await writeFile(path.join(root, "src", "adapters", "commands", "command-executor.ts"), "import { exec } from 'node:child_process';\nexport const run = () => exec('echo ok');\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "blocking" && finding.id.includes("process-boundary"))).toBe(false);
    await rm(root, { recursive: true, force: true });
  });

  it("does not warn when adapters import application ports", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "adapters", "database"), { recursive: true });
    await mkdir(path.join(root, "src", "application"), { recursive: true });
    await writeFile(path.join(root, "src", "adapters", "database", "good.ts"), "import { FileSystemPort } from '../../application/ports';\nexport const value = FileSystemPort;\n");
    await writeFile(path.join(root, "src", "application", "ports.ts"), "export interface FileSystemPort { read(): string }\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "warning" && finding.id.includes("adapter-coupling"))).toBe(false);
    await rm(root, { recursive: true, force: true });
  });

  it("warns on adapter-to-adapter coupling", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "adapters", "database"), { recursive: true });
    await writeFile(path.join(root, "src", "adapters", "database", "bad.ts"), "import { Review } from '../testing/review';\nexport const value = Review;\n");

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "warning" && finding.id.includes("adapter-coupling"))).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("warns on oversized adapters", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-arch-policy-"));
    await mkdir(path.join(root, "src", "adapters", "spec"), { recursive: true });
    await writeFile(path.join(root, "src", "adapters", "spec", "large.ts"), Array.from({ length: 505 }, (_, index) => `export const v${index} = ${index};`).join("\n"));

    const findings = await evaluateArchitecturePolicy(fs, root);

    expect(findings.some((finding) => finding.severity === "warning" && finding.id.includes("adapter-size"))).toBe(true);
    await rm(root, { recursive: true, force: true });
  });
});
