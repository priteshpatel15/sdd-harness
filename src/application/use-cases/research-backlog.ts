import path from "node:path";
import { ClockPort, FileSystemPort, TelemetrySink } from "../ports";
import { traceUseCase } from "./common";
import { ValidationError } from "../../domain/errors";
import { slugify } from "../../domain/slug";

export class ResearchBacklogUseCase {
  public constructor(
    private readonly fs: FileSystemPort,
    private readonly projectRoot: string,
    private readonly telemetry: TelemetrySink,
    private readonly clock: ClockPort
  ) {}

  public async execute(input: { readonly question: string; readonly context?: string; readonly priority?: string }): Promise<{ readonly path: string }> {
    return traceUseCase(this.telemetry, this.clock, "research-backlog", input, async () => {
      if (input.question.trim().length === 0) {
        throw new ValidationError("Research backlog requires --question.");
      }

      const date = this.clock.now().toISOString().slice(0, 10);
      const outputPath = path.join(this.projectRoot, "backlog", `${date}-${slugify(input.question).slice(0, 72)}.md`);
      await this.fs.writeFile(outputPath, `# Research: ${input.question}

## Priority

${input.priority ?? "normal"}

## Context

${input.context ?? "No additional context provided."}

## Research Instructions

- Gather primary sources where possible.
- Capture tradeoffs, constraints, and implementation consequences.
- Convert findings into constitution, roadmap, or feature-spec changes when relevant.

## Status

- [ ] Researched
- [ ] Reviewed
- [ ] Applied to specs if needed
`);

      return { result: { path: outputPath }, outputs: { path: outputPath } };
    });
  }
}
