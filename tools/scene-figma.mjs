#!/usr/bin/env node
/**
 * Scene -> Figma: print the script that draws a scene in Figma from the kit's
 * own components and variables.
 *
 *   node tools/scene-figma.mjs 0              the first example scene, 480px wide
 *   node tools/scene-figma.mjs 1 --width 1024
 *   node tools/scene-figma.mjs my-scene.json --width 640
 *
 * The scene is sanitized first, with the same sanitizer every renderer uses,
 * and the script (tools/scene-figma.plugin.js with the scene, the component
 * ids from figma/keys.json and the vocabulary filled in) runs through
 * use_figma or a plugin. It makes a frame "Scene/<title>" on the Scenes page;
 * the onion check then lays it over the same scene drawn by <Scene>, so
 * "draw it in Figma" is a function of the scene rather than a manual step.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const { sanitize, KINDS } = await load("src/scene/scene.mjs");
const { EXAMPLES } = await load("src/scene/examples.mjs");

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : dflt;
};
/* The first argument that is not a flag's value: an example's index or a JSON file. */
const which = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"))[0] ?? "0";
const input = /^\d+$/.test(which) ? EXAMPLES[Number(which)] : JSON.parse(readFileSync(resolve(which), "utf8"));
if (!input) throw new Error(`No example ${which}`);

const { scene, notes } = sanitize(input);
if (notes.length) console.error(`Notes:\n  ${notes.join("\n  ")}`);

const keys = JSON.parse(readFileSync(resolve(ROOT, "figma/keys.json"), "utf8")).components;
const IDS = Object.fromEntries(["Button", "Chip", "Eyebrow", "Card", "Alert", "Field", "Icon", "Plate", "ChoiceCard"].map((k) => [k, keys[k]]));
const names = Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, { name: v.name }]));

const code = readFileSync(resolve(ROOT, "tools/scene-figma.plugin.js"), "utf8")
  .replace("__SCENE__", JSON.stringify(scene))
  .replace("__OPTS__", JSON.stringify({ width: flag("width", 480), x: flag("x", 0), y: flag("y", 0) }))
  .replace("__IDS__", JSON.stringify(IDS))
  .replace("__KINDS__", JSON.stringify(names));
process.stdout.write(code);
