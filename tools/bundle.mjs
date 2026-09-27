#!/usr/bin/env node
/**
 * Bundle — resolve the @import chain into one stylesheet.
 *
 * The kit is authored as separate files and runs that way with no build. In
 * production an @import chain is a request waterfall, so this flattens it.
 *
 * The only ordering constraint is that 00-layers.css lands first: @layer's
 * ordering statement has to be seen before any layer is populated. Everything
 * after that is order-independent, because the layer decides who wins.
 *
 * Relative url()s — the font files — are copied next to the output under
 * assets/ and rewritten to point there, so the bundle works wherever it is
 * served from. Left as written, a url() resolves against the bundle's folder,
 * not the source file's, and every font 404s.
 *
 *   node tools/bundle.mjs                                -> dist/tokenkit.css
 *   node tools/bundle.mjs --entry src/css/specimens.css --out dist/x.css
 *   node tools/bundle.mjs --stdout
 *
 * Also a module: a page build can import bundle() to inline a subset of the
 * kit into its pages without a round trip through dist/.
 */

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, basename, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const IMPORT = /@import\s+url\(\s*["']?([^"')]+)["']?\s*\)\s*;/g;
const URL = /url\(\s*(["']?)([^"')]+)\1\s*\)/g;

/**
 * Flatten `entry` into one stylesheet.
 * @returns {{ css: string, files: number, assets: Map<string, string> }}
 *          assets maps each copied source file to its path beside the bundle.
 */
export async function bundle(entry) {
  const seen = new Set();
  const assets = new Map();

  /* Point a local url() at a copy under assets/. data:, absolute and fragment
     references are left alone, and so is anything that is not a real file —
     a url() in a comment is prose, not a dependency. */
  const rewriteUrls = (css, base) =>
    css.replace(URL, (whole, _quote, ref) => {
      if (/^(data:|https?:|\/|#)/i.test(ref)) return whole;
      const abs = resolve(base, ref);
      if (!existsSync(abs)) return whole;
      const published = `assets/${basename(abs)}`;
      assets.set(abs, published);
      return `url("${published}")`;
    });

  async function inline(file) {
    const abs = resolve(file);
    if (seen.has(abs)) return "";
    seen.add(abs);

    const src = await readFile(abs, "utf8");
    const base = dirname(abs);
    const parts = [];
    let last = 0;

    for (const m of src.matchAll(IMPORT)) {
      parts.push(rewriteUrls(src.slice(last, m.index), base));
      parts.push(await inline(resolve(base, m[1])));
      last = m.index + m[0].length;
    }
    parts.push(rewriteUrls(src.slice(last), base));

    return parts.join("");
  }

  const css = (await inline(resolve(ROOT, entry)))
    // Collapse the runs of blank lines left where imports were removed.
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { css, files: seen.size, assets };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => {
    const i = argv.indexOf(name);
    return i > -1 ? argv[i + 1] : fallback;
  };
  const outPath = resolve(ROOT, arg("--out", "dist/tokenkit.css"));
  const { css, files, assets } = await bundle(arg("--entry", "src/css/index.css"));
  const out = `/* tokenkit — bundled ${new Date().toISOString().slice(0, 10)} · ${files} source files */\n${css}\n`;

  if (argv.includes("--stdout")) {
    process.stdout.write(out);
  } else {
    const outDir = dirname(outPath);
    await mkdir(outDir, { recursive: true });
    await writeFile(outPath, out);
    if (assets.size) await mkdir(resolve(outDir, "assets"), { recursive: true });
    for (const [from, to] of assets) await copyFile(from, resolve(outDir, to));
    console.error(
      `Bundled ${files} files -> ${relative(ROOT, outPath)} (${(out.length / 1024).toFixed(1)} KB` +
        `${assets.size ? `, ${assets.size} assets` : ""})`,
    );
  }
}
