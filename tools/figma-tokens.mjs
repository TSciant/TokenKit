#!/usr/bin/env node
/**
 * figma/tokens.json — what the Figma variables should hold.
 *
 * The Figma file's variables (collection `tk`: colour, length, number and
 * string per pack, plus `tk-density` and `tk-type`) were typed in by hand from
 * the packs and drifted twice. This reads them instead.
 *
 * The chain since 2026-11-27 (docs/11-tokens-and-contracts.md):
 *
 *   tokens/*.tokens.json -> generated CSS -> resolved here, in a browser
 *     -> figma/tokens.json -> the Figma variables (a use_figma script)
 *
 * It loads the kit's own stylesheets on a probe page (as tools/tokens-export.mjs
 * does), so Storybook need not be running, puts the probe into each Figma mode
 * (a pack, inverse or not, a density) and asks the browser what every variable
 * resolves to.
 *
 *   node tools/figma-tokens.mjs
 *
 * It writes figma/tokens.json:  { collection: { variable: { mode: value } } }
 * Colours are #rrggbb or #rrggbbaa; lengths are px numbers; durations are ms
 * and tracking is em, both as plain numbers; a font stack is its first family,
 * which is what a Figma text layer can bind.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROBE = resolve(ROOT, "dist/.figma-token-probe.html");

/* Figma mode -> how the probe is put into it. Modes the Figma file holds that no
   kit pack backs (a game palette) are not listed and are left alone. */
const TK_MODES = {
  wireframe: { pack: "wireframe" },
  "wireframe-inverse": { pack: "wireframe", inverse: true },
  "wireframe-dark": { pack: "wireframe-dark" },
  "wireframe-dark-inverse": { pack: "wireframe-dark", inverse: true },
  tk: { pack: "tk" }, "door-shop": { pack: "door-shop" }, mohave: { pack: "mohave" },
  "bathing-bagels": { pack: "bathing-bagels" }, wandas: { pack: "wandas" }, muncheese: { pack: "muncheese" },
};
const DENSITY_MODES = {
  default: { pack: "wireframe", density: "default" }, compact: { pack: "wireframe", density: "compact" },
  comfortable: { pack: "wireframe", density: "comfortable" },
  "door-shop": { pack: "door-shop" }, mohave: { pack: "mohave" }, "bathing-bagels": { pack: "bathing-bagels" },
  wandas: { pack: "wandas" }, muncheese: { pack: "muncheese" },
};

/* The variables Figma holds. Name -> css custom property. */
const css = (n) => "--tk-" + n.replace(/\//g, "-");
/* Optional tokens resolve through the fallback the component uses, so the
   variable holds what a pack without them actually paints. */
const FALLBACK = {
  "action/danger-fill": "--tk-action-fill", "action/danger-fill-hover": "--tk-action-fill-hover",
  "action/danger-fill-active": "--tk-action-fill-active", "action/danger-text": "--tk-action-text",
  "action/danger-quiet-text": "--tk-action-quiet-text",
  /* the tk-code set: a pack without it paints code in its text inks */
  "code/keyword": "--tk-text-primary", "code/tag": "--tk-text-primary", "code/property": "--tk-text-secondary",
  "code/string": "--tk-text-secondary", "code/number": "--tk-text-secondary", "code/comment": "--tk-text-tertiary",
  "code/punctuation": "--tk-text-tertiary",
};
const prop = (n) => (FALLBACK[n] ? `${css(n)}, var(${FALLBACK[n]})` : css(n));
const COLOR = `action/fill action/fill-active action/fill-hover action/text action/quiet-fill action/quiet-fill-hover action/quiet-text
 action/danger-fill action/danger-fill-hover action/danger-fill-active action/danger-text action/danger-quiet-text
 code/keyword code/tag code/property code/string code/number code/comment code/punctuation
 data/ink focus/color glass/fill glass/ink glass/line line/default line/strong line/subtle logo/ink logo/mark-ink logo/tagline-ink logo/tile logo/word-ink
 scrim/ink surface/base surface/default surface/inverse surface/raised surface/sunken text/disabled text/inverse text/on-scrim text/primary text/secondary text/tertiary
 texture/ink texture/paint status/danger-line status/danger-surface status/danger-text status/info-line status/info-surface status/info-text
 status/success-line status/success-surface status/success-text status/warning-line status/warning-surface status/warning-text gradient/from gradient/to`.split(/\s+/);
const LENGTH_TK = `focus/offset focus/width icon/lg icon/md icon/sm plate/bleed-pad plate/max plate/max-portrait plate/min radius/control radius/full radius/lg radius/md radius/nested radius/none radius/sm radius/xl target/comfortable target/min`.split(/\s+/);
const NUMBER_TK = `duration/fast duration/base duration/slow leading/display logo/word-weight scrim/aa-large scrim/aa scrim/aaa`.split(/\s+/);
const STRING_TK = `ease/standard ease/entrance ease/exit motion/ink motion/surface motion/line motion/elevation motion/opacity motion/transform motion/size motion/enter motion/exit gradient/angle display/case shadow/sm shadow/md font/display font/sans font/mono`.split(/\s+/);
const LENGTH_DENSITY = `gutter measure measure/narrow space/0 space/1 space/2 space/3 space/4 space/5 space/6 space/7 space/8 space/9`.split(/\s+/);
const LENGTH_TYPE = `size/xs size/sm size/base size/md size/lg size/xl size/2xl size/3xl size/4xl`.split(/\s+/);
const NUMBER_TYPE = `weight/normal weight/medium weight/semibold weight/bold leading/tight leading/snug leading/normal leading/relaxed tracking/display tracking/tight tracking/snug tracking/normal tracking/wide`.split(/\s+/);

mkdirSync(dirname(PROBE), { recursive: true });
writeFileSync(PROBE, `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../src/css/index.css"><link rel="stylesheet" href="../src/css/specimens.css"><body><div id="host"></div></body>`);
const b = await chromium.launch(process.env.TOKENKIT_CHROMIUM ? { executablePath: process.env.TOKENKIT_CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
await p.goto(pathToFileURL(PROBE).href, { waitUntil: "networkidle" });
/* measure is in ch, so it depends on the face being loaded, and a face only
   loads once something asks for it. Ask for each pack's families and wait. */
await p.evaluate(async () => {
  const host = document.getElementById("host"), packs = ["wireframe", "tk", "door-shop", "mohave", "bathing-bagels", "wandas", "muncheese"];
  const fams = new Set();
  for (const pk of packs) { host.setAttribute("data-brand", pk); const cs = getComputedStyle(host); for (const v of ["--tk-font-sans", "--tk-font-display", "--tk-font-mono"]) fams.add(cs.getPropertyValue(v).trim()); }
  await Promise.all([...fams].filter(Boolean).flatMap((f) => ["400", "600", "700"].map((w) => document.fonts.load(`${w} 16px ${f}`).catch(() => null))));
  await document.fonts.ready;
});

async function read(mode, names, kind) {
  return p.evaluate(({ names, kind, inverse, pack, density }) => {
    const host = document.getElementById("host");
    host.setAttribute("data-brand", pack);
    if (density && density !== "default") host.setAttribute("data-density", density); else host.removeAttribute("data-density");
    const wrap = document.createElement("div"); if (inverse) wrap.setAttribute("data-on", "inverse"); host.appendChild(wrap);
    const probe = document.createElement("div"); probe.style.cssText = "position:absolute;visibility:hidden"; wrap.appendChild(probe);
    const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
    const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0");
    const out = {};
    for (const [name, prop] of names) {
      if (kind === "number" || kind === "string") {
        const raw = getComputedStyle(probe).getPropertyValue(prop.split(",")[0]).trim();
        if (!raw) continue;
        if (kind === "string") out[name] = /^--tk-font/.test(prop) ? raw.split(",")[0].trim().replace(/^["']|["']$/g, "") : raw.replace(/\s+/g, " ");
        else { const n = parseFloat(raw); if (Number.isFinite(n)) out[name] = +n.toFixed(4); }
      } else if (kind === "color") {
        probe.style.color = "transparent"; probe.style.color = `var(${prop})`; const c = getComputedStyle(probe).color;
        cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data;
        out[name] = d[3] === 255 ? "#" + hex2(d[0]) + hex2(d[1]) + hex2(d[2]) : "#" + hex2(d[0]) + hex2(d[1]) + hex2(d[2]) + hex2(d[3]);
      } else {
        probe.style.width = "0px"; probe.style.width = `var(${prop})`; const w = parseFloat(getComputedStyle(probe).width);
        /* Layout rounds to 1/64 px, so 4px × 0.85 reads back as 3.390625. Within
           that step of a tenth, the tenth is the value; otherwise keep two places. */
        const tenth = Math.round(w * 10) / 10;
        if (Number.isFinite(w)) out[name] = Math.abs(w - tenth) <= 1 / 64 ? tenth : +w.toFixed(2);
      }
    }
    wrap.remove(); return out;
  }, { names: names.map((n) => [n, prop(n)]), kind, inverse: !!mode.inverse, pack: mode.pack, density: mode.density ?? "default" });
}

const tk = {}, density = {}, type = {};
for (const [m, mode] of Object.entries(TK_MODES)) {
  const all = { ...(await read(mode, COLOR, "color")), ...(await read(mode, LENGTH_TK, "length")), ...(await read(mode, NUMBER_TK, "number")), ...(await read(mode, STRING_TK, "string")) };
  for (const [k, v] of Object.entries(all)) (tk[k] ??= {})[m] = v;
}
for (const [m, mode] of Object.entries(DENSITY_MODES)) {
  const l = await read(mode, LENGTH_DENSITY, "length");
  for (const [k, v] of Object.entries(l)) (density[k] ??= {})[m] = v;
}
const t = { ...(await read({ pack: "wireframe" }, LENGTH_TYPE, "length")), ...(await read({ pack: "wireframe" }, NUMBER_TYPE, "number")) };
for (const [k, v] of Object.entries(t)) type[k] = { base: v };
await b.close();

writeFileSync(resolve(ROOT, "figma/tokens.json"), JSON.stringify({ note: "Resolved from tokens/*.tokens.json (through the generated CSS, in a browser) by tools/figma-tokens.mjs; applied to the Figma variables by a use_figma script. Do not hand-edit.", tk, "tk-density": density, "tk-type": type }, null, 1) + "\n");
console.log(`figma/tokens.json: ${Object.keys(tk).length} tk, ${Object.keys(density).length} tk-density, ${Object.keys(type).length} tk-type variables`);
