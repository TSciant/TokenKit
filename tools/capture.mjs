#!/usr/bin/env node
/**
 * Capture — reference screenshots plus a measured inventory of an existing site.
 *
 * Two outputs, and the second is the one that does the work:
 *
 *   captures/    PNGs per page per breakpoint, for onionskin comparison
 *   inventory.json  what the site is actually made of — the type sizes in
 *                   use, the colours in use, the spacing values in use, and
 *                   the repeating structures ranked by frequency
 *
 * The inventory is how a component audit stops being a matter of taste. A
 * pattern that appears on six pages is a component; one that appears once is
 * a page. You cannot tell which from looking.
 *
 * Usage:
 *   node tools/capture.mjs --slug acme --urls urls.txt
 *   node tools/capture.mjs --slug acme --url https://example.com/ --url https://example.com/about
 *   node tools/capture.mjs --slug acme --urls urls.txt --out ../acme-site/audit
 *
 * --out writes there instead of audits/<slug>. Use it for any client's site:
 * audits/ is part of the public kit.
 *
 * --merge re-captures the URLs given and keeps every other page already in
 * the inventory, so one page that failed can be taken again on its own.
 *
 * urls.txt is one URL per line, blank lines and # comments ignored.
 */

import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { wake } from "./lib/wake.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BREAKPOINTS = [
  { name: "360", width: 360, height: 800 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 900 },
  { name: "1600", width: 1600, height: 1000 },
];

function parseArgs(argv) {
  const out = { slug: "audit", urls: [], full: true, wait: 1200 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug") out.slug = argv[++i];
    else if (a === "--url") out.urls.push(argv[++i]);
    else if (a === "--urls") out.urlFile = argv[++i];
    else if (a === "--wait") out.wait = Number(argv[++i]);
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--no-full") out.full = false;
    else if (a === "--merge") out.merge = true;
  }
  return out;
}

const slugify = (u) =>
  u
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "index";

/** Runs in the page. Pure measurement — no interpretation. */
function inventory() {
  const seen = {
    fontFamily: {},
    fontSize: {},
    fontWeight: {},
    lineHeight: {},
    color: {},
    backgroundColor: {},
    borderRadius: {},
    borderColor: {},
    paddingTop: {},
    paddingLeft: {},
    marginBottom: {},
    gap: {},
    maxWidth: {},
  };

  const bump = (bucket, value) => {
    if (!value || value === "none" || value === "normal" || value === "auto") return;
    if (value === "rgba(0, 0, 0, 0)") return;
    if (value === "0px") return;
    seen[bucket][value] = (seen[bucket][value] || 0) + 1;
  };

  const structures = {};
  const headings = [];
  const landmarks = [];
  const interactive = { button: 0, link: 0, input: 0, select: 0, textarea: 0 };

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  };

  /** Shape, not content: tag + the tag sequence of its children. */
  const signature = (el) => {
    const kids = Array.from(el.children)
      .slice(0, 8)
      .map((c) => c.tagName.toLowerCase())
      .join(">");
    const role = el.getAttribute("role");
    return `${el.tagName.toLowerCase()}${role ? `[${role}]` : ""}(${kids})`;
  };

  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);

    bump("fontFamily", cs.fontFamily.split(",")[0].replace(/["']/g, "").trim());
    bump("fontSize", cs.fontSize);
    bump("fontWeight", cs.fontWeight);
    bump("lineHeight", cs.lineHeight);
    bump("color", cs.color);
    bump("backgroundColor", cs.backgroundColor);
    bump("borderRadius", cs.borderRadius);
    if (parseFloat(cs.borderTopWidth) > 0) bump("borderColor", cs.borderTopColor);
    bump("paddingTop", cs.paddingTop);
    bump("paddingLeft", cs.paddingLeft);
    bump("marginBottom", cs.marginBottom);
    bump("gap", cs.gap);
    if (cs.maxWidth !== "none") bump("maxWidth", cs.maxWidth);

    if (el.children.length >= 2) {
      const sig = signature(el);
      structures[sig] = (structures[sig] || 0) + 1;
    }

    const tag = el.tagName.toLowerCase();
    if (tag === "button" || el.getAttribute("role") === "button") interactive.button++;
    else if (tag === "a" && el.hasAttribute("href")) interactive.link++;
    else if (tag === "input") interactive.input++;
    else if (tag === "select") interactive.select++;
    else if (tag === "textarea") interactive.textarea++;

    if (/^h[1-6]$/.test(tag)) {
      headings.push({ level: Number(tag[1]), text: el.textContent.trim().slice(0, 80) });
    }

    const role = el.getAttribute("role");
    if (["banner", "navigation", "main", "contentinfo", "complementary", "search"].includes(role)) {
      landmarks.push(role);
    }
  }

  for (const tag of ["header", "nav", "main", "footer", "aside"]) {
    if (document.querySelector(tag)) landmarks.push(tag);
  }

  const top = (obj, n = 20) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, count]) => ({ value, count }));

  return {
    title: document.title,
    lang: document.documentElement.lang || null,
    styles: Object.fromEntries(Object.keys(seen).map((k) => [k, top(seen[k])])),
    structures: top(structures, 40),
    headings,
    headingOrderIssues: headings.reduce((acc, h, i, arr) => {
      if (i > 0 && h.level - arr[i - 1].level > 1) {
        acc.push(`h${arr[i - 1].level} -> h${h.level} at "${h.text}"`);
      }
      return acc;
    }, []),
    landmarks: [...new Set(landmarks)],
    interactive,
    imagesMissingAlt: Array.from(document.images).filter((i) => !i.hasAttribute("alt")).length,
    imageCount: document.images.length,
  };
}

const opts = parseArgs(process.argv.slice(2));

if (opts.urlFile) {
  const txt = await readFile(resolve(process.cwd(), opts.urlFile), "utf8");
  opts.urls.push(
    ...txt
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#")),
  );
}

if (opts.urls.length === 0) {
  console.error(
    "No URLs. Use --url <href> (repeatable) or --urls <file>.\n" +
      "Example: node tools/capture.mjs --slug acme --urls audits/acme/urls.txt",
  );
  process.exit(1);
}

/* A client's audit belongs in their repository: --out puts it there. The
   default, audits/<slug>, is inside the kit, which the public export copies. */
const outDir = opts.out ? resolve(process.cwd(), opts.out) : resolve(ROOT, "audits", opts.slug);
const shotDir = resolve(outDir, "captures");
await mkdir(shotDir, { recursive: true });

const executablePath = process.env.TOKENKIT_CHROMIUM || undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

const pages = [];

for (const url of opts.urls) {
  const slug = slugify(url);
  const record = { url, slug, breakpoints: {}, inventory: null, error: null };
  console.log(`\n${url}`);

  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage({
      viewport: { width: bp.width, height: bp.height },
    });
    try {
      /* One retry, waiting only for load: some pages never fall network-idle
         (a polling widget), and would otherwise never be captured. */
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => page.goto(url, { waitUntil: "load", timeout: 60000 }));
      await page.waitForTimeout(opts.wait);
      /* Wake it as a visitor would: delayed scripts run, lazy iframes load, and
         a consent banner is recorded and declined rather than photographed
         over the content (tools/lib/wake.mjs). */
      const woke = await wake(page);
      if (woke.consent) record.consent = woke.consent;

      const file = `${slug}@${bp.name}.png`;
      await page
        .screenshot({ path: resolve(shotDir, file), fullPage: opts.full })
        .catch(async () => {
          /* Chromium sometimes cannot stitch a full page (a tall page with
             transformed or embedded content): grow the viewport to the page
             and take it as one ordinary screenshot instead. */
          const h = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.setViewportSize({ width: bp.width, height: Math.min(h, 16000) });
          await page.waitForTimeout(400);
          await page.screenshot({ path: resolve(shotDir, file) });
        });
      record.breakpoints[bp.name] = file;
      console.log(`  ${bp.name.padEnd(5)} ${file}`);

      // Inventory once, at the widest breakpoint, where the most is visible.
      if (bp.name === "1600") {
        record.inventory = await page.evaluate(inventory);
      }
    } catch (err) {
      record.error = String(err.message || err);
      console.log(`  ${bp.name.padEnd(5)} failed: ${record.error}`);
    } finally {
      await page.close();
    }
  }

  pages.push(record);
}

await browser.close();

/* --merge: these pages replace their earlier selves in an existing
   inventory, and the rest are kept, so one page can be re-captured alone. */
const invPath = resolve(outDir, "inventory.json");
if (opts.merge && existsSync(invPath)) {
  const before = JSON.parse(await readFile(invPath, "utf8")).pages || [];
  const fresh = new Map(pages.map((p) => [p.url, p]));
  const kept = before.filter((p) => !fresh.has(p.url));
  const order = before.map((p) => p.url);
  pages.splice(0, pages.length, ...[...kept, ...fresh.values()].sort((a, b) => (order.indexOf(a.url) + 1 || 1e9) - (order.indexOf(b.url) + 1 || 1e9)));
}

/* Roll the per-page inventories into one site-level view. Frequency across
   pages is the signal: a structure on one page is a page, a structure on six
   pages is a component. */
const merged = {};
const structurePages = {};

for (const p of pages) {
  if (!p.inventory) continue;
  for (const [bucket, rows] of Object.entries(p.inventory.styles)) {
    merged[bucket] = merged[bucket] || {};
    for (const { value, count } of rows) {
      merged[bucket][value] = (merged[bucket][value] || 0) + count;
    }
  }
  for (const { value } of p.inventory.structures) {
    structurePages[value] = structurePages[value] || new Set();
    structurePages[value].add(p.slug);
  }
}

const site = {
  generatedAt: new Date().toISOString(),
  slug: opts.slug,
  pageCount: pages.length,
  styles: Object.fromEntries(
    Object.entries(merged).map(([k, v]) => [
      k,
      Object.entries(v)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 24)
        .map(([value, count]) => ({ value, count })),
    ]),
  ),
  recurringStructures: Object.entries(structurePages)
    .map(([signature, set]) => ({ signature, pages: set.size }))
    .filter((r) => r.pages > 1)
    .sort((a, b) => b.pages - a.pages)
    .slice(0, 40),
  pages,
};

await writeFile(resolve(outDir, "inventory.json"), JSON.stringify(site, null, 2));

console.log(`\nCaptured ${pages.length} pages x ${BREAKPOINTS.length} breakpoints`);
console.log(`Inventory: ${resolve(outDir, "inventory.json")}`);
console.log(`Next: node tools/audit.mjs ${opts.out ? `--out ${opts.out}` : `--slug ${opts.slug}`}\n`);
