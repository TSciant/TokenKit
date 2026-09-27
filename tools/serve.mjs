#!/usr/bin/env node
/**
 * Static server for the kit. Zero dependencies.
 *
 * The port is derived from the project folder's name rather than picked, so
 * every kit checked out on the same machine lands somewhere different and two
 * of them never collide. The default range is 20000-29999, which sits clear of
 * every common dev-server port and below the ephemeral range.
 *
 * Before binding it refuses anything on RESERVED below, then probes upward
 * from the derived port until it finds one nothing is listening on.
 *
 *   npm run serve                 derive, probe, bind
 *   npm run serve -- --port 24100 pin it
 *   npm run serve -- --why        print the port it would use and exit
 *
 * Nothing here writes to the network beyond localhost.
 */

import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, dirname, normalize, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { derivePort, findPort, inUse, projectName, RESERVED } from "./port.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");


const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};




const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : null;
};

const name = projectName(ROOT);
const pinned = arg("--port") ? Number(arg("--port")) : null;

if (pinned && RESERVED.has(pinned)) {
  console.error(
    `Port ${pinned} is on the reserved list (${RESERVED.get(pinned)}). Pick another, or remove it from RESERVED in tools/serve.mjs if that is stale.`,
  );
  process.exit(1);
}

const derived = derivePort(name);

if (flag("--why")) {
  console.log(`project      ${name}`);
  console.log(`derived port ${derived}`);
  console.log(`in use       ${(await inUse(derived)) ? "yes" : "no"}`);
  console.log(`reserved     ${RESERVED.size} ports skipped`);
  process.exit(0);
}

const port = pinned ?? (await findPort(derived));

/* Whatever is built on top of the kit can add to this server without
   editing it: tools/serve-site.mjs, when present, may answer a request
   itself, hand back another path to serve, and list its own entries. */
const SITE_HOOK = resolve(__dirname, "serve-site.mjs");
const site = existsSync(SITE_HOOK) ? await import(pathToFileURL(SITE_HOOK).href) : null;

/** Only ever lists paths that exist right now. */
const ROUTES = [
  ["tests/fixture.html", "Contrast fixture — what the gate mounts and measures"],
  ["storybook-static/index.html", "Built Storybook — run npm run build-storybook first"],
  ["dist/tokenkit.css", "Bundled stylesheet — run npm run bundle first"],
  ...(site?.routes ?? []),
];

async function index() {
  const rows = await Promise.all(
    ROUTES.map(async ([path, note]) => {
      const here = await stat(resolve(ROOT, path)).then(() => true, () => false);
      return here
        ? `<li><a href="/${path}">${path}</a> <span>${note}</span></li>`
        : `<li class="missing"><span>${path}</span> <span>${note}</span></li>`;
    }),
  );
  return `<!doctype html><meta charset="utf-8">
<title>tokenkit — static</title>
<style>
  body{font:15px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;margin:0;padding:2rem;
       background:#f4f4f4;color:#1f1f1f}
  @media (prefers-color-scheme:dark){body{background:#0f0f0f;color:#fff}}
  h1{font-size:1.1rem;margin:0 0 .25rem}
  p{color:#636363;margin:0 0 1.5rem;max-width:60ch}
  @media (prefers-color-scheme:dark){p{color:#a8a8a8}}
  ul{list-style:none;padding:0;margin:0;display:grid;gap:.6rem;max-width:70ch}
  li{display:flex;flex-wrap:wrap;gap:.75rem;align-items:baseline}
  li span{color:#808080;font-size:.85em}
  li.missing a,li.missing>span:first-child{opacity:.45;text-decoration:line-through}
  a{color:inherit}
</style>
<h1>tokenkit — static files</h1>
<p>The component and token demo is Storybook: <code>npm run storybook</code>.
This server exists for the gate fixture and anything built into dist/.
Struck-through entries are not built yet.</p>
<ul>${rows.join("")}</ul>`;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);

    // The root lists what is actually on disk. A hand-written index goes
    // stale and sends people to 404s; this cannot.
    if (pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(await index());
      return;
    }

    if (site) {
      const answer = await site.route(pathname, req, res, ROOT);
      if (answer === true) return;
      if (typeof answer === "string") pathname = answer;
    }

    // Keep the server inside the project, whatever the request says.
    const target = resolve(ROOT, "." + normalize(pathname));
    if (!target.startsWith(ROOT + sep) && target !== ROOT) {
      res.writeHead(403).end("Outside the project root.");
      return;
    }

    const info = await stat(target).catch(() => null);
    if (!info || info.isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end(`Not found: ${pathname}\n\nOpen / for what is actually here.`);
      return;
    }

    const body = await readFile(target);
    res.writeHead(200, {
      "content-type": MIME[extname(target).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(String(err?.message || err));
  }
});

server.listen(port, "127.0.0.1", () => {
  const skipped = port !== derived && !pinned;
  console.log(`\n  tokenkit static  ·  http://localhost:${port}\n`);
  console.log(`  The component demo is Storybook, not this:  npm run storybook\n`);
  console.log(
    `  port derived from folder name "${name}"${skipped ? ` — ${derived} was busy, moved up` : ""}\n`,
  );
});

server.on("error", (err) => {
  console.error(`\nCould not bind ${port}: ${err.message}\n`);
  process.exit(1);
});
