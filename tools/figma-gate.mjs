#!/usr/bin/env node
/**
 * Figma consistency gate — no browser, no network, under a second.
 *
 * The Figma side is four hand-kept maps (keys.json, onion.json) and two
 * snapshots (meta.json, checks.json) around a folder of skins. Each says
 * something about the same components, and nothing forced them to agree. This
 * checks that they do:
 *
 *   - the same components are named in keys, onion and meta
 *   - every source file exists, every skin folder exists and is not empty, and
 *     each folder's index.json counts the PNGs that are in it
 *   - every story id is the same in keys and onion, and, when Storybook has been
 *     built, is a story that exists
 *   - no two components share a Figma node unless one borrows the other's skins
 *     (onion.json skinsFrom), which is how ContactCta is Button
 *   - the last onion-check is under its ceiling (8 by default; onion.json
 *     `maxMean` writes an accepted higher number down instead of tolerating it)
 *
 * Stale skins (the source changed after the design was pulled) are a warning,
 * not a failure: the design may simply not have needed to change.
 *
 *   node tools/figma-gate.mjs
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => JSON.parse(readFileSync(resolve(ROOT, f), "utf8"));
const keys = read("figma/keys.json");
const onion = read("figma/onion.json").components;
const meta = read("figma/meta.json").components;
const checks = existsSync(resolve(ROOT, "figma/checks.json")) ? read("figma/checks.json").components : {};

const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const top = Object.keys(keys.components).filter((n) => !n.includes("/"));

for (const [label, set] of [["onion.json", Object.keys(onion)], ["meta.json", Object.keys(meta)]]) {
  for (const n of top) if (!set.includes(n)) err(`${n} is in keys.json but not in ${label}`);
  for (const n of set) if (!top.includes(n)) err(`${n} is in ${label} but not in keys.json`);
}

const nodes = new Map();
for (const n of top) {
  const def = onion[n] ?? {};
  const id = keys.components[n];
  const alias = def.skinsFrom && def.skinsFrom !== n;
  if (nodes.has(id) && !alias && !onion[nodes.get(id)]?.skinsFrom) err(`${n} and ${nodes.get(id)} share Figma node ${id}; if one borrows the other's design, say skinsFrom`);
  if (!nodes.has(id)) nodes.set(id, n);

  const src = keys.sources?.[n];
  if (!src) err(`${n} has no source in keys.json`);
  else if (!existsSync(resolve(ROOT, src))) err(`${n}: source ${src} does not exist`);

  const dir = resolve(ROOT, "figma/skins", def.skinsFrom ?? n);
  const pngs = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".png")) : [];
  if (!pngs.length) err(`${n}: no skins in figma/skins/${def.skinsFrom ?? n}`);
  else if (existsSync(resolve(dir, "index.json"))) {
    const idx = JSON.parse(readFileSync(resolve(dir, "index.json"), "utf8"));
    const listed = Object.keys(idx.skins ?? {}).length;
    if (listed && listed !== pngs.length) err(`${n}: index.json lists ${listed} skins, the folder holds ${pngs.length}`);
  }

  if (def.story && keys.stories?.[n] !== def.story) err(`${n}: story is ${def.story} in onion.json and ${keys.stories?.[n]} in keys.json`);

  const c = checks[n];
  const ceiling = def.maxMean ?? 8;
  if (c && c.mean > ceiling) err(`${n}: last onion-check mean ${c.mean} is over its ceiling ${ceiling} (set maxMean in onion.json only if the drift is accepted)`);
  if (!c) warn(`${n}: no onion-check result in checks.json`);
  if (meta[n]?.stale) warn(`${n}: the source changed after the skins were pulled`);
}

/* The mode sheets: a Figma sheet per pack and per density, each photographed
   against the page under the same toolbar settings (tools/modes-check.mjs). */
const modesDir = resolve(ROOT, "figma/modes");
if (existsSync(modesDir)) {
  const mchecks = existsSync(resolve(modesDir, "checks.json")) ? JSON.parse(readFileSync(resolve(modesDir, "checks.json"), "utf8")).modes ?? {} : {};
  const ceilings = existsSync(resolve(modesDir, "ceilings.json")) ? JSON.parse(readFileSync(resolve(modesDir, "ceilings.json"), "utf8")) : {};
  for (const f of readdirSync(modesDir).filter((x) => x.endsWith(".png"))) {
    const m = f.slice(0, -4), c = mchecks[m];
    if (!c) err(`modes/${m}: no modes-check result in figma/modes/checks.json`);
    else {
      const ceiling = ceilings[m]?.max ?? 8;
      if (c.mean > ceiling) err(`modes/${m}: last modes-check mean ${c.mean} is over its ceiling ${ceiling} (figma/modes/ceilings.json records an accepted higher number)`);
    }
  }
}

/* The story ids must exist, when there is a build to ask. */
const built = resolve(ROOT, "storybook-static/index.json");
if (existsSync(built)) {
  const ids = new Set(Object.keys(JSON.parse(readFileSync(built, "utf8")).entries ?? {}));
  for (const n of top) { const s = keys.stories?.[n]; if (s && !ids.has(s)) err(`${n}: story ${s} is not in the Storybook build`); }
}

for (const w of warns) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  FAIL  ${e}`);
console.log(`figma gate: ${top.length} components, ${errors.length} problem${errors.length === 1 ? "" : "s"}, ${warns.length} warning${warns.length === 1 ? "" : "s"}`);
process.exit(errors.length ? 1 : 0);
