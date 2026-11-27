#!/usr/bin/env node
/**
 * Logical CSS: the kit's stylesheets say start and end, never left and right,
 * so a right-to-left page mirrors without a second stylesheet
 * (docs/11-tokens-and-contracts.md, i18n). The kit already holds to this; this
 * gate keeps it that way.
 *
 * Fails on: margin/padding/border-left|right, left: and right: offsets,
 * text-align, float or clear set to left or right, and physical corner radii
 * (border-top-left-radius and the rest). Vertical properties (top, bottom,
 * margin-top) are not flagged: the kit writes horizontal text only.
 *
 * A deliberate exception goes in tools/logical-css-allow.json as
 * { "file:property": "why" }.
 *
 *   node tools/logical-css-gate.mjs
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const allowPath = join(ROOT, "tools/logical-css-allow.json");
const allow = existsSync(allowPath) ? JSON.parse(readFileSync(allowPath, "utf8")) : {};
const PHYSICAL = [
  [/^\s*(margin|padding|border)-(left|right)(-[\w-]+)?\s*:/, "use margin/padding/border-inline-start or -end"],
  [/^\s*(left|right)\s*:/, "use inset-inline-start or -end"],
  [/^\s*(text-align|float|clear)\s*:\s*(left|right)\b/, "use start or end (float: inline-start)"],
  [/^\s*border-(top|bottom)-(left|right)-radius\s*:/, "use border-start-start-radius and the rest"],
];
const files = [];
for (const dir of ["src/css", "src/css/components", "src/css/shells", "src/css/packs"]) {
  if (!existsSync(join(ROOT, dir))) continue;
  for (const f of readdirSync(join(ROOT, dir)).filter((x) => x.endsWith(".css"))) files.push(`${dir}/${f}`);
}
let bad = 0;
for (const f of files) {
  const lines = readFileSync(join(ROOT, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")).split("\n");
  lines.forEach((line, i) => {
    for (const [re, fix] of PHYSICAL) {
      const m = line.match(re);
      if (!m) continue;
      const prop = line.trim().split(":")[0];
      if (allow[`${f}:${prop}`]) continue;
      console.error(`${f}:${i + 1}  ${line.trim()}  -> ${fix}`);
      bad++;
    }
  });
}
if (bad) { console.error(`\nlogical CSS: ${bad} physical propert${bad === 1 ? "y" : "ies"} (or add a reason to tools/logical-css-allow.json)`); process.exit(1); }
console.log(`logical CSS: ${files.length} stylesheets, no left or right`);
