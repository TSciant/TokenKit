#!/usr/bin/env node
/**
 * Plan URLs — read a site's sitemaps and choose the pages an audit visits:
 * one or two per template, not every page.
 *
 *   node tools/plan-urls.mjs --site https://example.com --out ../client-site/audit
 *     --cache <dir>   keep fetched sitemaps here, and read them from here if present
 *     --busy <n>      a template with more than n URLs gets a second sample (default 100)
 *
 * What it does, politely (one request a second, an honest user agent):
 *
 *   1. robots.txt: the rules for all crawlers, and any Sitemap lines.
 *   2. The sitemaps: robots' own, else /sitemap_index.xml, /sitemap.xml or
 *      /wp-sitemap.xml; an index is expanded. Media files are dropped, and
 *      anything robots disallows for all crawlers.
 *   3. Templates: each URL is grouped by the sitemap it came from (a content
 *      type: posts, pages, staff) and its shape (/insights/<slug>/ is one
 *      shape). One-off pages of the "page" sitemap share one template.
 *   4. Samples: per template, the most recently modified URL (a second for
 *      the busy ones); plus the home page, a search and a page that does not
 *      exist.
 *
 * Writes <out>/urls.txt (read by capture.mjs and regions.mjs, a "# comment"
 * naming each template) and <out>/plan.md: the counts, the templates, a
 * Mermaid tree of the site's sections and a Mermaid chart of where its URLs
 * are. Nothing is captured: a person reads the plan first.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const UA = "Mozilla/5.0 (compatible; site-audit-planner)";
const MEDIA = /\.(pdf|jpe?g|png|gif|webp|svg|mp4|mp3|zip|docx?|xlsx?|pptx?|kml|kmz|xml|json|txt|csv|ics)\/?$/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- fetching, with a cache ---------------------------------------- */

function makeFetcher(cacheDir) {
  if (cacheDir) mkdirSync(cacheDir, { recursive: true });
  let last = 0;
  return async (url) => {
    const name = new URL(url).pathname.split("/").filter(Boolean).pop() || "root";
    const cached = cacheDir && resolve(cacheDir, name);
    if (cached && existsSync(cached)) return { status: 200, text: readFileSync(cached, "utf8"), cached: true };
    const wait = 1000 - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
    const text = res.ok ? await res.text() : "";
    if (res.ok && cached) writeFileSync(cached, text);
    return { status: res.status, text };
  };
}

/* ---------- robots and sitemaps ----------------------------------------------- */

export function parseRobots(text) {
  const rules = [];
  const sitemaps = [];
  let applies = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, key, value] = m;
    const k = key.toLowerCase();
    if (k === "user-agent") applies = value.trim() === "*";
    else if (k === "sitemap") sitemaps.push(value.trim());
    else if (applies && (k === "disallow" || k === "allow") && value.trim()) rules.push({ allow: k === "allow", path: value.trim() });
  }
  return { rules, sitemaps };
}

const allowed = (path, rules) => {
  let best = null;
  for (const r of rules) if (path.startsWith(r.path) && (!best || r.path.length > best.path.length)) best = r;
  return !best || best.allow;
};

export function parseSitemap(xml) {
  const isIndex = /<sitemapindex/i.test(xml);
  const entries = [];
  const re = isIndex ? /<sitemap>([\s\S]*?)<\/sitemap>/gi : /<url>([\s\S]*?)<\/url>/gi;
  for (const [, body] of xml.matchAll(re)) {
    const loc = body.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    const lastmod = body.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/i)?.[1] || null;
    if (loc) entries.push({ loc: loc.replace(/&amp;/g, "&"), lastmod });
  }
  return { isIndex, entries };
}

/* ---------- templates ----------------------------------------------------------- */

/** The content type a sitemap stands for: "post-sitemap2.xml" -> "post". */
const contentType = (sitemapUrl) =>
  new URL(sitemapUrl).pathname
    .split("/")
    .pop()
    .replace(/\.xml$/, "")
    .replace(/[-_]?sitemap\d*$/, "")
    .replace(/^wp-sitemap-posts-/, "")
    .replace(/-\d+$/, "") || "pages";

/** A URL's shape: the first segment kept, the rest as stars. */
export function shapeOf(url) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  if (!parts.length) return "/";
  return `/${parts[0]}/${parts.slice(1).map(() => "*/").join("")}`;
}

export function templates(urls) {
  const map = new Map();
  for (const u of urls) {
    const shape = shapeOf(u.loc);
    /* A one-segment page of the page sitemap is a one-off: they share a template. */
    const oneOff = /^page/.test(u.type) && shape.split("/").filter(Boolean).length === 1 && shape !== "/";
    const key = oneOff ? `${u.type} | one-off pages` : `${u.type} | ${shape}`;
    if (!map.has(key)) map.set(key, { key, type: u.type, shape: oneOff ? "/<page>/" : shape, urls: [] });
    map.get(key).urls.push(u);
  }
  /* A one-URL template whose content type also has deeper pages is that
     type's listing: its index. */
  const list = [...map.values()];
  for (const t of list) {
    const depth = t.shape.split("/").filter(Boolean).length;
    if (t.urls.length === 1 && list.some((o) => o !== t && o.type === t.type && o.shape.split("/").filter(Boolean).length > depth)) t.index = true;
  }
  return list.sort((a, b) => b.urls.length - a.urls.length);
}

const label = (t) => {
  const type = t.type.replace(/[-_]/g, " ");
  const name = type.charAt(0).toUpperCase() + type.slice(1);
  if (t.shape === "/") return "Home";
  if (t.index) return `${name}: index`;
  return t.shape === "/<page>/" ? `${name}: one-off pages` : `${name}: ${t.shape}`;
};

/* ---------- Mermaid ---------------------------------------------------------------- */

const mermaidId = (s) => `n${s.replace(/[^a-z0-9]/gi, "_")}`;
const mermaidText = (s) => {
  const t = String(s).replace(/"/g, "'");
  return t.length > 30 ? `${t.slice(0, 28)}…` : t;
};

/** The site's sections as a tree: first and second path segments, with counts. */
export function iaTree(urls, siteLabel, maxChildren = 8) {
  const top = new Map();
  for (const u of urls) {
    const parts = new URL(u.loc).pathname.split("/").filter(Boolean);
    const a = parts[0] || "(home)";
    if (!top.has(a)) top.set(a, { count: 0, kids: new Map() });
    const t = top.get(a);
    t.count++;
    if (parts[1]) t.kids.set(parts[1], (t.kids.get(parts[1]) || 0) + 1);
  }
  const sections = [...top.entries()].sort((a, b) => b[1].count - a[1].count);
  const big = sections.filter(([, v]) => v.count > 1).slice(0, 14);
  const singles = sections.filter(([, v]) => v.count === 1).length + sections.filter(([, v]) => v.count > 1).slice(14).length;
  const L = ["flowchart LR", `  root["${mermaidText(siteLabel)}<br/>${urls.length} URLs"]`];
  for (const [name, v] of big) {
    const id = mermaidId(name);
    L.push(`  root --> ${id}["/${mermaidText(name)}/<br/>${v.count}"]`);
    const kids = [...v.kids.entries()].sort((a, b) => b[1] - a[1]);
    const shown = kids.filter(([, c]) => c > 1).slice(0, maxChildren);
    for (const [k, c] of shown) L.push(`  ${id} --> ${mermaidId(name + "_" + k)}["${mermaidText(k)}<br/>${c}"]`);
    const rest = kids.length - shown.length;
    if (rest > 0) L.push(`  ${id} --> ${mermaidId(name + "_rest")}["${rest} ${shown.length ? "more" : "pages"}"]`);
  }
  if (singles) L.push(`  root --> singles["${singles} one-off pages"]`);
  return L.join("\n");
}

export function volumePie(tpls, title) {
  const byType = new Map();
  for (const t of tpls) byType.set(t.type, (byType.get(t.type) || 0) + t.urls.length);
  return [`pie showData title ${mermaidText(title)}`, ...[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `  "${mermaidText(k.replace(/[-_]/g, " "))}" : ${v}`)].join("\n");
}

/* ---------- run ---------------------------------------------------------------------- */

async function main() {
  const argv = process.argv.slice(2);
  const arg = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
  const site = arg("--site");
  const out = arg("--out");
  if (!site || !out) {
    console.error("Usage: node tools/plan-urls.mjs --site https://example.com --out <dir> [--cache <dir>] [--busy 100]");
    process.exit(1);
  }
  const origin = new URL(site).origin;
  const busy = Number(arg("--busy") || 100);
  const get = makeFetcher(arg("--cache") ? resolve(process.cwd(), arg("--cache")) : null);

  /* 1. robots.txt */
  const robotsRes = await get(`${origin}/robots.txt`);
  const robots = robotsRes.status === 200 ? parseRobots(robotsRes.text) : { rules: [], sitemaps: [] };

  /* 2. sitemaps */
  let rootMap = robots.sitemaps[0];
  if (!rootMap) {
    for (const p of ["/sitemap_index.xml", "/sitemap.xml", "/wp-sitemap.xml"]) {
      const r = await get(origin + p);
      if (r.status === 200 && /<(sitemapindex|urlset)/i.test(r.text)) {
        rootMap = origin + p;
        break;
      }
    }
  }
  if (!rootMap) {
    console.error("No sitemap found: plan this site from its navigation by hand.");
    process.exit(1);
  }
  const rootRes = await get(rootMap);
  const root = parseSitemap(rootRes.text);
  const maps = root.isIndex ? root.entries.map((e) => e.loc) : [rootMap];
  const urls = [];
  for (const m of maps) {
    const res = await get(m);
    if (res.status !== 200) continue;
    const parsed = parseSitemap(res.text);
    for (const e of parsed.entries) {
      const path = new URL(e.loc).pathname;
      if (MEDIA.test(path) || !allowed(path, robots.rules)) continue;
      urls.push({ ...e, type: contentType(m), sitemap: m });
    }
  }
  const generatorHint = maps.some((m) => /yoast|wp-sitemap|sitemap_index/.test(m)) || /yoast/i.test(rootRes.text) ? "WordPress" : null;

  /* 3. templates, 4. samples */
  const tpls = templates(urls);
  const byDate = (a, b) => String(b.lastmod || "").localeCompare(String(a.lastmod || ""));
  const picks = [];
  for (const t of tpls) {
    const sorted = [...t.urls].sort(byDate);
    t.sample = sorted.slice(0, t.urls.length > busy ? 2 : 1);
    picks.push(...t.sample);
  }
  const home = `${origin}/`;
  const utility = [home, generatorHint ? `${origin}/?s=help` : null, `${origin}/audit-404-check/`].filter(Boolean);

  /* --data <file>: the site's structure as JSON (sections and sub-sections
     with URL counts, and the templates), for charts; the plan is not touched. */
  const dataOut = arg("--data");
  if (dataOut) {
    const tree = new Map();
    for (const u of urls) {
      const parts = new URL(u.loc).pathname.split("/").filter(Boolean);
      const a = parts[0] || "(home)";
      if (!tree.has(a)) tree.set(a, { name: a, count: 0, children: new Map() });
      const t = tree.get(a);
      t.count++;
      if (parts.length > 1) t.children.set(parts[1], (t.children.get(parts[1]) || 0) + 1);
    }
    const sections = [...tree.values()]
      .map((t) => ({ name: t.name, count: t.count, children: [...t.children.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count) }))
      .sort((a, b) => b.count - a.count);
    const site = {
      generatedAt: new Date().toISOString(),
      origin,
      urls: urls.length,
      sitemaps: maps.length,
      sections,
      templates: tpls.map((t) => ({ label: label(t), type: t.type, shape: t.shape, urls: t.urls.length, latest: t.urls.map((u) => u.lastmod || "").sort().pop() || null })),
    };
    writeFileSync(resolve(process.cwd(), dataOut), JSON.stringify(site, null, 2));
    console.log(`${urls.length} URLs in ${sections.length} sections, ${tpls.length} templates. Wrote ${dataOut}`);
    return;
  }

  /* Write urls.txt */
  mkdirSync(resolve(process.cwd(), out), { recursive: true });
  const L = [
    `# URL plan for ${origin}, drafted ${new Date().toISOString().slice(0, 10)} by plan-urls.mjs from its sitemaps.`,
    "# One or two pages per template; see plan.md for the counts. Not yet approved.",
    "",
    "# Home",
    home,
  ];
  for (const t of tpls) {
    const sample = t.sample.filter((u) => u.loc !== home);
    if (!sample.length) continue;
    L.push("", `# ${label(t)}`, ...sample.map((u) => u.loc));
  }
  L.push("", "# Utility: search and a page that does not exist", ...utility.slice(1));
  writeFileSync(resolve(process.cwd(), out, "urls.txt"), L.join("\n") + "\n");

  /* Write plan.md */
  const host = new URL(origin).host;
  const md = [
    `# URL plan: ${host}`,
    "",
    `Drafted ${new Date().toISOString().slice(0, 10)} from the site's sitemaps. **Not yet approved**: nothing but robots.txt and the sitemaps has been read. The URLs are in [urls.txt](urls.txt).`,
    "",
    "## What the sitemaps say",
    "",
    `- robots.txt: ${robotsRes.status === 200 ? `${robots.rules.filter((r) => !r.allow).length ? `disallows ${robots.rules.filter((r) => !r.allow).map((r) => `\`${r.path}\``).join(", ")} for all crawlers` : "allows all crawlers everywhere"}; ${robots.sitemaps.length ? `names ${robots.sitemaps.length} sitemap(s)` : "names no sitemap"}` : `not found (${robotsRes.status})`}.`,
    `- Sitemap: \`${new URL(rootMap).pathname}\`${root.isIndex ? `, an index of ${maps.length}` : ""}${generatorHint ? ` (${generatorHint})` : ""}.`,
    `- **${urls.length.toLocaleString("en")} URLs** in **${tpls.length} templates**; the plan visits **${picks.length + utility.length}**.`,
    "",
    "## The site's sections",
    "",
    "```mermaid",
    iaTree(urls, host),
    "```",
    "",
    "## Where the URLs are",
    "",
    "```mermaid",
    volumePie(tpls, "URLs by content type"),
    "```",
    "",
    "## Templates and samples",
    "",
    "| Template | URLs | Sampled | Latest change |",
    "|---|---:|---:|---|",
    ...tpls.map((t) => `| ${label(t)} | ${t.urls.length.toLocaleString("en")} | ${t.sample.length} | ${t.sample[0]?.lastmod?.slice(0, 10) || ""} |`),
    "",
    "## How the sample was chosen",
    "",
    "- One URL per template, two where a template has more than " + busy + " URLs.",
    "- The most recently modified URL in each, so the sample is the site as it is now.",
    "- The home page, a search and a page that does not exist, for the site's defaults.",
    "",
    "## For approval",
    "",
    "1. The plan as listed, or changes to it (sections to add or leave out).",
    "2. Whether to add second samples where a template's pages may differ.",
    "",
  ].join("\n");
  writeFileSync(resolve(process.cwd(), out, "plan.md"), md);
  console.log(`${urls.length} URLs in ${tpls.length} templates from ${maps.length} sitemap(s); plan visits ${picks.length + utility.length}. Wrote ${out}/urls.txt and plan.md`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
