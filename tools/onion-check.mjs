#!/usr/bin/env node
/**
 * Onion check — for every Figma skin, render the matching story and compare.
 *
 *   npm run storybook                      (in one terminal)
 *   node tools/onion-check.mjs             every component in figma/onion.json
 *   node tools/onion-check.mjs Button Chip only those
 *   node tools/onion-check.mjs --url http://localhost:24236
 *
 * For each skin it opens the component's Onion story with the args that skin's
 * file name encodes, screenshots the component at 1x, lays the skin over it and
 * reports two numbers: the size difference, and the mean per-channel difference
 * over the box (0 to 255, text antialiasing included, so a text-heavy component
 * never reaches 0: Chromium draws coloured subpixel fringes, Figma greyscale).
 *
 * It does not pass or fail anything on its own. The verdict, in
 * figma/verdicts/, is a person naming the drift; this finds where to look.
 */
import { chromium } from "playwright";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { derivePort, projectName } from "./port.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const ui = argv.indexOf("--url");
const BASE = ui > -1 ? argv[ui + 1] : `http://localhost:${derivePort(projectName(ROOT), 1)}`;
const only = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--url");
const map = JSON.parse(readFileSync(resolve(ROOT, "figma/onion.json"), "utf8")).components;

const parse = (v) => (v === "true" ? true : v === "false" ? false : /^\d+$/.test(v) ? Number(v) : /^\d+x\d+$/.test(v) ? v.replace("x", "/") : v);
const enc = (v) => (typeof v === "boolean" ? `!${v}` : String(v).replace(/[^A-Za-z0-9 _-]/g, (c) => (c === "/" ? "_" : "")));

const cases = [];
for (const [name, def] of Object.entries(map)) {
  if (only.length && !only.includes(name)) continue;
  const dir = resolve(ROOT, `figma/skins/${def.skinsFrom ?? name}`);
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".png"))) {
    const parts = f.slice(0, -4).split("-");
    const args = {};
    let skip = false;
    let viewport = def.viewport ?? 1000;
    def.pattern.forEach((axis, i) => {
      const val = parts[i];
      /* For a pattern the container is the box the viewport gives it, so that axis
         sets the viewport instead of an arg. */
      if (axis === "container" && def.containerFrom === "viewport") { viewport = def.containers[val]; return; }
      if (axis === "state") {
        const st = def.states?.[val];
        if (!st) skip = true; else Object.assign(args, st);
      } else args[axis] = parse(val);
    });
    if (!skip) cases.push({ name, story: def.story, file: f, args, viewport, target: def.target, settle: def.settle ?? 0, still: !!def.still, skin: readFileSync(resolve(dir, f)).toString("base64") });
  }
}

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
const cmp = await b.newPage();
await cmp.setContent("<body></body>");
const rows = [];
for (const c of cases) {
  /* A pattern answers to the width of its box, so the viewport is part of the case:
     the skin was drawn at a section width and is only comparable at it. */
  await page.setViewportSize({ width: c.viewport, height: 900 });
  /* Storybook's URL args allow letters, digits, space, _ and -. A value like 16/9
     is set over its channel once the story is up. */
  const late = Object.fromEntries(Object.entries(c.args).filter(([, v]) => typeof v === "string" && /[^A-Za-z0-9 _-]/.test(v)));
  const q = Object.entries(c.args).filter(([k]) => !(k in late)).map(([k, v]) => `${k}:${enc(v)}`).join(";");
  await page.goto(`${BASE}/iframe.html?id=${c.story}&viewMode=story${q ? `&args=${q}` : ""}`, { waitUntil: "networkidle" });
  if (Object.keys(late).length) {
    await page.evaluate(({ id, updatedArgs }) => window.__STORYBOOK_ADDONS_CHANNEL__.emit("updateStoryArgs", { storyId: id, updatedArgs }), { id: c.story, updatedArgs: late });
    await page.waitForTimeout(400);
  }
  /* A modal photographed with its backdrop would compare a dimmed, blurred page
     with a skin drawn on white; the panel is the component. */
  await page.addStyleTag({ content: "dialog::backdrop{background:transparent!important;backdrop-filter:none!important}" });
  /* Most components carry a data-tk on their root. A pattern whose root is a plain
     element says `target: "root"` in onion.json and is measured as the story's first child. */
  const root = page.locator(c.target === "root" ? "#storybook-root .sb-host > *" : "#storybook-root [data-tk]").first();
  try { await root.waitFor({ timeout: 8000 }); } catch { rows.push({ ...c, err: "no [data-tk] rendered" }); continue; }
  await page.evaluate(() => document.fonts.ready);
  /* A component whose plate drifts with the scroll (motion FX) is photographed still: `still: true`. */
  await page.emulateMedia({ reducedMotion: c.still ? "reduce" : "no-preference" });
  if (c.still) await page.waitForTimeout(400);
  /* Some components animate in (the hero copy and its plate): wait out the entrance. */
  if (c.settle) await page.waitForTimeout(c.settle);
  const r = await root.boundingBox();
  /* The design was drawn on the surface-default ground, and Figma bakes a
     transparent button onto it. The story's page is surface-base, so the live
     component is put on the same ground before it is photographed. */
  const ground = await page.evaluate(() => {
    const g = getComputedStyle(document.documentElement).getPropertyValue("--tk-surface-default").trim() || "#fff";
    for (const el of [document.documentElement, document.body, document.querySelector("#storybook-root"), ...document.querySelectorAll(".sb-host")]) if (el) el.style.background = g;
    return g;
  });
  /* An inline element (an icon in a line box) can sit at a fractional offset, and
     a screenshot rounds it: the picture is the component half a pixel away from
     where the layout put it. Translate it onto the pixel grid; layout is untouched. */
  await root.evaluate((e) => { const r = e.getBoundingClientRect(); e.style.translate = `${-(r.x - Math.floor(r.x))}px ${-(r.y - Math.floor(r.y))}px`; });
  const live = await root.screenshot();
  const res = await cmp.evaluate(async ({ live, skin, ground }) => {
    const load = (s) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = "data:image/png;base64," + s; });
    const [a, s] = await Promise.all([load(live), load(skin)]);
    const W = Math.max(a.width, s.width), H = Math.max(a.height, s.height);
    const px = (img) => { const k = document.createElement("canvas"); k.width = W; k.height = H; const x = k.getContext("2d"); x.fillStyle = ground; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, H).data; };
    const A = px(a), S = px(s);
    /* Mean difference at every whole-pixel shift of the skin from -1 to +1. The
       shift that scores lowest says whether a large number is a different
       shape (it stays large) or one edge landing a pixel away (it collapses). */
    const at = (dx, dy) => { let sum = 0, n = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = x - dx, sy = y - dy; if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue; const i = (y * W + x) * 4, j = (sy * W + sx) * 4; sum += (Math.abs(A[i] - S[j]) + Math.abs(A[i + 1] - S[j + 1]) + Math.abs(A[i + 2] - S[j + 2])) / 3; n++; } return sum / n; };
    const mean = at(0, 0); let best = { d: mean, dx: 0, dy: 0 };
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const d = at(dx, dy); if (d < best.d) best = { d, dx, dy }; }
    return { live: [a.width, a.height], skin: [s.width, s.height], mean, best };
  }, { live: live.toString("base64"), skin: c.skin, ground });
  rows.push({ ...c, ...res, box: [r.width, r.height] });
}
await b.close();

const pad = (s, n) => String(s).padEnd(n);
console.log(pad("component / skin", 44), pad("skin", 10), pad("live box", 14), pad("Δ size", 12), "mean diff");
for (const r of rows) {
  if (r.err) { console.log(pad(`${r.name} / ${r.file}`, 44), r.err); continue; }
  const dw = (r.box[0] - r.skin[0]).toFixed(1), dh = (r.box[1] - r.skin[1]).toFixed(1);
  console.log(pad(`${r.name} / ${r.file.slice(0, -4)}`, 44), pad(r.skin.join("×"), 10), pad(r.box.map((n) => n.toFixed(1)).join("×"), 14), pad(`${dw}, ${dh}`, 12), pad(r.mean.toFixed(2), 10), r.best.dx || r.best.dy ? `${r.best.d.toFixed(2)} at (${r.best.dx},${r.best.dy})` : "0,0");
}
/* Not under dist/: that folder is what the deploy uploads. */
mkdirSync(resolve(ROOT, "node_modules/.cache/tokenkit"), { recursive: true });
writeFileSync(resolve(ROOT, "node_modules/.cache/tokenkit/onion-check.json"), JSON.stringify(rows.map(({ skin, ...r }) => r), null, 1));

/* The Design tab in Storybook shows the last result per component. It is a
   snapshot committed beside the skins (figma/meta.json says when the code moved
   on), merged so that checking one component does not forget the others. */
const checksPath = resolve(ROOT, "figma/checks.json");
let prior = {};
try { prior = JSON.parse(readFileSync(checksPath, "utf8")).components ?? {}; } catch { /* first run */ }
const byName = {};
for (const r of rows) {
  if (r.err) continue;
  const c = (byName[r.name] ??= { skins: 0, worst: 0, sum: 0 });
  c.skins++; c.sum += r.mean; c.worst = Math.max(c.worst, r.mean);
}
const now = new Date().toISOString();
for (const [name, c] of Object.entries(byName)) prior[name] = { skins: c.skins, mean: +(c.sum / c.skins).toFixed(2), worst: +c.worst.toFixed(2), checkedAt: now };
writeFileSync(checksPath, JSON.stringify({ components: Object.fromEntries(Object.entries(prior).sort(([a], [b]) => a.localeCompare(b))) }, null, 2) + "\n");
