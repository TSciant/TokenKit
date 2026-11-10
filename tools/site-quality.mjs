#!/usr/bin/env node
/**
 * Site quality: the evidence half of an audit, measured on a live site's pages as a visitor gets them.
 * The structure half (what the site is built from) is capture.mjs, regions.mjs, name-regions.mjs and scorecard.mjs.
 *
 * For each URL in the plan (urls.txt, "# comment" lines name the page type above each URL):
 *   - Lighthouse, mobile with its own throttling (the harder form factor): performance, accessibility, best
 *     practices, SEO, the timings, and every audit that cost points;
 *   - axe-core (WCAG 2.0 to 2.2 A and AA, and best practice) at 1440px and 390px, light, and at 1440px in dark
 *     (prefers-color-scheme), contrast only;
 *   - reflow (WCAG 1.4.10): does anything scroll sideways at 320px;
 *   - text at 200% (WCAG 1.4.4): the root font size doubled at 1280px, does anything scroll sideways;
 *   - keyboard: the first 40 Tab stops, and any that shows no visible focus (no outline, no box-shadow change).
 *
 * Automated checks find a share of accessibility problems, not all of them. This is evidence, never a
 * certificate: the report says what was measured, how, and when.
 *
 *   node tools/site-quality.mjs --dir ../ds-corpus/audits/<slug>            every URL in <dir>/urls.txt
 *   node tools/site-quality.mjs --dir <dir> --url https://example.com/x      one page (merged into the file)
 *   node tools/site-quality.mjs --dir <dir> --file quality-after.json            a re-check, kept beside the first run (audit-compare.mjs)
 *
 * Public pages only, one at a time, an honest user agent. Writes <dir>/quality.json (dated).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const arg = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const dir = resolve(process.cwd(), arg("--dir") ?? ".");
const only = arg("--url");
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const AXE = readFileSync(resolve(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const UA = "token-kit site audit (Playwright; one page at a time)";

/* The plan: each URL with the page type named by the comment above it. */
const plan = [];
let type = null;
for (const line of readFileSync(resolve(dir, "urls.txt"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (t.startsWith("#")) type = t.replace(/^#\s*/, "") || type;
  else if (/^https?:\/\//.test(t)) plan.push({ url: t, type });
}
const todo = only ? plan.filter((p) => p.url === only).concat(plan.some((p) => p.url === only) ? [] : [{ url: only, type: null }]) : plan;

const settle = async (page) => { await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(400); };
const axeRun = async (page, values) => {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (values) => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(" "), summary: (n.failureSummary ?? "").split("\n").slice(1, 2).join("").trim() })) }));
  }, values);
};
const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

const browser = await chromium.launch({ args: ["--remote-debugging-port=9223"] });
const ctx = (opts = {}) => browser.newContext({ userAgent: UA, ...opts });
const rows = [];
try {
  for (const { url, type } of todo) {
    const row = { url, type, scores: {}, metrics: {}, lost: [], axe: {}, reflow320: null, text200: null, keyboard: null };
    const run = await lighthouse(url, { port: 9223, output: "json", logLevel: "error", formFactor: "mobile", screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }, onlyCategories: CATEGORIES });
    for (const k of CATEGORIES) row.scores[k] = Math.round((run.lhr.categories[k]?.score ?? 0) * 100);
    for (const k of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"]) row.metrics[k] = run.lhr.audits[k]?.displayValue ?? null;
    row.lost = CATEGORIES.flatMap((cat) => (run.lhr.categories[cat].auditRefs ?? []).map((r) => run.lhr.audits[r.id])
      .filter((a) => a && a.score !== null && a.score < 1 && !/informative|notApplicable|manual/.test(a.scoreDisplayMode))
      .map((a) => ({ category: cat, id: a.id, title: a.title, value: a.displayValue ?? null, score: Math.round(a.score * 100) })));
    row.lighthouse = run.lhr.lighthouseVersion;

    for (const [key, opts, values] of [["1440", { viewport: { width: 1440, height: 900 } }, TAGS], ["390", { viewport: { width: 390, height: 844 } }, TAGS], ["1440-dark", { viewport: { width: 1440, height: 900 }, colorScheme: "dark" }, ["wcag2aa"]]]) {
      const c = await ctx(opts), page = await c.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" }); await settle(page);
      row.axe[key] = await axeRun(page, values);
      if (key === "1440-dark") row.axe[key] = row.axe[key].filter((v) => v.id === "color-contrast");
      await c.close();
    }
    {
      const c = await ctx({ viewport: { width: 320, height: 640 } }), page = await c.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" }); await settle(page);
      row.reflow320 = await sideways(page);
      await c.close();
    }
    {
      const c = await ctx({ viewport: { width: 1280, height: 800 } }), page = await c.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" }); await settle(page);
      await page.addStyleTag({ content: "html { font-size: 200% !important; }" }); await page.waitForTimeout(300);
      row.text200 = await sideways(page);
      await c.close();
    }
    {
      const c = await ctx({ viewport: { width: 1280, height: 800 } }), page = await c.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" }); await settle(page);
      const stops = [], unseen = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press("Tab");
        const s = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el), label = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("href") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 60);
          const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none");
          const box = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), label, ring, offscreen: box.width === 0 || box.height === 0 };
        });
        if (!s) break;
        stops.push(s);
        if (!s.ring && !s.offscreen) unseen.push(`${s.tag} "${s.label}"`);
      }
      row.keyboard = { stops: stops.length, noVisibleFocus: [...new Set(unseen)] };
      await c.close();
    }
    rows.push(row);
    const ax = Object.entries(row.axe).map(([k, v]) => `${k}:${v.length}`).join(" ");
    console.log(`${url}  P${row.scores.performance} A${row.scores.accessibility} B${row.scores["best-practices"]} S${row.scores.seo}  axe ${ax}  320:${row.reflow320 ? "sideways" : "ok"} 200%:${row.text200 ? "sideways" : "ok"}  keys ${row.keyboard.stops} (${row.keyboard.noVisibleFocus.length} unseen)`);
  }
} finally {
  await browser.close();
}

const file = resolve(dir, arg("--file") ?? "quality.json");   // --file quality-after.json for a re-check beside the first run
const prev = only && existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).pages : [];
const pages = only ? [...prev.filter((p) => !rows.some((r) => r.url === p.url)), ...rows] : rows;
writeFileSync(file, JSON.stringify({
  measured: new Date().toISOString(),
  how: `Live pages. Lighthouse ${rows[0]?.lighthouse ?? ""} mobile (its own Slow 4G and 4x CPU throttling) in Playwright's Chromium; axe-core ${JSON.parse(readFileSync(resolve(ROOT, "node_modules/axe-core/package.json"), "utf8")).version} (WCAG 2.0 to 2.2 A and AA, and best practice) at 1440px and 390px, and contrast in dark at 1440px; sideways scroll at 320px and with text at 200%; the first 40 Tab stops for a visible focus indicator.`,
  pages,
}, null, 2) + "\n");
console.log(`\nWrote ${file} (${pages.length} page(s)).`);
