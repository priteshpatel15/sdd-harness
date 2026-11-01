export interface ExperienceFlow {
  readonly id: string;
  readonly playwright: string;
  readonly routeOrScreen: string;
  readonly happyPath: string;
  readonly edgeCases: readonly string[];
  readonly databaseMutations: string;
  readonly expectedVisibleOutcome: string;
}

export function parseExperienceFlows(markdown: string): readonly ExperienceFlow[] {
  const headings = Array.from(markdown.matchAll(/^###\s+(FLOW-[A-Za-z0-9_-]+):?.*$/gim));
  return headings.map((match, index) => {
    const next = headings[index + 1];
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = next?.index ?? markdown.length;
    const body = markdown.slice(bodyStart, bodyEnd);
    return {
      id: match[1] ?? "FLOW-UNKNOWN",
      playwright: readListField(body, "Playwright"),
      routeOrScreen: readListField(body, "Route or Screen"),
      happyPath: readListField(body, "Happy Path"),
      edgeCases: readNestedListField(body, "Edge Cases"),
      databaseMutations: readListField(body, "Database Mutations"),
      expectedVisibleOutcome: readListField(body, "Expected Visible Outcome")
    };
  });
}

export function playwrightTitle(mapping: string): string | undefined {
  const [, title] = mapping.split("::");
  const normalized = title?.trim();
  return normalized !== undefined && normalized.length > 0 ? normalized : undefined;
}

export function isNoDatabaseMutation(value: string): boolean {
  return /^(none|n\/a|not applicable|no|no mutation|no database mutation|read only|read-only)$/i.test(value.trim());
}

function readListField(markdown: string, field: string): string {
  return new RegExp(`^-\\s*${escapeRegExp(field)}:\\s*(.*)$`, "im").exec(markdown)?.[1]?.trim() ?? "";
}

function readNestedListField(markdown: string, field: string): readonly string[] {
  const fieldPattern = new RegExp(`^-\\s*${escapeRegExp(field)}:\\s*$`, "im");
  const match = fieldPattern.exec(markdown);
  if (match === null) {
    const inline = readListField(markdown, field);
    return inline.length > 0 ? [inline] : [];
  }
  const after = markdown.slice((match.index ?? 0) + match[0].length);
  const nextFieldIndex = after.search(/\n-\s+[A-Za-z][^:\n]*:\s*/);
  const block = nextFieldIndex >= 0 ? after.slice(0, nextFieldIndex) : after;
  return block
    .split(/\r?\n/)
    .map((line) => /^\s*-\s+(.*)$/.exec(line)?.[1]?.trim() ?? "")
    .filter((line) => line.length > 0 && !isNoEdgeCase(line));
}

function isNoEdgeCase(value: string): boolean {
  return /^(none|n\/a|not applicable|no edge cases|no error states)$/i.test(value.trim());
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
