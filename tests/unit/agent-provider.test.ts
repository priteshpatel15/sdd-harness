import { describe, expect, it } from "vitest";
import { parseAgentJson, renderCommandTemplate } from "../../src/adapters/agents/command-agent-provider";

describe("command agent provider", () => {
  it("renders shell-safe command templates for provider commands", () => {
    const command = renderCommandTemplate("codex exec -C {projectRoot} --output-last-message {outputFile} -", {
      projectRoot: "/tmp/project with spaces",
      outputFile: "/tmp/out.json"
    });

    expect(command).toBe("codex exec -C '/tmp/project with spaces' --output-last-message '/tmp/out.json' -");
  });

  it("parses direct JSON and Claude-style result wrappers", () => {
    expect(parseAgentJson('{"answers":{"scope":"Build"}}')).toEqual({ answers: { scope: "Build" } });
    expect(parseAgentJson('{"result":"{\\"findings\\":[]}"}')).toEqual({ findings: [] });
  });
});
