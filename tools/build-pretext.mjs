#!/usr/bin/env node
/**
 * Bundle Pretext into a classic script for the type gate.
 *
 * Pretext measures text with a canvas, so it only runs in a browser — never in
 * plain Node. Storybook imports it directly and Vite resolves it, but the gate
 * loads a fixture over file://, where bare specifiers do not resolve and ESM is
 * blocked by CORS. So the gate gets a prebuilt IIFE on `window.Pretext`.
 *
 * This runs once and its output is committed, so `npm run type-gate` does not
 * need a build step in front of it.
 *
 * Pretext is MIT, which asks that its copyright and licence go with every
 * copy. A minified bundle drops them, so the bundle opens with a banner and
 * the licence file is copied beside it (tests/vendor/pretext.LICENSE).
 *
 *   node tools/build-pretext.mjs
 */

import { build } from "esbuild";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stat, readFile, copyFile } from "node:fs/promises";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(ROOT, "tests/vendor/pretext.js");
const PKG = resolve(ROOT, "node_modules/@chenglou/pretext");
const { version, license } = JSON.parse(await readFile(resolve(PKG, "package.json"), "utf8"));
const copyright = (await readFile(resolve(PKG, "LICENSE"), "utf8")).match(/^Copyright.*$/m)?.[0] ?? "Copyright Pretext contributors";

await build({
  entryPoints: [resolve(ROOT, "tools/pretext-entry.mjs")],
  bundle: true,
  format: "iife",
  globalName: "Pretext",
  target: ["chrome120"],
  outfile: out,
  minify: true,
  legalComments: "inline",
  banner: { js: `/*! Pretext ${version} (https://github.com/chenglou/pretext) | ${license} License | ${copyright} | full text: pretext.LICENSE */` },
});
await copyFile(resolve(PKG, "LICENSE"), resolve(ROOT, "tests/vendor/pretext.LICENSE"));

const { size } = await stat(out);
console.error(
  `Bundled Pretext -> tests/vendor/pretext.js (${(size / 1024).toFixed(1)} KB)`,
);
console.error(
  "Measurement only — this never ships with the kit's CSS or components.",
);
