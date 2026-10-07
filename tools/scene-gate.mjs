#!/usr/bin/env node
/**
 * Scene gate: the example scenes are clean, and between them they use every
 * kind.
 *
 * The vocabulary is generated from the components, so when a component
 * changes, the examples are the first thing that can fall out of step: a
 * prop renamed, a value removed. The sanitizer would quietly leave the stale
 * part out and the story would still render, so this runs it on every
 * example and fails on any note at all. And every kind has to appear in one,
 * so the browser gates (a11y, reflow, forced colours) draw every kind.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const { sanitize, walk, KINDS } = await load("src/scene/scene.mjs");
const { EXAMPLES } = await load("src/scene/examples.mjs");

let failed = false;
const used = new Set();
for (const example of EXAMPLES) {
  const { scene, notes } = sanitize(example);
  walk(scene.root, (n) => used.add(n.kind));
  if (notes.length) {
    failed = true;
    console.error(`✗ ${example.title}:\n` + notes.map((n) => `    ${n}`).join("\n"));
  } else {
    console.log(`✓ ${example.title}`);
  }
}
const unused = Object.keys(KINDS).filter((k) => !used.has(k));
if (unused.length) {
  failed = true;
  console.error(`\nKinds no example uses: ${unused.join(", ")} — add them to src/scene/examples.mjs`);
}
if (failed) process.exit(1);
console.log(`\n${EXAMPLES.length} example scenes clean; all ${Object.keys(KINDS).length} kinds drawn.`);
