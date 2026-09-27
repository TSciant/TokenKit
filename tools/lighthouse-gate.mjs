#!/usr/bin/env node
/**
 * Lighthouse gate — the contract number, measured.
 *
 *   "Delivered page compositions must achieve Lighthouse scores of 95+ in all
 *    categories (rendered as page compositions through direct NextJS)."
 *
 * So: a production `next build`, served by `next start`, measured by Lighthouse
 * against a real Chrome. Not a dev server, which ships unminified modules and
 * a HMR client; not Storybook, which is an iframe inside an application. Both
 * would report a number that no delivered page would reproduce.
 *
 *   npm run next:build && npm run lighthouse
 *   npm run lighthouse -- --url /contact      one route
 *   npm run lighthouse -- --json report.json  keep the raw audits
 *
 * Exit 1 if any category on any route is below the threshold.
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THRESHOLD = 95;
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

const argv = process.argv.slice(2);
const only = argv.includes("--url") ? argv[argv.indexOf("--url") + 1] : null;
const jsonOut = argv.includes("--json") ? argv[argv.indexOf("--json") + 1] : null;

const ROUTES = only
  ? [only]
  : ["/", "/services", "/case-studies", "/team", "/contact"];

const PORT = 4321;
const BASE = `http://127.0.0.1:${PORT}`;

/* --- serve the production build ------------------------------------------ */
const server = spawn(
  process.execPath,
  [resolve(ROOT, "node_modules/next/dist/bin/next"), "start", "next", "-p", String(PORT)],
  { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
);
server.stderr.on("data", (d) => process.stderr.write(`[next] ${d}`));

const stop = () => {
  try {
    server.kill("SIGTERM");
  } catch {
    /* already gone */
  }
};
process.on("exit", stop);
process.on("SIGINT", () => {
  stop();
  process.exit(130);
});

async function waitForServer(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE, { method: "HEAD" });
      if (res.ok || res.status === 405) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`next start did not answer on ${BASE} within ${timeoutMs}ms`);
}

await waitForServer();

/* --- drive Lighthouse through Playwright's Chrome ------------------------- */
/* Lighthouse wants a browser with a remote debugging port. Playwright's
   chromium is the one already installed for the other gates, so the gates all
   measure in the same engine rather than three different ones. */
const browser = await chromium.launch({
  executablePath: process.env.TOKENKIT_CHROMIUM || undefined,
  args: ["--remote-debugging-port=9222"],
});

const results = [];
try {
  for (const route of ROUTES) {
    const url = `${BASE}${route}`;

    /* Warm the route once. The first request to a statically generated page
       still pays for the server reading it off disk; measuring that is
       measuring the filesystem, not the page. */
    await fetch(url).then((r) => r.text());

    const run = await lighthouse(
      url,
      {
        port: 9222,
        output: "json",
        logLevel: "error",
        /* Mobile emulation with the default 4x CPU slowdown and a Slow 4G
           throttle — Lighthouse's own defaults, and the harder of the two
           form factors. A desktop-only number is the flattering one. */
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        onlyCategories: CATEGORIES,
      },
    );

    const cats = run.lhr.categories;
    const row = { route, scores: {}, failures: [] };
    for (const key of CATEGORIES) {
      const score = Math.round((cats[key]?.score ?? 0) * 100);
      row.scores[key] = score;
      if (score < THRESHOLD) row.failures.push(key);
    }
    row.lhr = run.lhr;
    results.push(row);
  }
} finally {
  await browser.close();
  stop();
}

/* --- report --------------------------------------------------------------- */
console.log(
  `\ntokenkit lighthouse gate — ${results.length} route(s), mobile, threshold ${THRESHOLD}\n`,
);
console.log(
  `  ${"ROUTE".padEnd(16)} ${"PERF".padEnd(6)} ${"A11Y".padEnd(6)} ${"BEST".padEnd(6)} SEO`,
);
console.log("  " + "-".repeat(46));
for (const r of results) {
  const s = r.scores;
  const mark = r.failures.length ? "FAIL" : "ok  ";
  console.log(
    `${mark}  ${r.route.padEnd(16)} ${String(s.performance).padEnd(6)} ${String(s.accessibility).padEnd(6)} ${String(s["best-practices"]).padEnd(6)} ${s.seo}`,
  );
}

/* The opportunities behind a failing performance score, so the number comes
   with somewhere to go. */
for (const r of results) {
  if (!r.failures.includes("performance")) continue;
  console.log(`\n  ${r.route} — what cost the points:`);
  const audits = r.lhr.audits;
  for (const key of [
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "speed-index",
    "first-contentful-paint",
  ]) {
    const a = audits[key];
    if (a) console.log(`    ${key.padEnd(28)} ${a.displayValue ?? "-"}  (${Math.round((a.score ?? 0) * 100)})`);
  }
  /* Which element it actually was. "LCP is slow" is not actionable; "LCP is
     the hero photograph" is. */
  const lcpEl = audits["largest-contentful-paint-element"];
  const node = lcpEl?.details?.items?.[0]?.items?.[0]?.node;
  if (node) {
    console.log(`    LCP element: ${node.nodeLabel ?? node.selector ?? "?"}`);
    if (node.snippet) console.log(`                 ${node.snippet.slice(0, 120)}`);
  }
  const opps = Object.values(audits)
    .filter((a) => a.details?.type === "opportunity" && (a.numericValue ?? 0) > 100)
    .sort((a, b) => (b.numericValue ?? 0) - (a.numericValue ?? 0))
    .slice(0, 5);
  for (const o of opps) {
    console.log(`    → ${o.title}: ${o.displayValue ?? ""}`);
  }
}

/* Non-performance failures name the audits, which are actionable as written. */
for (const r of results) {
  for (const cat of r.failures) {
    if (cat === "performance") continue;
    const refs = r.lhr.categories[cat].auditRefs ?? [];
    const failed = refs
      .map((ref) => r.lhr.audits[ref.id])
      .filter((a) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== "informative");
    console.log(`\n  ${r.route} — ${cat}:`);
    for (const a of failed) console.log(`    ✗ ${a.title}`);
  }
}

if (jsonOut) {
  writeFileSync(
    resolve(ROOT, jsonOut),
    JSON.stringify(results.map(({ lhr, ...rest }) => ({ ...rest, lhr })), null, 2),
  );
  console.log(`\n  raw report → ${jsonOut}`);
}

const failing = results.filter((r) => r.failures.length);
console.log(
  `\n${results.length - failing.length} route(s) pass · ${failing.length} fail\n`,
);
process.exit(failing.length ? 1 : 0);
