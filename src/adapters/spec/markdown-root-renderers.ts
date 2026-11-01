import { createHash } from "node:crypto";
import { InterviewAnswers, JTBD, RoadmapPhase } from "../../domain/models";
import { slugify } from "../../domain/slug";

export function renderJtbd(jtbd: JTBD): string {
  const stakeholderLines = jtbd.stakeholders.length > 0
    ? jtbd.stakeholders.map((stakeholder) => `- **${stakeholder.name}${stakeholder.role ? ` (${stakeholder.role})` : ""}:** ${stakeholder.thought}`).join("\n")
    : "- None captured yet";

  return `# Jobs To Be Done

## Product
${jtbd.productName}

## Description
${jtbd.shortDescription ?? "Not specified"}

## Audience
${jtbd.audience}

## Problem
${jtbd.problem}

## Job
${jtbd.job}

## Situation
${jtbd.situation ?? "Not specified"}

## Motivation
${jtbd.motivation ?? "Not specified"}

## Desired Outcome
${jtbd.desiredOutcome ?? "Not specified"}

## Stakeholder Thoughts
${stakeholderLines}
`;
}

export function renderStakeholderReadme(jtbd: JTBD): string {
  return `# ${jtbd.productName}

${jtbd.shortDescription ?? jtbd.problem}

## Stakeholder Thoughts

${jtbd.stakeholders.length > 0 ? jtbd.stakeholders.map((stakeholder) => `- **${stakeholder.name}:** ${stakeholder.thought}`).join("\n") : "- Add stakeholder thoughts here before creating the constitution."}
`;
}

export function renderMission(
  answers: Required<Pick<InterviewAnswers, "mission" | "targetAudience" | "techStack" | "roadmap">>,
  stakeholderNotes: string
): string {
  return `# Mission

${answers.mission}

## Target Audience

${answers.targetAudience
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n")}

## Stakeholder Inputs

${stakeholderNotes.trim().length > 0 ? stakeholderNotes.trim() : "No stakeholder notes found."}

## What Success Looks Like

- The product solves the stated JTBD problem for the target audience.
- The implementation remains understandable, maintainable, testable, and safe to evolve.
- The validation plan can prove the delivered behavior matches the specification.
`;
}

export function renderTechStack(
  answers: Required<Pick<InterviewAnswers, "mission" | "targetAudience" | "techStack" | "roadmap">>,
  packageSummary: string
): string {
  return `# Tech Stack

${answers.techStack}

## Existing Project Signals

${packageSummary.trim().length > 0 ? packageSummary.trim() : "No package or tooling files detected."}

## Architecture Standards

- Use Clean Architecture boundaries for domain, application, adapters, and interfaces.
- Apply SOLID principles within modules and classes.
- Keep dependencies pointing inward; framework code belongs in adapters or interfaces.
- Preserve decoupling so workflows can run through CLI, skills, ACP, or MCP adapters.

## Testing And QA

- Use test-driven development for domain functions, classes, modules, and workflows.
- Add integration tests for persistence, adapters, and CLI behavior.
- Add Playwright end-to-end coverage for any UI workflow.
- Run UI tests against an isolated copy of the real database when data modifications are involved.
- Emit telemetry for commands, decisions, gates, evidence, failures, and waivers.
`;
}

export function renderRoadmap(rawRoadmap: string): string {
  const lines = rawRoadmap
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.some((line) => /^##\s+Phase\s+/i.test(line))) {
    return `# Roadmap\n\n${rawRoadmap.trim()}\n`;
  }

  const phases = lines.map((line, index) => {
    const cleanLine = line.replace(/^[-*]\s*/, "");
    return `## Phase ${index + 1}: ${cleanLine}

**Goal:** ${cleanLine}

- [ ] Define acceptance criteria
- [ ] Implement with TDD
- [ ] Validate and collect evidence`;
  });

  return `# Roadmap

Phases are intentionally small and independently shippable.

${phases.join("\n\n---\n\n")}
`;
}

export function parseRoadmap(markdown: string): RoadmapPhase[] {
  const lines = markdown.split(/\r?\n/);
  const phases: RoadmapPhase[] = [];
  let current: { id: string; name: string; goal: string; items: { text: string; done: boolean }[] } | undefined;

  for (const line of lines) {
    const heading = /^##\s+Phase\s+([^:]+):?\s*(.*)$/i.exec(line);
    if (heading !== null) {
      if (current !== undefined) phases.push(current);
      const phaseNumber = heading[1]?.trim() ?? `${phases.length + 1}`;
      const phaseName = heading[2]?.trim() || `Phase ${phaseNumber}`;
      current = { id: `phase-${slugify(phaseNumber)}`, name: phaseName.replace(/\s+\(Complete\)$/i, ""), goal: "", items: [] };
      continue;
    }
    if (current === undefined) continue;
    const goal = /^\*\*Goal:\*\*\s*(.*)$/i.exec(line);
    if (goal !== null) {
      current.goal = goal[1]?.trim() ?? "";
      continue;
    }
    const item = /^-\s+\[([ xX])\]\s+(.*)$/.exec(line);
    if (item !== null) {
      current.items.push({ done: (item[1] ?? "").toLowerCase() === "x", text: item[2]?.trim() ?? "" });
    }
  }
  if (current !== undefined) phases.push(current);
  return phases;
}

export function markRoadmapPhaseComplete(markdown: string, sourcePhaseId: string): string {
  const lines = markdown.split(/\r?\n/);
  let inTarget = false;
  return lines.map((line) => {
    const heading = /^##\s+Phase\s+([^:]+):?\s*(.*)$/i.exec(line);
    if (heading !== null) {
      const phaseNumber = heading[1]?.trim() ?? "";
      inTarget = `phase-${slugify(phaseNumber)}` === sourcePhaseId;
      return line;
    }
    return inTarget ? line.replace(/^-\s+\[\s\]\s+/, "- [x] ") : line;
  }).join("\n");
}

export function readHeadingValue(content: string, heading: string): string | undefined {
  const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$([\\s\\S]*?)(?=^##\\s+|\\z)`, "im");
  return pattern.exec(content)?.[1]?.trim();
}

export function hashText(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
