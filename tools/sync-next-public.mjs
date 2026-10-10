#!/usr/bin/env node
/**
 * Populate next/public from the things that are not the Next app's to own.
 *
 * Next serves whatever is in public/. Rather than keep a second copy of these
 * files in source control and watch the two drift, this copies them at build
 * time from the one place each actually lives.
 *
 *   node tools/sync-next-public.mjs
 *
 * next/public is generated. Nothing should be edited there.
 */

import { cp, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = resolve(ROOT, "next/public");

await mkdir(PUBLIC, { recursive: true });

/* Photography, served at /stock/*.jpg and read by Plate's STOCK_BY_SEED map.

   The boilerplate ships none: photography is licensed per engagement and is
   the client's, so it lives under the client boundary. Drop files in
   src/client/stock/, add the filenames to STOCK_BY_SEED in
   src/react/primitives/Plate.tsx, and this picks them up. With the directory
   absent — the state this repository is in — Plate draws its own synthetic
   plate and nothing here has to change.

   They are re-encoded on the way in, at the same filenames. Typical stock is
   a 1600×1600 full-colour JPEG of a few hundred KB, and every one is rendered
   through `filter: grayscale(1)` at no more than a few hundred CSS pixels — so
   the page downloads three quarters of a megabyte of colour information that
   the stylesheet then throws away. On Lighthouse's Slow 4G that was the whole
   story of the score: first paint at 1.2s and Largest Contentful Paint at
   3.9–5.3s, the gap being one photograph arriving.

   Greyscaling and resizing here rather than asking the CSS to do it is not a
   trick — it is doing the work once, at build time, instead of on every
   visitor's connection. The originals are untouched; this only writes into
   next/public, which is generated. */
const stockSrc = resolve(ROOT, "src/client/stock");
const MAX_EDGE = 720;
const QUALITY = 70;

if (existsSync(stockSrc)) {
  const { default: sharp } = await import("sharp");
  await mkdir(join(PUBLIC, "stock"), { recursive: true });
  let before = 0;
  let after = 0;
  let count = 0;

  for (const name of await readdir(stockSrc)) {
    const from = join(stockSrc, name);
    const to = join(PUBLIC, "stock", name);
    if (!/\.(jpe?g|png)$/i.test(name)) {
      await cp(from, to);
      continue;
    }
    before += (await stat(from)).size;
    await sharp(from)
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .grayscale()
      .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
      .toFile(to);
    after += (await stat(to)).size;
    count += 1;
  }
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(
    `  stock/            ${count} image(s), ${kb(before)} → ${kb(after)} (grayscale, ${MAX_EDGE}px, q${QUALITY})`,
  );
} else {
  console.log("  stock/            none — src/client/stock is empty or absent");
}

/* maplibre's worker. It resolves its own from import.meta.url, which inside a
   bundled chunk is not an http(s) URL, so it has to be a real served file.
   src/react/primitives/Map.tsx expects it at this path. */
const workerSrc = require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs");
await cp(workerSrc, join(PUBLIC, "maplibre-gl-worker.mjs"));
console.log("  maplibre-gl-worker.mjs");
/* The worker imports the shared chunk from beside itself. */
await cp(require.resolve("maplibre-gl/dist/maplibre-gl-shared.mjs"), join(PUBLIC, "maplibre-gl-shared.mjs"));
console.log("  maplibre-gl-shared.mjs");

/* A permissive robots.txt, deliberately.
 
   A wireframe prototype has no business in a search index, and the first
   version of this file said Disallow: / — which is correct for a deployment
   and wrong for a deliverable. Where the brief asks for Lighthouse 95+ in all
   categories, "Page is blocked from indexing" is a hard SEO failure: it capped
   every route at 63. A page cannot both demonstrate the score and refuse to be
   measured for it.
 
   So indexing is not refused in the artifact. It is refused at the door: the
   host that serves this prototype should send `X-Robots-Tag: noindex` (any
   static host, CDN or reverse proxy can add a response header), which keeps it
   out of search without changing what is delivered. */
await writeFile(
  join(PUBLIC, "robots.txt"),
  [
    "# The prototype itself is indexable so that its Lighthouse SEO score",
    "# reflects the pages. Keep it out of search with an X-Robots-Tag: noindex",
    "# response header at the host, not in the artifact.",
    "User-agent: *",
    "Allow: /",
    "",
  ].join("\n"),
  "utf8",
);
console.log("  robots.txt");

console.log(`\nnext/public synced from ${ROOT}\n`);
