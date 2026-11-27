#!/usr/bin/env node
/**
 * Portability: every tk slot can reach a platform without CSS.
 *
 * Resolved values are already portable (the browser export turns every slot
 * into a colour, a length, a number, a duration, an easing, a font list or a
 * shadow, per pack and context). What resolution hides is a slot whose web
 * form means something only a browser can do: currentColor, url(), viewport
 * or container units, env(), or a value that changes inside @media. Those
 * need a recorded mapping, so a native kit knows what to do instead of
 * guessing. This fails when a source uses one and tokens/platforms.json
 * doesn't say how it maps.
 *
 *   node tools/tokens-portable.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const WEB_ONLY = /currentColor|url\(|\d(?:vw|vh|svh|dvh|lvh|vmin|vmax)\b|\dcq[iwbh]\b|env\(|attr\(/;

const listed = read("tokens/platforms.json").slots;
const files = ["tokens/scale.tokens.json", ...readdirSync(join(ROOT, "tokens/packs")).map((f) => `tokens/packs/${f}`)];
const need = new Map();
const walk = (n, file, inMedia) => {
  if (Array.isArray(n)) return n.forEach((x) => walk(x, file, inMedia));
  if (!n || typeof n !== "object") return;
  if (n.slot !== undefined) {
    const why = WEB_ONLY.exec(n.$value)?.[0] ?? (inMedia ? "@media" : null);
    if (why) (need.get(n.slot) ?? need.set(n.slot, new Set()).get(n.slot)).add(`${why} in ${basename(file, ".tokens.json")}`);
  }
  for (const k of ["rules", "body", "items"]) if (n[k]) walk(n[k], file, inMedia || /^@media/.test(n.at ?? ""));
};
for (const f of files) { const j = read(f); walk(j.rules ?? j.body, f, false); }

const missing = [...need].filter(([slot]) => !listed[slot]);
const stale = Object.keys(listed).filter((s) => !need.has(s));
for (const [slot, why] of missing) console.error(`not portable: --tk-${slot} (${[...why].join(", ")}) has no entry in tokens/platforms.json`);
for (const s of stale) console.error(`tokens/platforms.json lists --tk-${s}, which no longer uses a web-only form: remove it`);
if (missing.length || stale.length) process.exit(1);
console.log(`tokens portable: ${need.size} slots use a web-only form, each with a recorded native mapping`);
