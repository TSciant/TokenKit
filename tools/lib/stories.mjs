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
 *   init         optional function — run in each page before any story script
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
        /* Not the loops: one that never ends never settles, and waiting on it cost every story with a
           spinner the whole four seconds, twice. They are decor or data, and tools/motion-gate.mjs reads them. */
        Promise.allSettled(
          document.getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
            .map((a) => a.finished),
        ),
        new Promise((r) => setTimeout(r, 4000)),
      ]),
    )
    .catch(() => {});
  /* Two frames for the last style and layout to land, then a short beat for effects that start on the
     first frame. This was a flat 300 ms: five of the thirteen minutes, with ~1,080 opens. */
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
  await page.waitForTimeout(60);
  /* Rules keyed on data-fx-reveal are written `[data-fx-ready] [...]`, so a
     story that uses the FX layer is only fully styled once the script has
     marked the document. Stories without it skip the wait entirely. */
  if (await page.$("[data-fx-reveal]")) {
    await page.waitForSelector("html[data-fx-ready]", { timeout: 500 }).catch(() => {});
  }
  return true;
}

/* How many pages walk the stories at once. Each is its own renderer, so the
   pass is about this many times faster until memory runs short; on a small
   machine set TK_GATE_PAGES=1 to walk them one at a time as before. */
const PAGES = Math.max(1, Number(process.env.TK_GATE_PAGES) || 3);

/**
 * Run the checks in one pass. Resolves true when every check passed.
 * `only`, when given, is a set of story ids to visit instead of all of them
 * (the fast tier: the stories a change can reach).
 */
export async function runChecks(checks, { only } = {}) {
  const entries = Object.values(readIndex().entries).filter((e) => !only || only.has(e.id));
  const { base, close } = await serve();
  const executablePath = process.env.TOKENKIT_CHROMIUM || undefined;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});

  /* A page with every check's init script installed, so it is there from the first line of each story. */
  const newPage = async (options) => {
    const page = await browser.newPage(options);
    for (const c of checks) if (c.init) await page.addInitScript(c.init);
    return page;
  };

  /* Stories that crashed the page or timed out twice: reported, and the run fails, but the other stories are still checked. */
  const broken = [];

  try {
    for (const vp of Object.values(VIEWPORTS)) {
      const here = checks.filter((c) => c.visit && c.viewports?.includes(vp.name));
      if (!here.length) continue;
      const viewport = { width: vp.width, height: vp.height };
      /* One queue, several pages taking from it. The checks keep their findings in closures and every
         change a check makes to a page (emulation, a pause, focus) is on that page and put back, so they
         need no change to share the work. */
      const queue = entries
        .map((story) => ({ story, takers: here.filter((c) => !c.stories || c.stories(story)) }))
        .filter((q) => q.takers.length);
      const worker = async () => {
        let page = await newPage({ viewport });
        let opened = 0;
        for (let job = queue.shift(); job; job = queue.shift()) {
          const { story, takers } = job;
          /* One renderer grows over hundreds of navigations and, past eight hundred or so stories, crashes:
             a fresh page every 150 keeps the run inside it. */
          if (++opened % 150 === 0) {
            await page.close();
            page = await newPage({ viewport });
          }
          /* A crashed renderer or a timeout used to end the whole pass, so no gate reported anything. Now it
             costs one story: a fresh page, one more try, and if that fails too it is named at the end. */
          for (let attempt = 1; ; attempt++) {
            try {
              if (!(await open(page, base, story))) {
                for (const c of takers) c.unrendered?.(story, vp);
              } else {
                for (const c of takers) await c.visit(page, story, vp);
              }
              break;
            } catch (err) {
              await page.close().catch(() => {});
              page = await newPage({ viewport });
              if (attempt === 2) {
                broken.push(`${story.id} (${vp.name}): ${String(err?.message ?? err).split("\n")[0]}`);
                break;
              }
            }
          }
        }
        await page.close();
      };
      await Promise.all(Array.from({ length: Math.min(PAGES, queue.length) }, worker));
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
  if (broken.length) {
    console.log(`\nNot checked:${broken.length} stor${broken.length === 1 ? "y" : "ies"} crashed the page or timed out twice:`);
    for (const b of broken) console.log(`  BROKE  ${b}`);
    pass = false;
  }
  return pass;
}
