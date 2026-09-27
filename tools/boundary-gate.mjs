#!/usr/bin/env node
/**
 * Boundary gate — the kit does not depend on one client's code.
 *
 * `src/client/` holds work authored for a single engagement. The kit around it
 * is meant to stay general, so that a delivery can be a subset of the repo
 * rather than everything the author owns. That only holds while the arrow
 * points one way: client code may import the kit, the kit may not import
 * client code.
 *
 * One import in the wrong direction is enough to break it, and it is the kind
 * of thing that happens by autocomplete rather than by decision — which is
 * exactly why it wants a gate rather than a note in a README.
 *
 *   npm run boundary
 *
 * This checks direction, not ownership. It cannot tell you that a component
 * sitting in the kit was really written for one client; that judgement is in
 * `src/client/README.md` and it stays a human one.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLIENT = "src/client/";

/* Static imports, dynamic imports, re-exports and require. A gate that only
   knew about `import x from` would pass a file that used any of the others. */
const SPECIFIER =
  /(?:^|\s)(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\s*\(\s*["']([^"']+)["']\s*\)/g;

/* `-co --exclude-standard`: tracked files AND untracked ones that are not
   ignored. Plain `git ls-files` lists only what is already staged, which means
   a brand-new file is invisible to the gate until the commit that introduces
   it has been made — and a brand-new file is exactly where a new violation
   arrives. Verified by adding a crossing import to an unstaged file: the
   tracked-only version reported 0 crossings and exited 0. */
/* The composition root is exempt, and has to be.

   A dependency-direction rule always exempts the place where the wiring
   happens, because wiring is the one job that is allowed to know about both
   sides. next/app/ is that place: on an engagement branch its routes are the
   agreed page compositions, and those live under src/client/. Scanning it
   would fail the gate for doing exactly what the branch is for.

   Everything else stays in scope. src/ is the library and must not know the
   client exists; tools/ is the measuring equipment and has no business
   depending on one engagement's code either. */
const COMPOSITION_ROOT = "next/app/";

const files = execSync("git ls-files -co --exclude-standard src next tools", {
  cwd: ROOT,
  encoding: "utf8",
})
  .split("\n")
  .filter(
    (f) =>
      f && /\.(tsx?|mjs|jsx?)$/.test(f) && !f.replace(/\\/g, "/").startsWith(COMPOSITION_ROOT),
  );

const hits = [];

/* `git ls-files -co` lists TRACKED files, and a tracked file deleted in the
   working tree stays tracked until the deletion is staged. A scratch script
   that was committed and then removed took this gate down with ENOENT — a
   gate failing for a reason with nothing to do with what it checks, which is
   how gates get commented out. A file that is not there holds no violation. */
function readSource(rel) {
  try {
    return readFileSync(join(ROOT, rel), "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

for (const rel of files) {
  if (rel.startsWith(CLIENT)) continue; // client code may import anything
  const src = readSource(rel);
  if (src === null) continue;
  const lines = src.split(/\r?\n/);

  for (const m of src.matchAll(SPECIFIER)) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (!spec) continue;

    /* Resolve relative specifiers against the importing file; leave bare
       package specifiers alone, since none of them can be client code. */
    let target;
    if (spec.startsWith(".")) target = relative(ROOT, resolve(dirname(join(ROOT, rel)), spec));
    else if (spec.includes("src/client/")) target = spec;
    else continue;

    if (!target.replace(/\\/g, "/").includes("src/client/")) continue;

    /* The pattern's leading (?:^|\s) can swallow the newline before the
       statement, which would report the line above the one at fault. */
    const start = m.index + (m[0].length - m[0].trimStart().length);
    const line = src.slice(0, start).split("\n").length;
    hits.push({ file: rel, line, spec, text: lines[line - 1]?.trim() ?? "" });
  }
}

console.log(`\ntokenkit boundary gate — ${files.length} files, ${hits.length} crossing(s)\n`);

for (const h of hits) {
  console.log(`FAIL  ${h.file}:${h.line}  imports ${h.spec}`);
  console.log(`      ${h.text}`);
}

if (hits.length) {
  console.log(
    "\nThe kit is importing client code. Move the shared part up into the kit," +
      "\nor move the importing file down into src/client/. Do not edit around it.\n",
  );
  console.log("Boundary gate FAILED.");
  process.exit(1);
}

console.log("Nothing above src/client/ depends on it. Boundary gate passed.\n");
