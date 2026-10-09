#!/usr/bin/env node
/**
 * Name regions — give every region from regions.mjs a type from a taxonomy,
 * with a confidence and the evidence for it.
 *
 * Two passes, so most of the work is checkable by anyone:
 *
 *   1. Rules. High-precision answers from what the splitter measured:
 *      landmarks, fixed elements, form fields, widgets (tabs, disclosures,
 *      carousels, tables, players), the first block of main, collections,
 *      and the shapes of a call to action and of running prose. Each rule
 *      answer carries its evidence and a confidence of high or medium.
 *   2. An agent. Everything the rules left open, and every medium rule
 *      answer to confirm, goes into requests.json: the region's crops, its
 *      summary and, where a rule had one, the proposed type. The agent (a
 *      person can do the same) answers in answers.json; --answers merges
 *      them, refusing any type the taxonomy does not have, any confidence
 *      that is not high, medium or low, and any answer without evidence.
 *
 *   node tools/name-regions.mjs --dir ../client-site/audit --taxonomy <taxonomy.json>
 *   node tools/name-regions.mjs --dir ../client-site/audit --taxonomy <taxonomy.json> --answers answers.json
 *
 * Reads <dir>/regions.json (the first width in it is the one named; the
 * others' crops travel along for the agent). Writes <dir>/naming/requests.json
 * and <dir>/named.json.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/* ---------- rules ------------------------------------------------------------ */

const has = (s, re) => re.test(String(s || ""));
const lower = (r) => [r.label, r.id, ...(r.classes || []), r.summary?.text].join(" ").toLowerCase();

/**
 * Rules in order; the first that answers wins. Each returns null or
 * { type, confidence, evidence: [...] }. `ctx` says where the region sits.
 */
export const RULES = [
  (r) => r.landmark === "banner" && { type: "site-header", confidence: "high", evidence: ["banner landmark (header outside article and section)"] },
  (r) => r.landmark === "contentinfo" && { type: "site-footer", confidence: "high", evidence: ["contentinfo landmark (footer outside article and section)"] },
  (r) => r.landmark === "search" && { type: "search", confidence: "high", evidence: ["search landmark"] },

  /* Fixed things float over the page: cookie notices, side tabs, launchers. */
  (r) =>
    r.kind === "fixed" && has(lower(r), /cookie|consent|privacy|gdpr/) && { type: "cookie-consent", confidence: "high", evidence: ["fixed over the page", "mentions cookies or consent"] },
  (r) =>
    r.kind === "fixed" &&
    r.box.w < 420 &&
    r.box.h < 420 && { type: "floating-action", confidence: "high", evidence: [`fixed, ${r.box.w}×${r.box.h}px at an edge of the viewport`, `${r.summary.links + r.summary.buttons.length} link or button`] },
  (r) =>
    (r.kind === "fixed" || r.kind === "sticky") &&
    r.box.y < 200 &&
    r.summary.links >= 4 && { type: "site-header", confidence: "medium", evidence: [`${r.kind} at the top`, `${r.summary.links} links`] },

  (r) => {
    if (r.landmark !== "navigation") return null;
    const l = lower(r);
    if (has(l, /breadcrumb/)) return { type: "breadcrumbs", confidence: "high", evidence: ["navigation labelled or classed breadcrumb"] };
    const labels = r.summary.linkLabels.join(" ");
    if (has(labels, /\b(next|previous|prev|older|newer)\b/i) && has(labels, /\b\d+\b/)) return { type: "pagination", confidence: "high", evidence: ["navigation of numbered links with next and previous"] };
    return r.box.y < 400
      ? { type: "primary-navigation", confidence: "medium", evidence: ["navigation landmark near the top", `${r.summary.links} links`] }
      : { type: "side-navigation", confidence: "low", evidence: ["navigation landmark below the header"] };
  },

  /* Widgets. */
  /* A carousel before tabs: slide dots are often a tablist. */
  (r) => r.summary.widgets?.carousel && { type: "carousel", confidence: "high", evidence: ["carousel library classes or aria-roledescription carousel"] },
  (r) => r.summary.widgets?.tabs > 0 && { type: "tabs", confidence: "high", evidence: ["a tablist with tabs"] },
  (r) => {
    const f = r.summary.fields || [];
    if (!f.length) return null;
    if (f.includes("password")) return { type: "login", confidence: "high", evidence: ["a password field"] };
    if (f.length === 1 && (f[0] === "search" || has(lower(r), /search/))) return { type: "search", confidence: "high", evidence: ["one search field"] };
    if (f.length >= 3) return { type: "form", confidence: "high", evidence: [`${f.length} fields: ${[...new Set(f)].join(", ")}`] };
    if (f.includes("email") || has(r.summary.buttons.join(" "), /subscribe|sign ?up|join/i))
      return { type: "newsletter-signup", confidence: "high", evidence: [`${f.length} field(s) including ${f.join(", ")}`, `button: ${r.summary.buttons.join(", ") || "none"}`] };
    return null;
  },
  (r) => r.summary.widgets?.disclosures >= 2 && !r.landmark && { type: "accordion", confidence: "medium", evidence: [`${r.summary.widgets.disclosures} expanding triggers (details or aria-expanded)`] },
  (r) => r.summary.widgets?.tables > 0 && { type: "table", confidence: "medium", evidence: ["a table element"] },
  (r) => r.summary.widgets?.audio > 0 && { type: "audio", confidence: "high", evidence: ["an audio element or podcast player"] },
  (r) => r.summary.widgets?.video > 0 && r.summary.words < 150 && { type: "video", confidence: "high", evidence: ["a video element or video embed", `${r.summary.words} words around it`] },
  (r) => r.summary.widgets?.map && { type: "map", confidence: "high", evidence: ["a map embed"] },

  /* The first block of main with the page's h1 is its hero. */
  (r, ctx) => {
    if (!ctx.firstBlock) return null;
    const h1 = r.summary.headings.find((h) => h.level === 1);
    const visual = r.summary.media > 0 || r.summary.backgroundImage;
    /* Without a picture it is a page header, not a hero: the rule below names it. */
    if (h1 && visual && r.summary.words < 160) return { type: "hero", confidence: "high", evidence: ["the first block of the page's content", `h1 "${h1.text}"`, "an image or background", `${r.summary.words} words`] };
    return null;
  },

  /* A page that opens with words, not a picture: its h1 and little else. */
  (r) => {
    const h1 = r.summary.headings.find((h) => h.level === 1);
    if (!h1 || r.summary.media > 0 || r.summary.backgroundImage || r.summary.words > 60 || r.summary.collection) return null;
    return { type: "page-header", confidence: "medium", evidence: [`h1 "${h1.text}"`, `${r.summary.words} words`, "no image or background"] };
  },

  /* A link or button standing alone: "View all podcasts", "Download". */
  (r) => {
    const s = r.summary;
    const actions = s.links + s.buttons.length;
    if (["a", "button"].includes(r.tag) && actions <= 1 && s.words <= 6 && !s.headings.length)
      return { type: "button", confidence: "medium", evidence: [`a lone <${r.tag}>`, `"${s.text}"`] };
    return null;
  },

  /* Collections. */
  (r) => {
    const c = r.summary.collection;
    if (!c || c.count < 3) return null;
    if (r.summary.widgets?.numbers >= 3 && r.summary.words < 80)
      return { type: "statistics", confidence: "medium", evidence: [`${c.count} like items`, `${r.summary.widgets.numbers} figures`, `${r.summary.words} words`] };
    if (r.summary.media >= 3 && r.summary.words < 25) return { type: "logo-strip", confidence: "medium", evidence: [`${c.count} like items`, `${r.summary.media} images`, `${r.summary.words} words`] };
    if (r.summary.media >= 3 && r.summary.links >= 3) return { type: "card-collection", confidence: "medium", evidence: [`${c.count} like items: ${c.item.slice(0, 60)}`, `${r.summary.media} images, ${r.summary.links} links`] };
    return null;
  },

  /* A short block with a heading and one to three actions. */
  (r) => {
    const s = r.summary;
    const actions = s.links + s.buttons.length;
    if (s.headings.length >= 1 && s.words <= 45 && actions >= 1 && actions <= 3 && !s.collection && !(s.fields || []).length)
      return { type: "call-to-action", confidence: "medium", evidence: [`heading "${s.headings[0].text}"`, `${s.words} words`, `${actions} action(s): ${[...s.linkLabels, ...s.buttons].slice(0, 3).join(", ")}`] };
    return null;
  },

  /* Running prose. */
  (r) =>
    r.summary.words > 250 &&
    !r.summary.collection && { type: "article-body", confidence: "medium", evidence: [`${r.summary.words} words`, `${r.summary.headings.length} headings`, "no repeated items"] },
];

export function applyRules(region, ctx) {
  for (const rule of RULES) {
    const answer = rule(region, ctx);
    if (answer) return { ...answer, by: "rule" };
  }
  return null;
}

/* ---------- the run ----------------------------------------------------------- */

const arg = (argv, name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);

/* What the agent sees about a region, in a few lines. */
function brief(r) {
  const s = r.summary;
  return [
    `${r.kind}${r.landmark ? ` (${r.landmark})` : ""}, <${r.tag}>, ${r.box.w}×${r.box.h}px at y=${r.box.y}`,
    s.headings.length ? `headings: ${s.headings.map((h) => `h${h.level ?? "?"} "${h.text}"`).join("; ")}` : "no headings",
    `${s.words} words; ${s.links} links${s.linkLabels.length ? ` (${s.linkLabels.slice(0, 6).join(" | ")})` : ""}; buttons: ${s.buttons.join(" | ") || "none"}`,
    `fields: ${(s.fields || []).join(", ") || "none"}; media: ${s.media}${s.backgroundImage ? " + background image" : ""}`,
    s.collection ? `collection: ${s.collection.count} like items, e.g. "${s.collection.sample}"` : "no repeated items",
    `widgets: ${Object.entries(s.widgets || {})
      .filter(([, v]) => v)
      .map(([k, v]) => (v === true ? k : `${k} ${v}`))
      .join(", ") || "none"}`,
    `text: "${s.text}"`,
    r.classes?.length ? `classes: ${r.classes.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function main() {
  const argv = process.argv.slice(2);
  const dir = resolve(process.cwd(), arg(argv, "--dir") || ".");
  const taxPath = arg(argv, "--taxonomy");
  if (!taxPath || !existsSync(resolve(dir, "regions.json"))) {
    console.error("Usage: node tools/name-regions.mjs --dir <audit dir with regions.json> --taxonomy <taxonomy.json> [--answers answers.json]");
    process.exit(1);
  }
  const taxonomy = JSON.parse(readFileSync(resolve(process.cwd(), taxPath), "utf8"));
  const types = new Map(taxonomy.types.map((t) => [t.id, t]));
  const data = JSON.parse(readFileSync(resolve(dir, "regions.json"), "utf8"));
  const [primary, ...others] = data.widths;

  /* Rule pass. */
  /* A region's content key: its page, kind and opening words. Region numbers
     change whenever the splitter improves; the key does not, so an answer
     given to a region finds it again after a re-split. */
  const norm = (t) => String(t || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
  const keyOf = (page, r) => `${page}|${r.kind}|${norm(r.summary?.headings?.[0]?.text || r.summary?.text)}`;
  /* The same region at another width: same kind and opening words, never just the same number. */
  const twin = (list, r) => list?.find((o) => o.kind === r.kind && norm(o.summary?.headings?.[0]?.text || o.summary?.text) === norm(r.summary?.headings?.[0]?.text || r.summary?.text));

  /* Agent answers from the last run, by key, to carry onto the new regions. */
  const priorPath = resolve(dir, "named.json");
  const prior = new Map();
  if (existsSync(priorPath)) {
    for (const r of JSON.parse(readFileSync(priorPath, "utf8")).regions || []) if (r.answer?.by === "agent" && r.key) prior.set(r.key, r);
  }
  /* Same words are not enough: a row merged from three boxes opens with the
     first box's heading, and a band split out of a tall block with the
     block's. An answer carries only to a region of about the same size. */
  const near = (a, b, px, share) => Math.abs(a - b) <= Math.max(px, share * Math.max(a, b));
  const sameSize = (was, now) => !was || (near(was.w, now.w, 24, 0.15) && near(was.h, now.h, 24, 0.2));

  const named = [];
  let carried = 0;
  for (const page of data.pages) {
    const at = page.widths[primary];
    if (!at?.regions) continue;
    const firstBlock = at.regions.find((r) => r.kind === "section" || r.kind === "block");
    for (const r of at.regions) {
      const id = `${page.slug}#${r.n}`;
      const key = keyOf(page.slug, r);
      const crops = [r.crop, ...others.map((w) => twin(page.widths[w]?.regions, r)?.crop)].filter(Boolean);
      let answer = applyRules(r, { firstBlock: r === firstBlock });
      if (prior.has(key) && sameSize(prior.get(key).box, r.box)) {
        answer = { ...prior.get(key).answer, carried: true };
        carried++;
      }
      named.push({ id, key, url: page.url, page: page.slug, n: r.n, kind: r.kind, box: r.box, crops, brief: brief(r), answer });
    }
  }

  /* Merge an agent's answers, checked against the taxonomy. */
  const answersPath = arg(argv, "--answers");
  const rejected = [];
  if (answersPath) {
    const answers = JSON.parse(readFileSync(resolve(process.cwd(), answersPath), "utf8"));
    const byId = new Map(named.map((n) => [n.id, n]));
    for (const a of answers) {
      const n = byId.get(a.id);
      const why =
        !n ? "no such region" : a.type !== "unknown" && !types.has(a.type) ? `type "${a.type}" is not in the taxonomy` : !["high", "medium", "low"].includes(a.confidence) ? `confidence "${a.confidence}"` : !a.evidence?.length ? "no evidence" : null;
      if (why) {
        rejected.push({ id: a.id, why });
        continue;
      }
      const prior = n.answer;
      n.answer = { type: a.type, confidence: a.confidence, evidence: a.evidence, variant: a.variant || null, notes: a.notes || null, by: "agent", ...(prior ? { rule: { type: prior.type, confidence: prior.confidence }, agrees: prior.type === a.type } : {}) };
    }
  }

  /* What still needs the agent: nothing named, or a medium rule answer not yet confirmed. */
  const requests = named
    .filter((n) => !n.answer || (n.answer.by === "rule" && n.answer.confidence !== "high"))
    .map((n) => ({ id: n.id, url: n.url, crops: n.crops, brief: n.brief, proposed: n.answer ? { type: n.answer.type, evidence: n.answer.evidence } : null }));

  mkdirSync(resolve(dir, "naming"), { recursive: true });
  writeFileSync(
    resolve(dir, "naming", "requests.json"),
    JSON.stringify(
      {
        _readme:
          "Regions to name, or rule answers to confirm. Answer each with { id, type, confidence, evidence, variant?, notes? }: type is a taxonomy id or \"unknown\", confidence high | medium | low, evidence a list of what the crop or brief shows. Save as an array and merge with --answers.",
        types: taxonomy.types.map((t) => ({ id: t.id, name: t.name, signals: t.signals })),
        requests,
      },
      null,
      2,
    ),
  );

  const final = named.map(({ brief: _b, ...n }) => ({ ...n, references: n.answer && types.get(n.answer.type) ? { refs: types.get(n.answer.type).refs, kit: types.get(n.answer.type).kit } : null }));
  writeFileSync(resolve(dir, "named.json"), JSON.stringify({ generatedAt: new Date().toISOString(), width: primary, taxonomy: { version: taxonomy.version, path: taxPath }, regions: final }, null, 2));

  const by = (k) => named.filter((n) => n.answer?.by === k).length;
  const high = named.filter((n) => n.answer?.by === "rule" && n.answer.confidence === "high").length;
  console.log(`${named.length} regions on ${data.pages.length} pages at ${primary}`);
  console.log(`  rules: ${by("rule")} (${high} high, ${by("rule") - high} to confirm)   agent: ${by("agent")}${carried ? ` (${carried} carried from the last run)` : ""}   open: ${named.filter((n) => !n.answer).length}`);
  if (rejected.length) console.log(`  REJECTED answers:\n    ${rejected.map((r) => `${r.id}: ${r.why}`).join("\n    ")}`);
  console.log(`  ${requests.length} requests in ${resolve(dir, "naming", "requests.json")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
