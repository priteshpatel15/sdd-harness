const args = parseArgs(process.argv.slice(2));
const lens = args.lens ?? "review";
const promptFile = args.prompt ?? "review-prompt";

console.log(JSON.stringify({
  findings: [{
    id: `${lens}-local-command-review`,
    severity: "info",
    summary: `Deterministic local review for ${lens} found no blocking issue in the supplied packet.`,
    recommendation: "No action required from the local command review.",
    source: "local-command-review",
    evidenceRefs: [promptFile]
  }]
}, null, 2));

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
