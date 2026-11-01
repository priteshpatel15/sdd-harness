export function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "untitled";
}

export function sentenceList(input: string | readonly string[] | undefined): string[] {
  if (input === undefined) {
    return [];
  }

  if (typeof input !== "string") {
    return input.map((item) => item.trim()).filter(Boolean);
  }

  return input
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}
