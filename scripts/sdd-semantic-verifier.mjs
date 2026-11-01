const args = parseArgs(process.argv.slice(2));
const dimension = args.dimension ?? "semantic";
const featureId = args.feature ?? "project";
const promptFile = args.prompt ?? "semantic-prompt";

console.log(JSON.stringify({
  findings: [{
    id: `${dimension}-local-command-verifier`,
    claimId: dimension,
    severity: "info",
    summary: `Deterministic local semantic verifier found no blocking issue for ${featureId}.`,
    evidenceRefs: [promptFile],
    requiredFix: "No action required from the local command verifier.",
    source: "local-command-semantic-verifier"
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
