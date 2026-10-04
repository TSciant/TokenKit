#!/usr/bin/env node
/**
 * Modes check — does the Figma file agree with the page under a pack or a density?
 *
 * Every component's own onion skin is drawn in the default mode. A pack changes
 * colour, corner and proportion, and a density changes the space ramp and the
 * control heights, and the Figma file claims to follow both through its variable
 * modes (tk has a mode per pack; tk-density has a mode per density and per
 * pack, because a brand sets its own density). That claim is only worth
 * anything if it is photographed.
 *
 * Two stories ("03 Foundations / 08 Modes": Mode sheet, Pattern sheet) draw six
 * primitives and then a masthead, a page hero and a footer in fixed slots. figma/modes/<mode>.png is the Figma sheet with that mode's
 * variables set on the frame. This opens the story under the matching Pack and
 * Density, compares the two, and records the result in figma/modes/checks.json.
 *
 *   node tools/modes-check.mjs [mode ...]      (Storybook must be running)
 *
 * Slots are scored separately so a number says which component moved. The sheet
 * mean is tolerance-searched over a one-pixel shift: a pack whose density is
 * fractional puts the story's own padding on a fractional pixel, and a
 * screenshot rounds it, which is the measurement and not the design.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { derivePort, projectName } from "./port.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = `http://localhost:${derivePort(projectName(ROOT), 1)}`;
/* Two sheets per mode: six primitives, and three patterns at 1024 wide
   (files figma/modes/<mode>.png and figma/modes/patterns-<mode>.png). */
const SHEETS = [
  { prefix: "", story: "03-foundations-08-modes--sheet", slots: null },
  { prefix: "patterns-", story: "03-foundations-08-modes--pattern-sheet", slots: { Masthead: [0, 0, 1024, 110], PageHero: [0, 120, 1024, 400], SiteFooter: [0, 520, 1024, 340] } },
];

/* mode file -> the toolbar globals that mean the same thing */
export const MODES = [
  ["wireframe", "wireframe", "default"],
  ["wireframe-dark", "wireframe-dark", "default"],
  ["tk", "tk", "default"],
  ["door-shop", "door-shop", "default"],
  ["mohave", "mohave", "default"],
  ["bathing-bagels", "bathing-bagels", "default"],
  ["wandas", "wandas", "default"],
  ["muncheese", "muncheese", "default"],
  ["density-compact", "wireframe", "compact"],
  ["density-comfortable", "wireframe", "comfortable"],
];
const PRIMITIVE_SLOTS = { Button: [24, 24, 120, 50], ButtonDanger: [160, 24, 120, 50], Chip: [24, 96, 120, 40], Card: [24, 160, 340, 260], Alert: [400, 24, 400, 110], Field: [400, 160, 340, 90], Meter: [400, 300, 260, 60] };

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
const q = await b.newPage();
await q.setContent("<body></body>");
const out = {};
for (const sheet of SHEETS) for (const [base, pack, density] of MODES) {
  const name = sheet.prefix + base;
  if (only.length && !only.includes(name) && !only.includes(base)) continue;
  const SLOTS = sheet.slots ?? PRIMITIVE_SLOTS, STORY = sheet.story;
  const file = resolve(ROOT, `figma/modes/${name}.png`);
  if (!existsSync(file)) { console.log(name.padEnd(20), "no sheet"); continue; }
  await p.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story&globals=pack:${pack};density:${density}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  const live = await p.locator("#storybook-root .sb-host > *").first().screenshot();
  const r = await q.evaluate(async ({ live, skin, slots }) => {
    const L = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = "data:image/png;base64," + s; });
    const [a, s] = await Promise.all([L(live), L(skin)]);
    const W = a.width, H = a.height;
    const px = (i) => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); x.drawImage(i, 0, 0); return x.getImageData(0, 0, W, H).data; };
    const A = px(a), S = px(s);
    const diff = (x0, y0, w, h, dx, dy) => { let sum = 0, n = 0; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const sx = x + dx, sy = y + dy; if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue; const i = (y * W + x) * 4, j = (sy * W + sx) * 4; sum += (Math.abs(A[i] - S[j]) + Math.abs(A[i + 1] - S[j + 1]) + Math.abs(A[i + 2] - S[j + 2])) / 3; n++; } return sum / n; };
    const best = (x0, y0, w, h) => { let m = Infinity; for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) m = Math.min(m, diff(x0, y0, w, h, dx, dy)); return +m.toFixed(2); };
    const res = { slots: {} };
    for (const [k, [x, y, w, h]] of Object.entries(slots)) res.slots[k] = best(x, y, w, h);
    res.mean = best(0, 0, W, H);
    return res;
  }, { live: live.toString("base64"), skin: readFileSync(file).toString("base64"), slots: SLOTS });
  out[name] = r;
  console.log(name.padEnd(20), String(r.mean).padEnd(6), JSON.stringify(r.slots));
}
await b.close();

const f = resolve(ROOT, "figma/modes/checks.json");
const prev = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : { modes: {} };
const at = new Date().toISOString();
for (const [k, v] of Object.entries(out)) prev.modes[k] = { mean: v.mean, worst: Math.max(...Object.values(v.slots)), slots: v.slots, checkedAt: at };
writeFileSync(f, JSON.stringify(prev, null, 2) + "\n");
