#!/usr/bin/env node
/**
 * Neutral gate — no client's vocabulary survives in the kit.
 *
 * This repository is a boilerplate: it is forked per engagement, and the fork
 * is where a client's names, content and brand live. What must not happen is
 * the reverse — a client's words leaking back up into the kit, where they get
 * shipped to the next client.
 *
 * It is a hard thing to keep by eye. Client vocabulary does not arrive as a
 * logo; it arrives as a placeholder someone typed while testing a card ("Why
 * choose Acme"), as a fixture, as a code comment, as a story name, as an
 * example in a tool's usage text. There were thirty-one of them in one file
 * and none of them looked like a mistake in review.
 *
 *   npm run neutral
 *
 * The wordlist lives in tools/neutral-terms.json so that forking for a client
 * means editing data, not this file. Keep two lists there:
 *
 *   terms   case-insensitive regex fragments that must not appear
 *   allow   "path:pattern" pairs that are legitimate, each with a reason
 *
 * Every entry in `allow` is a claim that a hit is fine. Write the reason next
 * to it; an allowlist without reasons becomes the place violations go to die.
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIST = join(ROOT, "tools/neutral-terms.json");
/* Names live in a gitignored sibling so the wordlist is not itself the one
   file in the repo that names every client. Optional: a fresh clone has
   only the committed list. */
const LOCAL = join(ROOT, "tools/neutral-terms.local.json");

if (!existsSync(LIST)) {
  console.error(`No ${LIST}. The gate needs a wordlist; see the header of this file.`);
  process.exit(2);
}
const { terms: shared, allow } = JSON.parse(readFileSync(LIST, "utf8"));
const local = existsSync(LOCAL) ? JSON.parse(readFileSync(LOCAL, "utf8")).terms ?? [] : [];
const terms = [...(shared ?? []), ...local];
if (!terms.length) {
  console.error("tools/neutral-terms.json has no `terms`. Nothing to check.");
  process.exit(2);
}

const RE = new RegExp(`(${terms.join("|")})`, "gi");

/* Tracked files and untracked ones git is not ignoring. Plain `git ls-files`
   would skip anything added but not yet staged, which is where a fresh
   violation lives. */
const files = execSync("git ls-files -co --exclude-standard", { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter(
    (f) =>
      f &&
      /\.(tsx?|jsx?|mjs|css|md|html|json|txt)$/.test(f) &&
      !f.startsWith("src/client/") && // the client's own section: their words belong there
      f !== "tools/neutral-terms.json", // the wordlist names the terms by definition
  );

const allowed = (allow ?? []).map((a) => ({
  file: a.path,
  re: new RegExp(a.pattern, "i"),
  why: a.why ?? "",
}));

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
  const src = readSource(rel);
  if (src === null) continue;
  src.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(RE)) {
      if (allowed.some((a) => a.file === rel && a.re.test(line))) continue;
      hits.push({ file: rel, line: i + 1, term: m[1], text: line.trim().slice(0, 100) });
    }
  });
}

console.log(
  `\ntokenkit neutral gate — ${files.length} files, ${terms.length} terms, ${hits.length} hit(s)\n`,
);

for (const h of hits) {
  console.log(`FAIL  ${h.file}:${h.line}  "${h.term}"`);
  console.log(`      ${h.text}`);
}

if (hits.length) {
  console.log(
    "\nReplace the string, or — if it is legitimate — add it to `allow` in" +
      "\ntools/neutral-terms.json with a reason.\n",
  );
  console.log("Neutral gate FAILED.");
  process.exit(1);
}

console.log("No client vocabulary in the kit. Neutral gate passed.\n");
