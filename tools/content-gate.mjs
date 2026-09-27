#!/usr/bin/env node
/**
 * Content coverage — which brands have written which pages.
 *
 * NOT a pass/fail gate, and that distinction is the whole design. The content
 * packs are deliberately partial: a brand with no pages falls through to the
 * ipsum on every slot, because every pattern prop is optional and an absent
 * bag spreads to nothing. Partial is a working state, not a broken one, so
 * failing on it would be failing on the feature.
 *
 * What it is instead is a progress meter for an iterative job, and one honest
 * number: how much of what a reader sees under each brand is that brand's own
 * words, and how much is placeholder wearing its colours.
 *
 * The distinction worth keeping in view: a page nobody has written looks
 * FINE. It renders, it is typeset in the brand's face, it is the brand's
 * colours — and it says the kit's own words about tokens and containers. That
 * is a more expensive mistake to catch in a review than a blank page would
 * be, which is exactly why it gets counted rather than eyeballed.
 *
 *   node tools/content-gate.mjs
 *   node tools/content-gate.mjs --strict   exit 1 if any brand is empty
 *
 * Exit code 0 unless --strict.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = resolve(ROOT, "src/samples/content");
const strict = process.argv.includes("--strict");

/* The pages the content contract currently knows about, read from types.ts so
   this cannot fall behind the type — adding a page to `Pages` adds a column
   here with no second edit. The same argument as every other list in this
   repo that is derived rather than written. */
/* Every regex below assumes LF; git checks files out CRLF on Windows. */
const readLF = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const types = readLF(join(DIR, "types.ts"));
const block = types.match(/export type Pages = \{([\s\S]*?)\n\};/);
const PAGES = block
  ? [...block[1].matchAll(/^\s*(\w+)\??:/gm)].map((m) => m[1])
  : [];

const files = readdirSync(DIR).filter(
  (f) => f.endsWith(".ts") && f !== "types.ts",
);

const rows = [];
for (const file of files) {
  const src = readLF(join(DIR, file));
  const slug = src.match(/slug:\s*"([^"]+)"/)?.[1] ?? file.replace(/\.ts$/, "");
  const label = src.match(/label:\s*"([^"]+)"/)?.[1] ?? slug;

  /* Which pages this pack opens a block for. A key present with an object
     behind it is written; a key absent is not. Crude on purpose — the
     compiler already guarantees that whatever IS there is well typed, so the
     only question left for a text scan is presence. */
  const pagesBlock = src.match(/pages:\s*\{([\s\S]*)\n  \},?\n\};/);
  const written = PAGES.filter((p) =>
    new RegExp(`^\\s{4}${p}:\\s*\\{`, "m").test(pagesBlock?.[1] ?? ""),
  );

  /* A rough weight for how much of the brand a reader meets: the label and
     nav are on every page, so a pack with those and no pages is still doing
     something visible. */
  const hasNav = /\n  nav:\s*\[/.test(src);
  const hasSpine = /\n  spine:\s*\{/.test(src);

  rows.push({ slug, label, written, hasNav, hasSpine });
}

rows.sort((a, b) => b.written.length - a.written.length || a.slug.localeCompare(b.slug));

const pad = (s, n) => String(s).padEnd(n);
const wide = Math.max(...rows.map((r) => r.slug.length), 6);

console.log(
  `\ntokenkit content coverage — ${rows.length} brands, ${PAGES.length} pages in the contract\n`,
);
console.log(
  `  ${pad("brand", wide)}  ${PAGES.map((p) => pad(p, 9)).join("")}nav   spine`,
);
for (const r of rows) {
  console.log(
    `  ${pad(r.slug, wide)}  ` +
      PAGES.map((p) => pad(r.written.includes(p) ? "written" : "·", 9)).join("") +
      pad(r.hasNav ? "yes" : "·", 6) +
      (r.hasSpine ? "yes" : "·"),
  );
}

const filled = rows.reduce((n, r) => n + r.written.length, 0);
const total = rows.length * PAGES.length;
const empty = rows.filter((r) => r.written.length === 0);

console.log(
  `\n${filled} of ${total} brand-pages written · ${empty.length} brand(s) entirely on placeholder`,
);
if (empty.length) {
  console.log(
    `  ${empty.map((r) => r.slug).join(", ")} — renders in their own colours and says the kit's words.`,
  );
}

if (strict && empty.length) {
  console.error("\nContent coverage FAILED (--strict): a declared brand has no pages.");
  process.exit(1);
}
