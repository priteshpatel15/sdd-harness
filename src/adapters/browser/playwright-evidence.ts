export function extractTestBody(content: string, title: string): string {
  const titleIndex = content.indexOf(title);
  if (titleIndex < 0) {
    return "";
  }
  const nextTest = content.slice(titleIndex + title.length).search(/\btest(?:\.\w+)?\s*\(/);
  return nextTest < 0
    ? content.slice(titleIndex)
    : content.slice(titleIndex, titleIndex + title.length + nextTest);
}

export function containsStaticEvidence(testBody: string, expected: string): boolean {
  if (expected.trim().length === 0) {
    return false;
  }
  return testBody.toLowerCase().includes(expected.trim().toLowerCase());
}

export function containsVisibleOutcomeEvidence(testBody: string, expected: string): boolean {
  if (!containsStaticEvidence(testBody, expected)) {
    return false;
  }
  return /\bexpect\s*\(|toBeVisible|toHaveText|toContainText|getByText|findByText|locator/i.test(testBody);
}

export function containsPlaywrightHarness(content: string): boolean {
  return /@playwright\/test|\bplaywright\b|test(?:\.\w+)?\s*\([^,]+,\s*async\s*\(\s*\{\s*page\b|\bpage\.(goto|getBy|locator|click|fill|waitFor)/i.test(content);
}

export function containsDatabaseMutationEvidence(testBody: string, expected: string): boolean {
  const lowerBody = testBody.toLowerCase();
  const lowerExpected = expected.toLowerCase();
  return /database_url|sdd_test_database|test database|insert|update|delete|mutation|row|record|db\./i.test(testBody)
    || lowerExpected.split(/\W+/).filter((word) => word.length > 3).some((word) => lowerBody.includes(word));
}

export function jsonCandidates(text: string): readonly unknown[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }
  try {
    return [JSON.parse(trimmed) as unknown];
  } catch {
    // Continue with bounded object/array extraction below.
  }

  const values: unknown[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const start = text[index];
    if (start !== "{" && start !== "[") {
      continue;
    }
    const end = jsonEndIndex(text, index);
    if (end === undefined) {
      continue;
    }
    try {
      values.push(JSON.parse(text.slice(index, end + 1)) as unknown);
      index = end;
    } catch {
      // Ignore non-JSON substrings.
    }
  }
  return values;
}

export function jsonHasPassedTestTitle(value: unknown, title: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => jsonHasPassedTestTitle(item, title));
  }
  if (!isRecord(value)) {
    return false;
  }
  const hasMatchingTitle = Object.entries(value).some(([key, nested]) => (
    titleKey(key) && typeof nested === "string" && nested === title
  ));
  if (hasMatchingTitle && objectContainsPassedStatus(value)) {
    return true;
  }
  return Object.values(value).some((nested) => jsonHasPassedTestTitle(nested, title));
}

function jsonEndIndex(text: string, startIndex: number): number | undefined {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let index = startIndex; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }
    if (character === "\"") {
      inString = true;
      continue;
    }
    if (character === "{" || character === "[") {
      stack.push(character === "{" ? "}" : "]");
      continue;
    }
    if (character === "}" || character === "]") {
      const expected = stack.pop();
      if (expected !== character) {
        return undefined;
      }
      if (stack.length === 0) {
        return index;
      }
    }
  }
  return undefined;
}

function objectContainsPassedStatus(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(objectContainsPassedStatus);
  }
  if (!isRecord(value)) {
    return false;
  }
  return Object.entries(value).some(([key, nested]) => {
    if (key === "status" && typeof nested === "string" && /^(passed|expected)$/i.test(nested)) {
      return true;
    }
    return objectContainsPassedStatus(nested);
  });
}

function titleKey(key: string): boolean {
  return /^(title|testTitle|name)$/i.test(key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
