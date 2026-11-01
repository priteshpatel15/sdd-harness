import { access, readFile } from "node:fs/promises";

const args = parseArgs(process.argv.slice(2));
const expectedPath = args.expected ?? process.env.SDD_EXPECTED_MUTATIONS_FILE;
const testDatabase = args["test-database"] ?? process.env.SDD_TEST_DATABASE;

if (expectedPath === undefined || expectedPath.length === 0) {
  throw new Error("Missing expected mutations file.");
}

const expected = JSON.parse(await readFile(expectedPath, "utf8"));
const mutations = Array.isArray(expected.mutations) ? expected.mutations : undefined;
if (mutations === undefined) {
  throw new Error("Expected mutations file must contain a mutations array.");
}

if (mutations.length > 0) {
  if (testDatabase === undefined || testDatabase.length === 0) {
    throw new Error("Expected mutations require SDD_TEST_DATABASE or --test-database.");
  }
  await access(testDatabase);
}

console.log(`Verified ${mutations.length} expected database mutation(s) against isolated test data.`);

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value?.startsWith("--")) continue;
    parsed[value.slice(2)] = values[index + 1] ?? "";
    index += 1;
  }
  return parsed;
}
