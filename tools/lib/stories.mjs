/**
 * One browser pass over the built Storybook, shared by every gate that has to
 * look at rendered stories: a11y, attributes, radius, controls, properties.
 *
 * Each of those gates used to carry its own static server, its own Chromium
 * launch and its own loop over index.json, and four of them walked all ~180
 * stories separately. The checks themselves are unchanged and still live in
 * their own files; only the plumbing is here, so a story is opened once per
 * viewport and every check that wants it reads the same settled page.
 *
 *   node tools/browser-gates.mjs         every check, one pass
 *   node tools/a11y-gate.mjs             one check, same runner
 *
 * A check is an object:
 *
 *   viewports    which passes it wants — "desktop", "phone"
 *   stories      optional filter over index.json entries
 *   visit        (page, story, viewport) — called on each settled story
 *   unrendered   optional (story, viewport) — the story never rendered
 *   once         optional (page) — called a single time, on the first story
 *   report       () → true when the check passed; prints its own findings
 */

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const BUILD = resolve(ROOT, "storybook-static");

/* The phone width is Lighthouse's own mobile emulation, so a failure found by
   one tool is reproducible in the other. See tools/a11y-gate.mjs for why the
   second viewport exists at all. */
export const VIEWPORTS = {
  desktop: { name: "desktop", width: 1440, height: 1000 },
  phone: { name: "phone", width: 412, height: 823 },
};

/** True when the calling module is the script node was started with. */
export const isMain = (metaUrl) =>
  Boolean(process.argv[1]) && metaUrl === pathToFileURL(process.argv[1]).href;

export function readIndex() {
  if (!existsSync(join(BUILD, "index.json"))) {
    console.error("No storybook-static/index.json — run `npm run build-storybook` first.");
    process.exit(2);
  }
  return JSON.parse(readFileSync(join(BUILD, "index.json"), "utf8"));
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff",
  ".ttf": "font/ttf", ".map": "application/json",
};

async function serve() {
  const server = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    const f = join(BUILD, normalize(p));
    if (!existsSync(f) || !statSync(f).isFile()) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "content-type": TYPES[extname(f)] ?? "application/octet-stream" });
    res.end(readFileSync(f));
  });
  await new Promise((r) => server.listen(0, r));
  return { base: `http://localhost:${server.address().port}`, close: () => server.close() };
}

/* Open a story and wait until it is a page someone would read, not a frame of
   one. Every wait here came from a gate that reported a false failure without
   it; the reasons are kept with each step. */
async function open(page, base, story) {
  await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`, {
    /* domcontentloaded, not networkidle. Any story with a live network
       connection — the Map keeps retrying tile fetches — never goes idle, and
       waiting for it hangs the whole run on one component. */
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  try {
    await page.waitForSelector("#storybook-root > *", { timeout: 15000 });
  } catch {
    return false;
  }
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  /* Let every running animation finish, whatever drove it — the CSS stagger,
     the FX reveal, a transition. An element mid-fade sits at a real opacity
     between 0 and 1, and axe reports that frame as a contrast failure. */
  await page
    .evaluate(() =>
      Promise.race([
        Promise.allSettled(document.getAnimations().map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 4000)),
      ]),
    )
    .catch(() => {});
  await page.waitForTimeout(300);
  /* Rules keyed on data-fx-reveal are written `[data-fx-ready] [...]`, so a
     story that uses the FX layer is only fully styled once the script has
     marked the document. Stories without it skip the wait entirely. */
  if (await page.$("[data-fx-reveal]")) {
    await page.waitForSelector("html[data-fx-ready]", { timeout: 500 }).catch(() => {});
  }
  return true;
}

/** Run the checks in one pass. Resolves true when every check passed. */
export async function runChecks(checks) {
  const entries = Object.values(readIndex().entries);
  const { base, close } = await serve();
  const executablePath = process.env.TOKENKIT_CHROMIUM || undefined;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});

  try {
    for (const vp of Object.values(VIEWPORTS)) {
      const here = checks.filter((c) => c.visit && c.viewports?.includes(vp.name));
      if (!here.length) continue;
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      for (const story of entries) {
        const takers = here.filter((c) => !c.stories || c.stories(story));
        if (!takers.length) continue;
        if (!(await open(page, base, story))) {
          for (const c of takers) c.unrendered?.(story, vp);
          continue;
        }
        for (const c of takers) await c.visit(page, story, vp);
      }
      await page.close();
    }

    const onceChecks = checks.filter((c) => c.once);
    if (onceChecks.length) {
      const page = await browser.newPage();
      await page.goto(`${base}/iframe.html?id=${entries[0].id}&viewMode=story`, {
        waitUntil: "networkidle",
      });
      for (const c of onceChecks) await c.once(page);
      await page.close();
    }
  } finally {
    await browser.close();
    close();
  }

  let pass = true;
  for (const c of checks) pass = (await c.report()) && pass;
  return pass;
}
