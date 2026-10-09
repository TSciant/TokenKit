#!/usr/bin/env node
/**
 * Scorecard — the audit, readable: every page's regions with their crops,
 * types, evidence and references, and the site rolled up.
 *
 * Reads, from one audit folder:
 *   named.json      name-regions.mjs: each region's type, confidence, evidence, refs
 *   regions.json    regions.mjs: pages, titles, stylesheets, classes (for fingerprints)
 *   urls.txt        the plan: the "# comment" above each URL names its page type
 *   inventory.json  capture.mjs, optional: heading order and image findings
 *
 * Writes scorecard.md and scorecard.html beside them. The HTML is one file
 * with the crops linked relatively, so it opens from the folder as it is.
 *
 *   node tools/scorecard.mjs --dir ../client-site/audit [--title "Site audit"]
 *
 * The site rollup is the point. A type on two or more page types is a
 * component or a section; on one, it belongs to its page. Types with no kit
 * equivalent and types with no documentation are listed as gaps: both are
 * work, one in the kit and one in the corpus.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/* ---------- fingerprints: the site's own system, or its platform ------------- */

const SYSTEMS = [
  { name: "U.S. Web Design System", test: /\busa-[a-z]/, docs: "https://designsystem.digital.gov/components/" },
  { name: "GOV.UK Design System", test: /\bgovuk-[a-z]/, docs: "https://design-system.service.gov.uk/components/" },
  { name: "Carbon Design System", test: /\b(bx|cds)--[a-z]/, docs: "https://carbondesignsystem.com/components/" },
  { name: "PatternFly", test: /\bpf-(c|l|v\d)-/, docs: "https://www.patternfly.org/components/" },
  { name: "Lightning Design System", test: /\bslds-[a-z]/, docs: "https://www.lightningdesignsystem.com/components/" },
  { name: "Primer", test: /\b(Box-|color-fg-|prc-)/, docs: "https://primer.style/components/" },
  { name: "Material UI", test: /\bMui[A-Z]/, docs: "https://mui.com/material-ui/" },
  { name: "Bootstrap", test: /\b(navbar-expand|col-(sm|md|lg)-\d|btn-primary)\b/, docs: "https://getbootstrap.com/docs/" },
];
const PLATFORMS = [
  { name: "WordPress", test: (s) => /wordpress/i.test(s.generator) || /\/wp-content\/|\bwp-block-/.test(s.all) },
  { name: "GeneratePress", test: (s) => /generatepress|\bgenerate-back-to-top\b|\binside-article\b/.test(s.all) },
  { name: "GenerateBlocks", test: (s) => /\bgb-(container|button|grid|headline)/.test(s.all) },
  { name: "Elementor", test: (s) => /\belementor-/.test(s.all) },
  { name: "Divi", test: (s) => /\bet_pb_/.test(s.all) },
  { name: "Webflow", test: (s) => /webflow/i.test(s.generator) || /\bw-(nav|container|button)\b/.test(s.all) },
  { name: "Squarespace", test: (s) => /squarespace/i.test(s.all) },
  { name: "Drupal", test: (s) => /drupal/i.test(s.generator) || /\/sites\/default\/files\//.test(s.all) },
];

export function fingerprint(regionsData) {
  const parts = [];
  let generator = "";
  for (const p of regionsData.pages) {
    for (const w of Object.values(p.widths)) {
      if (!w?.regions) continue;
      generator ||= w.generator || "";
      parts.push(...(w.stylesheets || []));
      for (const r of w.regions) parts.push((r.classes || []).join(" "));
    }
  }
  const s = { all: parts.join(" "), generator };
  return {
    system: SYSTEMS.find((x) => x.test.test(s.all)) || null,
    platforms: PLATFORMS.filter((x) => x.test(s)).map((x) => x.name),
    generator: generator || null,
  };
}

/* ---------- inputs ------------------------------------------------------------ */

/** Page type for each URL: the nearest "# comment" above it in the plan. */
function pageTypes(planPath) {
  const map = new Map();
  if (!existsSync(planPath)) return map;
  let label = "Other";
  for (const line of readFileSync(planPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("#")) {
      const c = t.replace(/^#+\s*/, "");
      if (/^https?:/.test(c) || /^=+/.test(c) || /^(Read by|Uncomment|Engagement|site's|was chosen|pages added|#)/i.test(c) || c.length > 70) continue;
      /* "Name — what it is": the name labels the page type; the rest explains it. */
      const name = c.split(/\s+[—–]\s+/)[0].trim();
      label = name.charAt(0).toUpperCase() + name.slice(1);
    } else if (/^https?:/.test(t)) map.set(t, label);
  }
  return map;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pathOf = (url) => {
  try {
    const u = new URL(url);
    return (u.pathname + u.search).replace(/\/$/, "") || "/";
  } catch {
    return url;
  }
};

/** The reference a row shows: the site's own system first, else the best documented one. */
function bestRef(refs, site) {
  if (site.system) return { label: `${site.system.name} (site's own system)`, url: site.system.docs, inCorpus: false, own: true };
  const r = (refs || []).find((x) => x.chosen) || (refs || []).find((x) => x.inCorpus) || (refs || [])[0];
  return r ? { label: r.system, url: r.url, inCorpus: r.inCorpus, path: r.path || null } : null;
}

/* ---------- build ------------------------------------------------------------- */

function build(dir, title) {
  const named = JSON.parse(readFileSync(resolve(dir, "named.json"), "utf8"));
  const regionsData = JSON.parse(readFileSync(resolve(dir, "regions.json"), "utf8"));
  const types = pageTypes(resolve(dir, "urls.txt"));
  const inventory = existsSync(resolve(dir, "inventory.json")) ? JSON.parse(readFileSync(resolve(dir, "inventory.json"), "utf8")) : null;
  const site = fingerprint(regionsData);
  const taxPath = named.taxonomy?.path;
  const taxonomy = taxPath && existsSync(resolve(process.cwd(), taxPath)) ? JSON.parse(readFileSync(resolve(process.cwd(), taxPath), "utf8")) : null;
  const typeName = new Map((taxonomy?.types || []).map((t) => [t.id, t]));

  const measured = new Map(regionsData.pages.map((p) => [p.url, p.widths[named.width] || {}]));
  const pages = [...new Set(named.regions.map((r) => r.url))].map((url) => {
    const m = measured.get(url) || {};
    return {
      url,
      type: types.get(url) || "Other",
      title: m.title || "",
      /* The page as split: its size, and where no region holds it, so a
         viewer can lay the crops back out as the whole page. */
      size: { width: m.width || named.width, height: m.height || 0, coverage: m.coverage ?? null, gaps: m.gaps || [] },
      regions: named.regions.filter((r) => r.url === url),
    };
  });

  /* Rollup: for each type, the pages and page types it was seen on. */
  const roll = new Map();
  for (const r of named.regions) {
    if (!r.answer || r.answer.type === "unknown") continue;
    const t = r.answer.type;
    if (!roll.has(t)) roll.set(t, { type: t, regions: 0, pages: new Set(), pageTypes: new Set(), refs: r.references?.refs || [], kit: r.references?.kit ?? null });
    const e = roll.get(t);
    e.regions++;
    e.pages.add(r.url);
    e.pageTypes.add(types.get(r.url) || "Other");
  }
  const rollup = [...roll.values()].sort((a, b) => b.pageTypes.size - a.pageTypes.size || b.pages.size - a.pages.size);
  const pageTypeList = [...new Set(pages.map((p) => p.type))];

  const total = named.regions.length;
  const open = named.regions.filter((r) => !r.answer).length;
  const unknown = named.regions.filter((r) => r.answer?.type === "unknown").length;
  const toConfirm = named.regions.filter((r) => r.answer?.by === "rule" && r.answer.confidence !== "high").length;
  const byAgent = named.regions.filter((r) => r.answer?.by === "agent").length;
  const agreed = named.regions.filter((r) => r.answer?.agrees === true).length;
  const disagreed = named.regions.filter((r) => r.answer?.agrees === false).length;

  const recurring = rollup.filter((e) => e.pageTypes.size >= 2);
  const onePage = rollup.filter((e) => e.pageTypes.size < 2);
  const kitGaps = rollup.filter((e) => !e.kit);
  const docGaps = rollup.filter((e) => !e.refs.length);
  const notInCorpus = rollup.filter((e) => e.refs.length && !e.refs.some((r) => r.inCorpus));

  /* Findings the capture measured on the way. */
  const findings = [];
  for (const p of inventory?.pages || []) {
    const inv = p.inventory;
    if (!inv) continue;
    if (inv.headingOrderIssues?.length) findings.push({ url: p.url, what: `heading levels skipped: ${inv.headingOrderIssues.slice(0, 3).join("; ")}` });
    if (inv.imagesMissingAlt) findings.push({ url: p.url, what: `${inv.imagesMissingAlt} of ${inv.imageCount} images have no alt attribute` });
  }

  const name = (t) => typeName.get(t)?.name || t;
  const siteLine = site.system
    ? `${site.system.name}, by its class names: references point at its own documentation.`
    : site.platforms.length
      ? `${site.platforms.join(" + ")}${site.generator ? ` (${site.generator})` : ""}. No design system of its own was found, so references point at the closest documented system.`
      : "No design system or platform was recognised; references point at the closest documented system.";

  const group = (t) => typeName.get(t)?.group || "other";

  /* Page anatomy: each page as its regions top to bottom, to scale. Fixed
     things float over the page, so they are listed, not stacked. */
  const heights = new Map(regionsData.pages.map((p) => [p.url, p.widths[named.width]?.height || 0]));
  const anatomy = pages.map((p) => ({
    url: p.url,
    type: p.type,
    height: heights.get(p.url) || Math.max(...p.regions.map((r) => r.box.y + r.box.h), 1),
    blocks: p.regions
      .filter((r) => r.box.h > 0)
      .map((r) => ({ n: r.n, y: r.box.y, h: r.box.h, x: r.box.x, w: r.box.w, type: r.answer?.type || null, group: r.answer ? group(r.answer.type) : "open", fixed: r.kind === "fixed" })),
  }));

  /* Mermaid: the component inventory as a mindmap, grouped as the taxonomy groups it. */
  const mm = (s) => String(s).replace(/[()[\]{}"]/g, "");
  const groups = [...new Set(rollup.map((e) => group(e.type)))];
  const mindmap = [
    "mindmap",
    `  root((${mm(title.replace(/:.*/, "") || "Site")}))`,
    ...groups.flatMap((g) => [`    ${mm(g.replace(/-/g, " "))}`, ...rollup.filter((e) => group(e.type) === g).map((e) => `      ${mm(name(e.type))} · ${e.pages.size}p`)]),
  ].join("\n");

  /* Mermaid: page types to the recurring types they share (what each template is built from). */
  const id = (s) => `x${String(s).replace(/[^a-z0-9]/gi, "_")}`;
  const typePages = new Map(pageTypeList.map((t) => [t, pages.filter((p) => p.type === t).length]));
  /* Types on nearly every page type are the site's chrome: one note, not a
     line from every template, so the lines left show what sets templates apart. */
  const everywhere = recurring.filter((e) => e.pageTypes.size >= Math.max(3, pageTypeList.length * 0.8));
  const shared = recurring.filter((e) => !everywhere.includes(e));
  const usedTypes = pageTypeList.filter((t) => shared.some((e) => e.pageTypes.has(t)));
  const flow = [
    "flowchart TB",
    everywhere.length ? `  chrome[["On every page: ${everywhere.map((e) => mm(name(e.type))).join(", ")}"]]` : "",
    ...usedTypes.map((t) => `  ${id("p" + t)}["${mm(t).slice(0, 34)} (${typePages.get(t)})"]`),
    ...shared.map((e) => `  ${id("t" + e.type)}(["${mm(name(e.type))} · ${e.pages.size}p"])`),
    ...shared.flatMap((e) => [...e.pageTypes].map((t) => `  ${id("p" + t)} --- ${id("t" + e.type)}`)),
    `  classDef type fill:#ececec,stroke:#5c5c5c`,
    ...shared.map((e) => `  class ${id("t" + e.type)} type`),
  ]
    .filter(Boolean)
    .join("\n");

  return { title, site, siteLine, pages, rollup, pageTypeList, recurring, onePage, kitGaps, docGaps, notInCorpus, findings, name, group, anatomy, mindmap, flow, counts: { total, open, unknown, toConfirm, byAgent, agreed, disagreed, pages: pages.length, types: rollup.length } };
}

/* ---------- write data ------------------------------------------------------------ */

/** Everything the page shows, as plain JSON (Sets become arrays, references resolved). */
function data(s) {
  const typeRow = (e) => ({
    id: e.type,
    name: s.name(e.type),
    group: s.group(e.type),
    regions: e.regions,
    pages: e.pages.size,
    pageTypes: [...e.pageTypes],
    kit: e.kit,
    reference: bestRef(e.refs, s.site),
    refs: e.refs,
  });
  return {
    generatedAt: new Date().toISOString(),
    title: s.title,
    site: { line: s.siteLine, system: s.site.system?.name || null, platforms: s.site.platforms, generator: s.site.generator },
    counts: { ...s.counts, high: s.counts.total - s.counts.open - s.counts.toConfirm - s.counts.byAgent - s.counts.unknown, recurring: s.recurring.length },
    types: s.rollup.map(typeRow),
    recurring: s.recurring.map((e) => e.type),
    onePage: s.onePage.map((e) => e.type),
    gaps: { kit: s.kitGaps.map((e) => e.type), docs: s.docGaps.map((e) => e.type), notInCorpus: s.notInCorpus.map((e) => e.type) },
    pageTypes: s.pageTypeList,
    findings: s.findings.map((f) => ({ ...f, path: pathOf(f.url) })),
    diagrams: { inventory: s.mindmap, templates: s.flow },
    anatomy: s.anatomy.map((p) => ({ ...p, path: pathOf(p.url) })),
    pages: s.pages.map((p) => ({
      url: p.url,
      path: pathOf(p.url),
      type: p.type,
      title: p.title,
      ...p.size,
      regions: p.regions.map((r) => ({
        n: r.n,
        kind: r.kind,
        box: r.box,
        crops: r.crops,
        type: r.answer?.type || null,
        name: r.answer ? s.name(r.answer.type) : null,
        group: r.answer ? s.group(r.answer.type) : null,
        confidence: r.answer?.confidence || null,
        by: r.answer?.by || null,
        evidence: r.answer?.evidence || [],
        kit: r.references?.kit ?? null,
        reference: r.answer ? bestRef(r.references?.refs, s.site) : null,
      })),
    })),
  };
}

/* ---------- write markdown ------------------------------------------------------ */

function markdown(s) {
  const L = [];
  const c = s.counts;
  L.push(`# ${s.title}`, "");
  L.push(`**Site:** ${s.siteLine}`, "");
  L.push(
    `**Coverage:** ${c.pages} pages, ${c.total} regions, ${c.types} types. Named by rule (high): ${c.total - c.open - c.toConfirm - c.byAgent - c.unknown}; by rule, to confirm: ${c.toConfirm}; by the agent: ${c.byAgent}${c.byAgent ? ` (agreed with the rule on ${c.agreed}, overruled it on ${c.disagreed})` : ""}; unknown: ${c.unknown}; not yet named: ${c.open}.`,
    "",
  );
  L.push("## What the site is built from", "", "Every type found, by group, with the number of pages it appears on.", "", "```mermaid", s.mindmap, "```", "");
  L.push("## Templates and what they share", "", "Each page type (with its page count) linked to the recurring components and sections on it.", "", "```mermaid", s.flow, "```", "");
  L.push("## Recurring: components and sections", "", "Seen on two or more page types.", "");
  L.push("| Type | Regions | Pages | Page types | Kit | Reference |", "|---|---:|---:|---|---|---|");
  for (const e of s.recurring) {
    const ref = bestRef(e.refs, s.site);
    L.push(`| ${s.name(e.type)} | ${e.regions} | ${e.pages.size} | ${[...e.pageTypes].join(", ")} | ${e.kit || "**gap**"} | ${ref ? `[${ref.label}](${ref.url})${ref.inCorpus === false && !ref.own ? " (not in corpus)" : ""}` : "none"} |`);
  }
  L.push("", "## One page type only", "");
  L.push(s.onePage.length ? s.onePage.map((e) => `- **${s.name(e.type)}**: ${[...e.pageTypes][0]} (${e.regions} region${e.regions === 1 ? "" : "s"})`).join("\n") : "None.", "");
  L.push("## Gaps", "");
  L.push(`- **No kit equivalent:** ${s.kitGaps.map((e) => s.name(e.type)).join(", ") || "none"}.`);
  L.push(`- **No documentation anywhere:** ${s.docGaps.map((e) => s.name(e.type)).join(", ") || "none"}.`);
  L.push(`- **Documented, not yet in the corpus:** ${s.notInCorpus.map((e) => s.name(e.type)).join(", ") || "none"}.`, "");
  if (s.findings.length) {
    L.push("## Findings on the way", "");
    for (const f of s.findings) L.push(`- ${pathOf(f.url)}: ${f.what}`);
    L.push("");
  }
  L.push("## Page by page", "");
  for (const p of s.pages) {
    L.push(`### ${pathOf(p.url)}`, "", `${p.type}${p.title ? ` · ${p.title}` : ""} · [open](${p.url})`, "");
    L.push("| # | Region | Type | Confidence | Evidence | Kit | Reference |", "|---:|---|---|---|---|---|---|");
    for (const r of p.regions) {
      const a = r.answer;
      const ref = a ? bestRef(r.references?.refs, s.site) : null;
      const crop = r.crops?.[0] ? `![](${r.crops[0]})` : "";
      L.push(
        `| ${r.n} | ${crop} | ${a ? s.name(a.type) : "_not named_"} | ${a ? `${a.confidence}${a.by === "rule" && a.confidence !== "high" ? " (rule, to confirm)" : a.by === "agent" ? " (agent)" : ""}` : ""} | ${a ? a.evidence.join("; ").replace(/\|/g, "/") : ""} | ${r.references?.kit || (a ? "gap" : "")} | ${ref ? `[${ref.label}](${ref.url})` : ""} |`,
      );
    }
    L.push("");
  }
  return L.join("\n");
}

/* ---------- write html ---------------------------------------------------------- */

function html(s) {
  const c = s.counts;
  const refCell = (refs) => {
    const ref = bestRef(refs, s.site);
    if (!ref) return `<span class="muted">none</span>`;
    return `<a href="${esc(ref.url)}">${esc(ref.label)}</a>${ref.inCorpus === false && !ref.own ? ` <span class="note">not in corpus</span>` : ""}`;
  };
  const conf = (a) =>
    !a ? "" : `<span class="conf ${esc(a.confidence)}">${esc(a.confidence)}</span>${a.by === "agent" ? ` <span class="note">agent</span>` : a.confidence !== "high" ? ` <span class="note">to confirm</span>` : ""}`;
  const matrix = `<table class="matrix"><thead><tr><th scope="col">Type</th>${s.pageTypeList.map((t) => `<th scope="col"><span>${esc(t)}</span></th>`).join("")}</tr></thead><tbody>${s.rollup
    .map(
      (e) =>
        `<tr><th scope="row">${esc(s.name(e.type))}</th>${s.pageTypeList.map((t) => (e.pageTypes.has(t) ? `<td class="on" aria-label="seen">●</td>` : `<td aria-label="not seen"></td>`)).join("")}</tr>`,
    )
    .join("")}</tbody></table>`;

  const pagesHtml = s.pages
    .map(
      (p, i) => `<section class="page" id="p${i + 1}">
  <h3>${esc(pathOf(p.url))}</h3>
  <p class="muted">${esc(p.type)}${p.title ? ` · ${esc(p.title)}` : ""} · <a href="${esc(p.url)}">open the page</a></p>
  <div class="rows">${p.regions
    .map((r) => {
      const a = r.answer;
      return `<article class="row${a ? "" : " open"}">
    <div class="crop">${r.crops?.[0] ? `<a href="${esc(r.crops[0])}"><img src="${esc(r.crops[0])}" alt="Region ${r.n} of ${esc(pathOf(p.url))}" loading="lazy"></a>` : ""}</div>
    <div class="facts">
      <p class="type"><span class="n">${r.n}</span> ${a ? esc(s.name(a.type)) : "<em>not named</em>"} ${conf(a)}</p>
      ${a ? `<ul class="evidence">${a.evidence.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
      ${a ? `<p class="refs"><span>Kit</span> ${r.references?.kit ? esc(r.references.kit) : `<strong>gap</strong>`} <span>Reference</span> ${refCell(r.references?.refs)}</p>` : ""}
    </div>
  </article>`;
    })
    .join("\n")}</div>
</section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.title)}</title>
<style>
  :root { --bg:#f6f6f6; --surface:#fff; --text:#1f1f1f; --muted:#5c5c5c; --line:#d6d6d6; --chip:#ececec; --accent:#1f1f1f; color-scheme: light dark; }
  @media (prefers-color-scheme: dark) { :root { --bg:#141414; --surface:#1f1f1f; --text:#f2f2f2; --muted:#b0b0b0; --line:#3a3a3a; --chip:#2b2b2b; --accent:#f2f2f2; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 72rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
  h1 { font-size: 1.9rem; margin: 0 0 .5rem; } h2 { margin: 2.5rem 0 .75rem; font-size: 1.3rem; } h3 { margin: 0; font-size: 1.05rem; overflow-wrap: anywhere; }
  a { color: inherit; } .muted { color: var(--muted); }
  .lede { max-width: 62ch; }
  .stats { display: flex; flex-wrap: wrap; gap: .5rem; padding: 0; list-style: none; }
  .stats li { background: var(--surface); border: 1px solid var(--line); border-radius: .5rem; padding: .5rem .75rem; }
  .stats b { display: block; font-size: 1.3rem; }
  table { border-collapse: collapse; width: 100%; background: var(--surface); }
  th, td { text-align: left; padding: .45rem .6rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  .scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: .5rem; }
  .matrix th[scope=col] { vertical-align: bottom; font-weight: 600; font-size: .8rem; }
  .matrix th[scope=col] span { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; }
  .matrix td { text-align: center; } .matrix td.on { font-weight: 700; }
  .page { margin-top: 2rem; padding-top: 1rem; border-top: 2px solid var(--line); }
  .rows { display: grid; gap: .75rem; margin-top: .75rem; }
  .row { display: grid; grid-template-columns: minmax(0, 22rem) minmax(0, 1fr); gap: 1rem; background: var(--surface); border: 1px solid var(--line); border-radius: .5rem; padding: .75rem; }
  .row.open { border-style: dashed; }
  @media (max-width: 40rem) { .row { grid-template-columns: 1fr; } }
  .crop img { display: block; max-width: 100%; max-height: 16rem; object-fit: contain; object-position: left top; border: 1px solid var(--line); border-radius: .25rem; background: var(--bg); }
  .type { margin: 0 0 .35rem; font-weight: 600; }
  .n { display: inline-grid; place-items: center; min-width: 1.6rem; height: 1.6rem; margin-right: .35rem; border-radius: 1rem; background: var(--chip); font-size: .8rem; }
  .conf, .note { display: inline-block; padding: 0 .45rem; border-radius: 1rem; font-size: .75rem; font-weight: 500; border: 1px solid var(--line); }
  .conf.high { background: var(--accent); color: var(--bg); border-color: var(--accent); }
  .conf.low { border-style: dashed; }
  .evidence { margin: 0 0 .4rem; padding-left: 1.1rem; color: var(--muted); font-size: .9rem; }
  .refs { margin: 0; font-size: .9rem; } .refs span { color: var(--muted); margin-left: .5rem; } .refs span:first-child { margin-left: 0; }
  nav.toc ol { columns: 2 18rem; padding-left: 1.2rem; font-size: .9rem; }
  /* Groups: one hue each, muted, with the name always written beside it. */
  :root { --g-navigation:#5b7fa6; --g-content:#7a9a5b; --g-actions-and-forms:#b07a3c; --g-feedback:#a65b7a; --g-media:#6f6aa6; --g-other:#8c8c8c; --g-open:transparent; }
  .legend { display: flex; flex-wrap: wrap; gap: .25rem 1rem; padding: 0; margin: .5rem 0; list-style: none; font-size: .85rem; }
  .legend i, .bar i { display: inline-block; width: .8rem; height: .8rem; border-radius: .2rem; vertical-align: -.1rem; margin-right: .35rem; }
  .status { display: flex; height: 1.4rem; border-radius: .4rem; overflow: hidden; border: 1px solid var(--line); background: var(--surface); }
  .status span { display: block; height: 100%; }
  .status .high { background: var(--accent); } .status .confirm { background: var(--muted); } .status .agent { background: #8c8c8c; } .status .open { background: repeating-linear-gradient(45deg, var(--chip), var(--chip) 4px, var(--surface) 4px, var(--surface) 8px); }
  .freq { display: grid; grid-template-columns: minmax(8rem, 14rem) 1fr 3rem; gap: .25rem .75rem; align-items: center; font-size: .9rem; }
  .freq .track { height: .9rem; background: var(--chip); border-radius: .3rem; overflow: hidden; }
  .freq .fill { height: 100%; border-radius: .3rem; }
  .diagram { background: var(--surface); border: 1px solid var(--line); border-radius: .5rem; padding: 1rem; overflow-x: auto; }
  .anatomy { display: flex; gap: .75rem; overflow-x: auto; padding: .5rem 0 1rem; align-items: flex-start; }
  .skeleton { flex: none; width: 7.5rem; }
  .skeleton .frame { position: relative; width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: .3rem; }
  .skeleton .blk { position: absolute; left: 4%; right: 4%; border-radius: 2px; border: 1px solid var(--surface); }
  .skeleton .blk.open { background: repeating-linear-gradient(45deg, var(--chip), var(--chip) 3px, var(--surface) 3px, var(--surface) 6px); border-color: var(--line); }
  .skeleton p { margin: .3rem 0 0; font-size: .75rem; line-height: 1.3; overflow-wrap: anywhere; }
</style>
</head>
<body>
<main>
<h1>${esc(s.title)}</h1>
<p class="lede"><strong>Site:</strong> ${esc(s.siteLine)}</p>
<ul class="stats">
  <li><b>${c.pages}</b>pages</li><li><b>${c.total}</b>regions</li><li><b>${c.types}</b>types</li>
  <li><b>${s.recurring.length}</b>recurring</li><li><b>${c.toConfirm}</b>to confirm</li><li><b>${c.open}</b>not yet named</li>
</ul>

<h2>How far the naming has got</h2>
${(() => {
  const high = c.total - c.open - c.toConfirm - c.byAgent - c.unknown;
  const seg = [
    ["high", high, "named by rule"],
    ["confirm", c.toConfirm, "rule, to confirm"],
    ["agent", c.byAgent + c.unknown, "named by the agent"],
    ["open", c.open, "not yet named"],
  ];
  return `<div class="status" role="img" aria-label="${seg.map(([, n, l]) => `${n} ${l}`).join(", ")}">${seg.map(([k, n]) => (n ? `<span class="${k}" style="width:${((n / c.total) * 100).toFixed(2)}%"></span>` : "")).join("")}</div>
<ul class="legend">${seg.map(([k, n, l]) => `<li><i class="status-${k}" style="background:${k === "high" ? "var(--accent)" : k === "confirm" ? "var(--muted)" : k === "agent" ? "#8c8c8c" : "var(--chip)"}"></i>${n} ${l}</li>`).join("")}</ul>`;
})()}

<h2>What the site is built from</h2>
<p class="muted">Each type by the number of pages it appears on, coloured by group.</p>
<ul class="legend">${[...new Set(s.rollup.map((e) => s.group(e.type)))].map((g) => `<li><i style="background:var(--g-${g})"></i>${esc(g.replace(/-/g, " "))}</li>`).join("")}</ul>
<div class="freq">${(() => {
  const max = Math.max(1, ...s.rollup.map((e) => e.pages.size));
  return s.rollup
    .map(
      (e) =>
        `<span>${esc(s.name(e.type))}</span><div class="track" role="img" aria-label="${e.pages.size} of ${c.pages} pages"><div class="fill" style="width:${((e.pages.size / max) * 100).toFixed(1)}%;background:var(--g-${s.group(e.type)})"></div></div><span class="muted">${e.pages.size}p</span>`,
    )
    .join("");
})()}</div>

<h2>The component inventory</h2>
<div class="diagram"><pre class="mermaid">${esc(s.mindmap)}</pre></div>

<h2>Templates and what they share</h2>
<p class="muted">Each page type (with its page count) linked to the recurring components and sections on it.</p>
<div class="diagram"><pre class="mermaid">${esc(s.flow)}</pre></div>

<h2>Page anatomy</h2>
<p class="muted">Every page to scale, top to bottom, each region coloured by its group; hatched is not yet named. Fixed elements float over the page and are left out.</p>
<div class="anatomy">${s.anatomy
  .map((p) => {
    const H = 260;
    const k = H / Math.max(p.height, 1);
    return `<a class="skeleton" href="#p${s.pages.findIndex((x) => x.url === p.url) + 1}"><div class="frame" style="height:${H}px">${p.blocks
      .filter((b) => !b.fixed)
      .map(
        (b) =>
          `<span class="blk${b.group === "open" ? " open" : ""}" title="${esc(b.n + " " + (b.type ? s.name(b.type) : "not named"))}" style="top:${(b.y * k).toFixed(1)}px;height:${Math.max(2, b.h * k).toFixed(1)}px;${b.group === "open" ? "" : `background:var(--g-${b.group})`}"></span>`,
      )
      .join("")}</div><p>${esc(pathOf(p.url))}<br><span class="muted">${esc(p.type)}</span></p></a>`;
  })
  .join("")}</div>

<h2>Recurring: components and sections</h2>
<p class="muted">Seen on two or more page types.</p>
<div class="scroll"><table>
<thead><tr><th>Type</th><th>Regions</th><th>Pages</th><th>Page types</th><th>Kit</th><th>Reference</th></tr></thead>
<tbody>${s.recurring.map((e) => `<tr><td>${esc(s.name(e.type))}</td><td>${e.regions}</td><td>${e.pages.size}</td><td>${esc([...e.pageTypes].join(", "))}</td><td>${e.kit ? esc(e.kit) : "<strong>gap</strong>"}</td><td>${refCell(e.refs)}</td></tr>`).join("")}</tbody>
</table></div>

<h2>Where each type appears</h2>
<div class="scroll">${matrix}</div>

<h2>Gaps</h2>
<ul>
  <li><strong>No kit equivalent:</strong> ${esc(s.kitGaps.map((e) => s.name(e.type)).join(", ") || "none")}.</li>
  <li><strong>No documentation anywhere:</strong> ${esc(s.docGaps.map((e) => s.name(e.type)).join(", ") || "none")}.</li>
  <li><strong>Documented, not yet in the corpus:</strong> ${esc(s.notInCorpus.map((e) => s.name(e.type)).join(", ") || "none")}.</li>
</ul>
${s.findings.length ? `<h2>Findings on the way</h2><ul>${s.findings.map((f) => `<li>${esc(pathOf(f.url))}: ${esc(f.what)}</li>`).join("")}</ul>` : ""}

<h2>Page by page</h2>
<nav class="toc" aria-label="Pages"><ol>${s.pages.map((p, i) => `<li><a href="#p${i + 1}">${esc(pathOf(p.url))}</a> <span class="muted">${esc(p.type)}</span></li>`).join("")}</ol></nav>
${pagesHtml}
</main>
<script type="module">
  /* Diagrams render where the page can reach the CDN; offline, their source stays readable. */
  try {
    const { default: mermaid } = await import("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs");
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "neutral", securityLevel: "strict" });
    await mermaid.run({ querySelector: ".mermaid" });
  } catch {}
</script>
</body>
</html>
`;
}

/* ---------- run ----------------------------------------------------------------- */

function main() {
  const argv = process.argv.slice(2);
  const arg = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
  const dir = resolve(process.cwd(), arg("--dir") || ".");
  if (!existsSync(resolve(dir, "named.json")) || !existsSync(resolve(dir, "regions.json"))) {
    console.error("Usage: node tools/scorecard.mjs --dir <audit dir with named.json and regions.json> [--title <title>]");
    process.exit(1);
  }
  const s = build(dir, arg("--title") || "Site audit");
  writeFileSync(resolve(dir, "scorecard.md"), markdown(s));
  writeFileSync(resolve(dir, "scorecard.html"), html(s));
  /* The same, as data: what a Storybook (or anything else) renders the audit from. */
  writeFileSync(resolve(dir, "scorecard.json"), JSON.stringify(data(s), null, 2));
  console.log(`${s.counts.pages} pages, ${s.counts.total} regions, ${s.counts.types} types (${s.recurring.length} recurring). Site: ${s.siteLine}`);
  console.log(`Wrote ${resolve(dir, "scorecard.md")} and scorecard.html`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
