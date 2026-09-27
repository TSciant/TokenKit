#!/usr/bin/env node
/**
 * Start Storybook on a port derived from the project folder, not on 6006.
 *
 * 6006 is the Storybook default, which means every Storybook on the machine
 * wants it, every other project's included. Deriving from the folder name
 * gives this one a stable port of its own.
 *
 *   npm run storybook
 *   npm run storybook -- --why     print the port, start nothing
 *   npm run storybook -- --port N  pin it
 *
 * Implementation note, because the obvious version is broken on Windows:
 * this resolves Storybook's own JS entry point and runs it with the current
 * Node binary. It does NOT spawn `npx`. Since Node 18.20 / 20.12 (the fix for
 * CVE-2024-27980), spawning a `.cmd` or `.bat` shim without `shell: true`
 * fails outright with EINVAL, and `npx` on Windows is `npx.cmd`. Using
 * `shell: true` would work but puts the argument list through cmd.exe
 * quoting; running the JS directly avoids both problems and is faster.
 */

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { derivePort, findPort, inUse, projectName, RESERVED } from "./port.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const arg = (n) => {
  const i = argv.indexOf(n);
  return i > -1 ? argv[i + 1] : null;
};

const name = projectName(ROOT);
const derived = derivePort(name, 1); // +1: the static server takes +0

if (argv.includes("--why")) {
  console.log(`project        ${name}`);
  console.log(`storybook port ${derived}`);
  console.log(`in use         ${(await inUse(derived)) ? "yes" : "no"}`);
  process.exit(0);
}

const pinned = arg("--port") ? Number(arg("--port")) : null;
if (pinned && RESERVED.has(pinned)) {
  console.error(`Port ${pinned} is reserved (${RESERVED.get(pinned)}).`);
  process.exit(1);
}

/** Storybook's CLI entry, as a plain .js file we can hand to node. */
function resolveStorybookCli() {
  const require = createRequire(resolve(ROOT, "package.json"));
  let pkgPath;
  try {
    pkgPath = require.resolve("storybook/package.json");
  } catch {
    console.error(
      "Storybook is not installed. Run `npm install` in this folder first.",
    );
    process.exit(1);
  }
  const pkg = require(pkgPath);
  const bin =
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.storybook ?? pkg.bin?.sb;
  if (!bin) {
    console.error(`Could not find a bin entry in ${pkgPath}.`);
    process.exit(1);
  }
  const cli = resolve(dirname(pkgPath), bin);
  if (!existsSync(cli)) {
    console.error(`Storybook CLI missing at ${cli}. Try reinstalling.`);
    process.exit(1);
  }
  return cli;
}

const port = pinned ?? (await findPort(derived));

// Drop our own --port pair; pass anything else straight through.
const passthrough = argv.filter((a, i) => a !== "--port" && argv[i - 1] !== "--port");

const cli = resolveStorybookCli();

console.log(`\n  storybook on http://localhost:${port}  (derived from "${name}")\n`);

const child = spawn(
  process.execPath,
  [cli, "dev", "-p", String(port), ...passthrough],
  { stdio: "inherit", cwd: ROOT },
);

child.on("error", (err) => {
  console.error(`\nCould not start Storybook: ${err.message}\n`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => child.kill(sig));
}
