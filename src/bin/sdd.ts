#!/usr/bin/env node
import { runCli } from "../interfaces/cli/main";

void runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (message) => process.stdout.write(`${message}\n`),
  stderr: (message) => process.stderr.write(`${message}\n`)
}).then((exitCode) => {
  process.exitCode = exitCode;
});
