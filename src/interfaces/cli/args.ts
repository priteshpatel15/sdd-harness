export interface ParsedArgs {
  readonly command: string;
  readonly options: Record<string, string | boolean | string[]>;
  readonly positional: readonly string[];
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const options: Record<string, string | boolean | string[]> = {};
  const positional: string[] = [];

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === undefined) {
      continue;
    }

    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey ?? "";
    const next = rest[index + 1];
    const value = inlineValue ?? (next !== undefined && !next.startsWith("--") ? next : true);
    if (inlineValue === undefined && value === next) {
      index += 1;
    }
    addOption(options, key, value);
  }

  return { command, options, positional };
}

export function getStringOption(options: Record<string, string | boolean | string[]>, key: string): string | undefined {
  const value = options[key];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[value.length - 1];
  }
  return undefined;
}

export function getStringArrayOption(options: Record<string, string | boolean | string[]>, key: string): string[] {
  const value = options[key];
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

export function getBooleanOption(options: Record<string, string | boolean | string[]>, key: string): boolean {
  return options[key] === true || options[key] === "true";
}

function addOption(options: Record<string, string | boolean | string[]>, key: string, value: string | boolean): void {
  const existing = options[key];
  if (existing === undefined) {
    options[key] = value;
  } else if (Array.isArray(existing)) {
    existing.push(String(value));
  } else {
    options[key] = [String(existing), String(value)];
  }
}
