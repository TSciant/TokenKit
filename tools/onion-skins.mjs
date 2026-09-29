#!/usr/bin/env node
/**
 * Onion skins — slice a Figma export of one component set into one PNG per
 * variant, at native size.
 *
 * A skin is what Figma says the component looks like: the design's execution,
 * as a raster. Storybook lays it over the live component so anyone can check
 * the code against the design with their own eyes. The skins are 1x on purpose
 * — the claim is that a CSS pixel and a design pixel coincide, and a 1x image
 * is the only honest witness to that.
 *
 *   node tools/onion-skins.mjs Button        figma/sheets/Button.{png,json} -> figma/skins/Button/*.png
 *
 * The sheet is the set exported whole (get_screenshot on the component set);
 * the json is each variant's x, y, w, h inside it, read from the file. File
 * names are the variant values joined in order: solid-md-default.png. A slash in a
 * value (an aspect ratio) becomes x: 16/9 -> 16x9.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];
if (!name) { console.error("usage: onion-skins.mjs <Component>"); process.exit(1); }
const sheet = JSON.parse(readFileSync(resolve(ROOT, `figma/sheets/${name}.json`), "utf8"));
const png = "data:image/png;base64," + readFileSync(resolve(ROOT, `figma/sheets/${name}.png`)).toString("base64");
const outDir = resolve(ROOT, `figma/skins/${name}`);
mkdirSync(outDir, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage();
await p.setContent("<body></body>");
const slices = await p.evaluate(async ({ png, variants }) => {
  const img = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = png; });
  return variants.map((v) => {
    const c = document.createElement("canvas"); c.width = v.w; c.height = v.h;
    c.getContext("2d").drawImage(img, v.x, v.y, v.w, v.h, 0, 0, v.w, v.h);
    return { name: v.name, data: c.toDataURL("image/png").split(",")[1], w: v.w, h: v.h };
  });
}, { png, variants: sheet.variants });
await b.close();

const index = {};
for (const s of slices) {
  const file = s.name.split(",").map((kv) => kv.split("=")[1].trim().toLowerCase().replace(/\//g, "x")).join("-") + ".png";
  writeFileSync(resolve(outDir, file), Buffer.from(s.data, "base64"));
  index[file] = { w: s.w, h: s.h };
}
writeFileSync(resolve(outDir, "index.json"), JSON.stringify({ component: name, node: sheet.node, skins: index }, null, 1));
console.log(`${name}: ${slices.length} skins -> figma/skins/${name}/`);
