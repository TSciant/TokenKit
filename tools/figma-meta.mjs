#!/usr/bin/env node
/**
 * Figma meta — what the Design tab in Storybook shows about each component.
 *
 *   npm run figma:meta        -> figma/meta.json
 *
 * For every component in figma/keys.json: where it is in Figma, which file
 * implements it, when the design was last pulled (the skins' last commit, or
 * their file time while they are uncommitted), when the code last changed, and
 * whether the code has moved on since the design was pulled. The last check's
 * numbers come from figma/checks.json, which tools/onion-check.mjs writes.
 *
 * The output is committed and travels with the kit. It is a snapshot, so it is
 * regenerated when the skins or the source change, not computed in the browser:
 * a public copy of the kit has a history of its own, and dates read from it
 * would say when it was published, not when the work happened.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => JSON.parse(readFileSync(resolve(ROOT, f), "utf8"));
const keys = read("figma/keys.json");
const onion = read("figma/onion.json").components;
const checks = existsSync(resolve(ROOT, "figma/checks.json")) ? read("figma/checks.json").components : {};

const git = (...a) => {
  try { return execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim(); } catch { return ""; }
};
/* The last commit that touched a path, unless the path has uncommitted changes
   (or is not tracked yet), in which case the newest file time under it. */
function touched(rel) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) return null;
  const dirty = git("status", "--porcelain", "--", rel);
  if (!dirty) {
    const d = git("log", "-1", "--format=%cI", "--", rel);
    if (d) return d;
  }
  const newest = (p) => {
    const s = statSync(p);
    if (!s.isDirectory()) return s.mtimeMs;
    return Math.max(0, ...readdirSync(p).map((f) => newest(join(p, f))));
  };
  return new Date(newest(abs)).toISOString();
}

const out = {};
for (const [name, node] of Object.entries(keys.components)) {
  if (name.includes("/")) continue; // RailNav/Item is part of RailNav
  const def = onion[name];
  const skinsFrom = def?.skinsFrom ?? name;
  const source = keys.sources?.[name];
  const skinDir = `figma/skins/${skinsFrom}`;
  const skins = existsSync(resolve(ROOT, skinDir)) ? readdirSync(resolve(ROOT, skinDir)).filter((f) => f.endsWith(".png")).length : 0;
  const sourceUpdatedAt = source ? touched(source) : null;
  const skinPulledAt = skins ? touched(skinDir) : null;
  out[name] = {
    node,
    figma: `https://www.figma.com/design/${keys.file}/?node-id=${node.replace(":", "-")}`,
    story: keys.stories?.[name] ?? null,
    source: source ?? null,
    skinDir: skins ? skinDir : null,
    skins,
    skinPulledAt,
    sourceUpdatedAt,
    stale: !!(sourceUpdatedAt && skinPulledAt && new Date(sourceUpdatedAt) > new Date(skinPulledAt)),
    check: checks[name] ?? null,
  };
}
writeFileSync(resolve(ROOT, "figma/meta.json"), JSON.stringify({ generated: new Date().toISOString(), file: keys.file, components: out }, null, 2) + "\n");
const stale = Object.entries(out).filter(([, v]) => v.stale).map(([k]) => k);
console.log(`figma meta: ${Object.keys(out).length} components, ${stale.length} with code newer than the design${stale.length ? ": " + stale.join(", ") : ""}`);
