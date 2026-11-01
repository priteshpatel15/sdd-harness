import { ValidationError } from "../../domain/errors";

export function renderCommandTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((command, [key, value]) => command.replaceAll(`{${key}}`, shellQuote(value)), template);
}

export function parseAgentJson(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("Agent returned empty output.");
  }
  const parsed = parseJsonValue(trimmed);
  if (parsed !== undefined) {
    return unwrapAgentJson(parsed);
  }
  const objectText = extractJsonObject(trimmed);
  if (objectText !== undefined) {
    const extracted = parseJsonValue(objectText);
    if (extracted !== undefined) {
      return unwrapAgentJson(extracted);
    }
  }
  throw new ValidationError("Agent output did not contain valid JSON.");
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function unwrapAgentJson(value: unknown): unknown {
  if (typeof value === "object" && value !== null && "result" in value) {
    const record = value as { readonly result?: unknown };
    if (typeof record.result === "string") {
      return parseAgentJson(record.result);
    }
  }
  if (typeof value === "object" && value !== null && "content" in value) {
    const record = value as { readonly content?: unknown };
    if (typeof record.content === "string") {
      return parseAgentJson(record.content);
    }
  }
  return value;
}

function parseJsonValue(rawText: string): unknown | undefined {
  try {
    return JSON.parse(rawText);
  } catch {
    return undefined;
  }
}

function extractJsonObject(rawText: string): string | undefined {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  return start >= 0 && end > start ? rawText.slice(start, end + 1) : undefined;
}
