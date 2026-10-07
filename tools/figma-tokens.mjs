#!/usr/bin/env node
/**
 * figma/tokens.json — what the Figma variables should hold, read from the page.
 *
 * The Figma file's variables (collection `tk`: colour and length per pack, plus
 * `tk-density` and `tk-type`) were typed in by hand from the packs and have
 * drifted twice. This reads them instead: it opens the Mode sheet story under
 * every pack and asks the browser what each token resolves to, so a pack, a
 * density or a token change is one command and the numbers are the page's own.
 *
 *   node tools/figma-tokens.mjs        (Storybook must be running)
 *
 * It writes figma/tokens.json:  { collection: { variable: { mode: value } } }
 * Colours are #rrggbb or #rrggbbaa; lengths are px numbers. Strings and unitless
 * numbers (easings, gradient angles, weights) are not written: they are not
 * what drifts and a probe cannot read them reliably.
 *
 * Applying it is a Figma step (the use_figma tool; docs/10-figma.md): a script
 * with the JSON in it compares and sets each variable and reports what moved.
 */
import { chromium } from "playwright";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { derivePort, projectName } from "./port.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = `http://localhost:${derivePort(projectName(ROOT), 1)}`;
const STORY = "03-foundations-08-modes--sheet";

/* Figma mode -> how the page is put into it */
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

/* The variables Figma holds that a probe can read. Name -> css custom property. */
const css = (n) => "--tk-" + n.replace(/\//g, "-");
/* Optional tokens resolve through the fallback the component uses, so the
   variable holds what a pack without them actually paints. */
const FALLBACK = {
  "action/danger-fill": "--tk-action-fill", "action/danger-fill-hover": "--tk-action-fill-hover",
  "action/danger-fill-active": "--tk-action-fill-active", "action/danger-text": "--tk-action-text",
  "action/danger-quiet-text": "--tk-action-quiet-text",
};
const prop = (n) => (FALLBACK[n] ? `${css(n)}, var(${FALLBACK[n]})` : css(n));
const COLOR = `action/fill action/fill-active action/fill-hover action/text action/quiet-fill action/quiet-fill-hover action/quiet-text
 action/danger-fill action/danger-fill-hover action/danger-fill-active action/danger-text action/danger-quiet-text
 data/ink focus/color glass/fill glass/ink glass/line line/default line/strong line/subtle logo/ink logo/mark-ink logo/tagline-ink logo/tile logo/word-ink
 scrim/ink surface/base surface/default surface/inverse surface/raised surface/sunken text/disabled text/inverse text/on-scrim text/primary text/secondary text/tertiary
 texture/ink texture/paint status/danger-line status/danger-surface status/danger-text status/info-line status/info-surface status/info-text
 status/success-line status/success-surface status/success-text status/warning-line status/warning-surface status/warning-text gradient/from gradient/to`.split(/\s+/);
const LENGTH_TK = `focus/offset focus/width icon/lg icon/md icon/sm plate/bleed-pad plate/max plate/max-portrait plate/min radius/control radius/full radius/lg radius/md radius/nested radius/none radius/sm radius/xl target/comfortable target/min`.split(/\s+/);
const LENGTH_DENSITY = `gutter measure measure/narrow space/0 space/1 space/2 space/3 space/4 space/5 space/6 space/7 space/8 space/9`.split(/\s+/);
const LENGTH_TYPE = `size/xs size/sm size/base size/md size/lg size/xl size/2xl size/3xl size/4xl`.split(/\s+/);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
async function read(mode, names, kind) {
  const g = `pack:${mode.pack};density:${mode.density ?? "default"}`;
  await p.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story&globals=${g}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(250);
  return p.evaluate(({ names, kind, inverse }) => {
    const host = document.querySelector("#storybook-root .sb-host");
    const wrap = document.createElement("div"); if (inverse) wrap.setAttribute("data-on", "inverse"); host.appendChild(wrap);
    const probe = document.createElement("div"); probe.style.cssText = "position:absolute;visibility:hidden"; wrap.appendChild(probe);
    const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
    const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0");
    const out = {};
    for (const [name, prop] of names) {
      if (kind === "color") {
        probe.style.color = "transparent"; probe.style.color = `var(${prop})`; const c = getComputedStyle(probe).color;
        cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data;
        out[name] = d[3] === 255 ? "#" + hex2(d[0]) + hex2(d[1]) + hex2(d[2]) : "#" + hex2(d[0]) + hex2(d[1]) + hex2(d[2]) + hex2(d[3]);
      } else {
        probe.style.width = "0px"; probe.style.width = `var(${prop})`; const w = parseFloat(getComputedStyle(probe).width);
        if (Number.isFinite(w)) out[name] = +w.toFixed(2);
      }
    }
    wrap.remove(); return out;
  }, { names: names.map((n) => [n, prop(n)]), kind, inverse: !!mode.inverse });
}

const tk = {}, density = {}, type = {};
for (const [m, mode] of Object.entries(TK_MODES)) {
  const c = await read(mode, COLOR, "color"), l = await read(mode, LENGTH_TK, "length");
  for (const [k, v] of Object.entries({ ...c, ...l })) (tk[k] ??= {})[m] = v;
}
for (const [m, mode] of Object.entries(DENSITY_MODES)) {
  const l = await read(mode, LENGTH_DENSITY, "length");
  for (const [k, v] of Object.entries(l)) (density[k] ??= {})[m] = v;
}
const t = await read({ pack: "wireframe" }, LENGTH_TYPE, "length");
for (const [k, v] of Object.entries(t)) type[k] = { base: v };
await b.close();

writeFileSync(resolve(ROOT, "figma/tokens.json"), JSON.stringify({ note: "Read from the page by tools/figma-tokens.mjs; applied to the Figma variables by a use_figma script. Do not hand-edit.", tk, "tk-density": density, "tk-type": type }, null, 1) + "\n");
console.log(`figma/tokens.json: ${Object.keys(tk).length} tk, ${Object.keys(density).length} tk-density, ${Object.keys(type).length} tk-type variables`);
