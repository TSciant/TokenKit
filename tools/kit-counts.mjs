#!/usr/bin/env node
/**
 * The kit's counts, from the kit itself: components from the built Storybook's index (one per story title under
 * 04 Primitives, 05 Patterns and 10 Packs), gates from the steps `npm run check` runs (tools/check.mjs, less the
 * Storybook build itself, plus each check tools/browser-gates.mjs runs). The front page, the offer page, the README
 * and DELIVERABLES.md all say the same sentence, so none of them drifts (Tony, 2026-11-05: counts reconciled across
 * the site and the docs, generated at build time).
 *
 *   node tools/kit-counts.mjs           print the counts and the sentence
 *   node tools/kit-counts.mjs --write   rewrite the sentence between <!-- kit-counts --> markers in README.md and DELIVERABLES.md
 *   node tools/kit-counts.mjs --check   exit 1 if those markers say anything else (run after a Storybook build)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GROUPS = { primitives: "04 Primitives", patterns: "05 Patterns", packs: "10 Packs" };
const DOCS = ["README.md", "DELIVERABLES.md"];
const MARK = /<!-- kit-counts -->[\s\S]*?<!-- \/kit-counts -->/g;

export function kitCounts(root = ROOT) {
  const index = resolve(root, "storybook-static/index.json");
  if (!existsSync(index)) throw new Error("kit-counts: no storybook-static/index.json; run npm run build-storybook first");
  const titles = new Set(Object.values(JSON.parse(readFileSync(index, "utf8")).entries).map((e) => e.title));
  const n = Object.fromEntries(Object.entries(GROUPS).map(([k, g]) => [k, [...titles].filter((t) => t.startsWith(g + "/")).length]));
  const check = readFileSync(resolve(root, "tools/check.mjs"), "utf8"), steps = [...check.matchAll(/\{\s*name:\s*"([^"]+)"/g)].map((m) => m[1]);
  const browser = /const checks = \[([^\]]*)\]/.exec(readFileSync(resolve(root, "tools/browser-gates.mjs"), "utf8"))?.[1].match(/\w+Check\(\)/g) ?? [];
  const gates = steps.filter((s) => s !== "storybook build" && s !== "browser gates").length + browser.length;
  return { ...n, components: n.primitives + n.patterns + n.packs, gates };
}

/** The one sentence everything says. */
export function countsSentence(c = kitCounts()) {
  return `${c.components} components (${c.primitives} primitives, ${c.patterns} patterns and ${c.packs} device and media packs), checked by ${c.gates} automated gates for contrast, reflow, accessibility, motion and Figma parity`;
}

const block = (s) => `<!-- kit-counts -->${s}.<!-- /kit-counts -->`;

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const c = kitCounts(), s = countsSentence(c), want = block(s);
  if (process.argv.includes("--write") || process.argv.includes("--check")) {
    const stale = [];
    for (const f of DOCS) {
      const p = resolve(ROOT, f), txt = readFileSync(p, "utf8");
      if (!MARK.test(txt)) { stale.push(`${f}: no <!-- kit-counts --> markers`); continue; }
      const next = txt.replace(MARK, () => want);
      if (next !== txt) { if (process.argv.includes("--write")) writeFileSync(p, next); else stale.push(`${f}: says other counts`); }
    }
    if (stale.length) { console.error("kit-counts: " + stale.join("; ") + "\n  node tools/kit-counts.mjs --write"); process.exit(1); }
  }
  console.log(JSON.stringify(c), "\n" + s + ".");
}
