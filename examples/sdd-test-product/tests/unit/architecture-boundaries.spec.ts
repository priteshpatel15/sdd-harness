import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(".");

function readSourceFiles(directory: string): Array<{ path: string; content: string }> {
  const absoluteDirectory = path.join(projectRoot, directory);
  expect(existsSync(absoluteDirectory), `${directory} must exist for Clean Architecture boundaries`).toBe(true);

  const files: Array<{ path: string; content: string }> = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const absoluteEntry = path.join(current, entry);
      if (statSync(absoluteEntry).isDirectory()) {
        walk(absoluteEntry);
        continue;
      }
      if (/\.(ts|tsx)$/.test(entry)) {
        files.push({
          path: path.relative(projectRoot, absoluteEntry),
          content: readFileSync(absoluteEntry, "utf8")
        });
      }
    }
  };

  walk(absoluteDirectory);
  return files;
}

describe("Clean Architecture dependency direction", () => {
  it("keeps domain code free of framework, filesystem, HTTP, SQLite, and UI dependencies", () => {
    const domainFiles = readSourceFiles("src/domain");
    const forbiddenImports = [
      "react",
      "express",
      "http",
      "node:fs",
      "sqlite",
      "better-sqlite3",
      "playwright",
      "../adapters",
      "../interfaces"
    ];

    for (const sourceFile of domainFiles) {
      for (const forbidden of forbiddenImports) {
        expect(
          sourceFile.content,
          `${sourceFile.path} must not import ${forbidden}`
        ).not.toContain(forbidden);
      }
    }
  });

  it("keeps application use cases behind repository and telemetry ports", () => {
    const applicationFiles = readSourceFiles("src/application");
    const flattened = applicationFiles.map((file) => file.content).join("\n");

    expect(flattened).toContain("EvidenceRepositoryPort");
    expect(flattened).toContain("TelemetryPort");
    expect(flattened).not.toContain("better-sqlite3");
    expect(flattened).not.toContain("node:fs");
    expect(flattened).not.toContain("react");
  });

  it("exposes the evidence dashboard as a Vite React UI that depends only on HTTP contracts", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(projectRoot, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const declaredPackages = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    expect(
      declaredPackages,
      "REQ-002 requires a Vite React UI for the dashboard"
    ).toMatchObject({
      vite: expect.any(String),
      react: expect.any(String),
      "react-dom": expect.any(String),
      "@vitejs/plugin-react": expect.any(String)
    });
    expect(existsSync(path.join(projectRoot, "vite.config.ts"))).toBe(true);

    const interfaceFiles = readSourceFiles("src/interfaces");
    const reactUiFiles = interfaceFiles.filter((sourceFile) => sourceFile.path.endsWith(".tsx"));

    expect(
      reactUiFiles.map((sourceFile) => sourceFile.path),
      "The /evidence screen should be implemented as a React interface component, not inline server-rendered scripts"
    ).not.toEqual([]);

    const evidenceUi = reactUiFiles.find((sourceFile) => sourceFile.content.includes("/api/evidence"));

    expect(
      evidenceUi?.content,
      "React UI should call the HTTP API so storage remains behind application ports"
    ).toContain("/api/evidence");
    expect(evidenceUi?.content).not.toContain("../../adapters");
    expect(evidenceUi?.content).not.toContain("node:");
    expect(evidenceUi?.content).not.toContain("sqlite");
  });
});
