#!/usr/bin/env node
/**
 * Regions — split each page of a site into the blocks an audit names.
 *
 * Capture measures a page; this cuts it up. Every page becomes a list of
 * regions, each with a box, a crop and a short text summary, which is what
 * a person or an agent needs to say "that is a hero" or "that is a card
 * collection" and to point at the evidence.
 *
 * The splitting is deterministic, so a run can be repeated and checked:
 *
 *   1. Landmarks: banner (header), navigation, main, complementary (aside),
 *      contentinfo (footer), search, and labelled regions, at the top level.
 *   2. Fixed and sticky elements outside those: chat launchers, side tabs,
 *      cookie notices, back-to-top buttons.
 *   3. Inside main (or the body, when a page has no main): each block, after
 *      unwrapping the single-child wrappers page builders nest everything
 *      in. A block taller than a viewport with several headed children is
 *      split into those children.
 *   4. Within each region, three or more siblings with the same structure
 *      are a collection: noted with their count, not split further.
 *
 *   node tools/regions.mjs --urls urls.txt --out ../client-site/audit
 *   node tools/regions.mjs --url https://example.com/ --out ./audit
 *     --widths 1280,360    the widths to split at (default 1280 and 360)
 *     --wait 1500          ms to let a page settle after load
 *
 * Writes <out>/regions.json and <out>/regions/<page>/<nn>@<width>.png. Like
 * capture.mjs, use --out for any client's site: audits/ is part of the
 * public kit.
 */

import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { wake } from "./lib/wake.mjs";

/* ---------- the splitter, run inside the page ---------------------------- */

/** Returns the page's regions. Self-contained: it is serialised into the page. */
export function splitRegions() {
  const MIN_H = 24;
  /* Space between sections is not a gap; anything taller than this may be content. */
  const GAP = 80;
  const doc = document.documentElement;

  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };
  /* The words a reader sees: innerText leaves out scripts, styles and hidden text. */
  const text = (el, n = 80) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, n);
  const visibleChildren = (el) => [...el.children].filter((c) => visible(c) && !["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"].includes(c.tagName));

  /* The landmark an element is, by element or role. */
  const landmarkOf = (el) => {
    const role = el.getAttribute("role");
    if (role && ["banner", "navigation", "main", "complementary", "contentinfo", "search", "region", "form"].includes(role)) return role;
    const tag = el.tagName;
    if (tag === "MAIN") return "main";
    if (tag === "NAV") return "navigation";
    if (tag === "ASIDE") return "complementary";
    if (tag === "SEARCH") return "search";
    /* header and footer are landmarks only outside article/section/main. */
    if ((tag === "HEADER" || tag === "FOOTER") && !el.parentElement.closest("article, aside, main, nav, section")) return tag === "HEADER" ? "banner" : "contentinfo";
    if (tag === "SECTION" && (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby"))) return "region";
    return null;
  };

  /* A structural fingerprint: tag, then its children's tags, two levels. */
  const skeleton = (el, depth = 2) => {
    const kids = visibleChildren(el);
    if (!depth || !kids.length) return el.tagName.toLowerCase();
    return `${el.tagName.toLowerCase()}(${kids.map((k) => skeleton(k, depth - 1)).join(",")})`;
  };

  /* Three or more like siblings anywhere inside: the largest such set. */
  const collectionIn = (root) => {
    let best = null;
    for (const parent of [root, ...root.querySelectorAll("*")]) {
      const kids = visibleChildren(parent);
      if (kids.length < 3) continue;
      const counts = new Map();
      for (const k of kids) {
        if (k.getBoundingClientRect().height < MIN_H) continue;
        const s = skeleton(k);
        counts.set(s, (counts.get(s) || 0) + 1);
      }
      for (const [sig, n] of counts) {
        if (n >= 3 && (!best || n > best.count)) {
          const item = kids.find((k) => skeleton(k) === sig);
          best = { count: n, item: sig.length > 160 ? `${sig.slice(0, 157)}…` : sig, sample: text(item, 60) };
        }
      }
    }
    return best;
  };

  /* What a region contains, in words an agent can quote as evidence. */
  const summarise = (el) => {
    const headings = [...el.querySelectorAll("h1,h2,h3,h4,h5,h6,[role=heading]")]
      .filter(visible)
      .slice(0, 6)
      .map((h) => ({ level: Number(h.tagName[1]) || Number(h.getAttribute("aria-level")) || null, text: text(h, 90) }));
    const links = [...el.querySelectorAll("a[href]")].filter(visible);
    const buttons = [...el.querySelectorAll("button, [role=button], input[type=submit], input[type=button]")].filter(visible);
    const fields = [...el.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea")].filter(visible);
    const images = [...el.querySelectorAll("img, svg, picture, video, iframe")].filter(visible);
    const bg = getComputedStyle(el).backgroundImage;
    const all = [el, ...el.querySelectorAll("*")];
    const classText = all
      .slice(0, 400)
      .map((n) => (typeof n.className === "string" ? n.className : ""))
      .join(" ")
      .toLowerCase();
    /* Interface signals: the parts that make a region a widget rather than prose. */
    const widgets = {
      disclosures: el.querySelectorAll("details, [aria-expanded]").length,
      tabs: el.querySelectorAll("[role=tablist], [role=tab]").length,
      tables: el.querySelectorAll("table").length,
      dialogs: el.querySelectorAll("dialog, [role=dialog], [aria-modal=true]").length,
      lists: el.querySelectorAll("ul, ol").length,
      carousel:
        el.querySelectorAll("[aria-roledescription=carousel], [aria-roledescription=slide]").length > 0 ||
        /\b(swiper|slick|carousel|splide|owl-|flickity|glide)/.test(classText),
      video: el.querySelectorAll("video, iframe[src*='youtube'], iframe[src*='vimeo']").length,
      audio: el.querySelectorAll("audio, iframe[src*='spotify'], iframe[src*='buzzsprout'], iframe[src*='libsyn'], iframe[src*='podbean']").length,
      map: el.querySelectorAll("iframe[src*='maps'], .leaflet-container, .mapboxgl-map, .gm-style").length > 0,
      /* Embedded documents the page can't see into (a form, a booking widget). */
      embeds: [...el.querySelectorAll("iframe")].filter((f) => !/youtube|vimeo|maps|spotify|buzzsprout|libsyn|podbean/.test(f.src || f.dataset.lazySrc || "")).length,
      numbers: (el.innerText || "").match(/\b\d[\d,.]*\s?(\+|%|x)?(?=\s)/g)?.length || 0,
    };
    return {
      widgets,
      text: text(el, 240),
      headings,
      links: links.length,
      linkLabels: [...new Set(links.map((a) => text(a, 40)).filter(Boolean))].slice(0, 10),
      buttons: [...new Set(buttons.map((b) => text(b, 40) || b.getAttribute("aria-label") || b.value || "").filter(Boolean))].slice(0, 8),
      fields: fields.map((f) => f.getAttribute("type") || f.tagName.toLowerCase()).slice(0, 12),
      media: images.length,
      backgroundImage: bg && bg !== "none",
      words: (el.innerText || "").trim().split(/\s+/).filter(Boolean).length,
      collection: collectionIn(el),
    };
  };

  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    classes: [...el.classList].slice(0, 8),
    label: el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent?.trim()) || null,
  });

  /* One summary for a run of elements (a stretch of prose), added up. */
  const summariseRun = (els) => {
    const parts = els.map(summarise);
    const sum = (k) => parts.reduce((n, p) => n + p[k], 0);
    const widgets = {};
    for (const p of parts) for (const [k, v] of Object.entries(p.widgets)) widgets[k] = typeof v === "boolean" ? widgets[k] || v : (widgets[k] || 0) + v;
    return {
      widgets,
      text: parts.map((p) => p.text).join(" ").slice(0, 240),
      headings: parts.flatMap((p) => p.headings).slice(0, 6),
      links: sum("links"),
      linkLabels: [...new Set(parts.flatMap((p) => p.linkLabels))].slice(0, 10),
      buttons: [...new Set(parts.flatMap((p) => p.buttons))].slice(0, 8),
      fields: parts.flatMap((p) => p.fields).slice(0, 12),
      media: sum("media"),
      backgroundImage: parts.some((p) => p.backgroundImage),
      words: sum("words"),
      collection: null,
    };
  };
  const unionBox = (els) => {
    const bs = els.map(box);
    const x = Math.min(...bs.map((b) => b.x));
    const y = Math.min(...bs.map((b) => b.y));
    return { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) - x, h: Math.max(...bs.map((b) => b.y + b.h)) - y };
  };

  const regions = [];
  const taken = new Set();
  /* A region is one element, or a run of sibling elements read as one (prose). */
  const add = (target, kind, landmark) => {
    const els = Array.isArray(target) ? target : [target];
    if (els.some((e) => taken.has(e))) return;
    const b = els.length > 1 ? unionBox(els) : box(els[0]);
    if (b.h < MIN_H || b.w < 2) return;
    els.forEach((e) => taken.add(e));
    const head = describe(els[0]);
    /* A run is prose, or a collection: like siblings (a listing's items). */
    const leadIn = Array.isArray(target) && (target.leadIn || target.leadOut);
    const asCollection = !leadIn && els.length > 1 && !els.every(isProse);
    const summary = els.length > 1 ? summariseRun(els) : summarise(els[0]);
    if (asCollection) summary.collection = { count: els.length, item: skeleton(els[0]).slice(0, 160), sample: text(els[0], 60) };
    if (leadIn) {
      /* The collection is the introduced part's: its run, or the largest set inside it. */
      const body = els.slice(target.leadIn || 0, target.leadOut ? -1 : undefined);
      summary.collection = target.collectionOf
        ? { count: target.collectionOf, item: skeleton(body[0]).slice(0, 160), sample: text(body[0], 60) }
        : body.map(summarise).map((x) => x.collection).filter(Boolean).sort((a, b) => b.count - a.count)[0] || null;
    }
    regions.push({
      kind,
      landmark,
      box: b,
      ...head,
      ...(els.length > 1 ? { tag: leadIn ? "section" : asCollection ? "collection" : "prose", run: els.length } : {}),
      summary,
      _el: els[0],
      _els: els,
    });
  };
  const inside = (el) => [...taken].some((t) => t !== el && t.contains(el));

  /* 1. Top-level landmarks, in document order. */
  const landmarks = [...document.querySelectorAll("header, footer, nav, main, aside, search, section[aria-label], section[aria-labelledby], [role]")]
    .filter((el) => visible(el) && landmarkOf(el))
    .filter((el, _, all) => !all.some((o) => o !== el && o.contains(el) && landmarkOf(o) !== "main"));
  const main = landmarks.find((el) => landmarkOf(el) === "main") || null;

  /* 3 (before 2, so blocks keep document order): the blocks of main, or of
     the body around the other landmarks. */
  const unwrap = (el) => {
    let cur = el;
    for (;;) {
      const kids = visibleChildren(cur);
      if (kids.length !== 1) return cur;
      const only = kids[0];
      const a = cur.getBoundingClientRect();
      const b = only.getBoundingClientRect();
      if (b.height < a.height * 0.9) return cur;
      cur = only;
    }
  };
  /* A block holds several sections when two or more of its children open
     with their own top-level heading (h1 or h2). Cards open with h3, and a
     section's own header sits over a body without one, so neither splits;
     and the rule does not depend on the viewport, so 1280 and 360 agree. */
  const opensSection = (el) => {
    const h = el.querySelector("h1,h2,h3,h4,h5,h6,[role=heading]");
    if (!h || !visible(h)) return false;
    const level = Number(h.tagName[1]) || Number(h.getAttribute("aria-level")) || 3;
    return level <= 2 && el.getBoundingClientRect().height >= MIN_H * 2;
  };
  /* A band: a full-width child with a background of its own (a colour the
     parent does not have, or an image). Two or more in one block are
     separate sections stacked in a wrapper, whatever their headings say. */
  const paint = (el) => {
    const cs = getComputedStyle(el);
    const img = cs.backgroundImage && cs.backgroundImage !== "none";
    const color = cs.backgroundColor;
    const clear = !color || color === "transparent" || /rgba\([^)]*,\s*0\)$/.test(color);
    return { img, color: clear ? null : color };
  };
  /* The paint a box shows: its own, or that of a child (two levels down)
     that covers most of it, where themes often put a band's photo. */
  const paintOf = (k) => {
    const kb = k.getBoundingClientRect();
    const covering = (el) => {
      const r = el.getBoundingClientRect();
      return r.width * r.height >= kb.width * kb.height * 0.8;
    };
    const layers = [k, ...[...k.children].filter(covering), ...[...k.children].flatMap((c) => [...c.children]).filter(covering)];
    for (const el of layers) {
      const p = paint(el);
      if (p.img || p.color) return p;
    }
    return { img: false, color: null };
  };
  const isBand = (k, parent) => {
    const kb = k.getBoundingClientRect();
    const pb = parent.getBoundingClientRect();
    if (kb.width < pb.width * 0.9 || kb.height < 120) return false;
    const p = paintOf(k);
    return p.img || (Boolean(p.color) && p.color !== paint(parent).color);
  };
  /* A panel: a child with a background of its own, a heading and an action
     (a "Looking for the right starting point?" box set inside a section's
     prose). It is a region of its own; the prose around it is another. */
  const isPanel = (k, parent) => {
    const p = paintOf(k);
    if (!(p.img || (p.color && p.color !== paint(parent).color))) return false;
    if (k.getBoundingClientRect().height < 80) return false;
    const heading = k.querySelector("h1,h2,h3,h4,h5,h6,[role=heading]");
    const action = k.querySelector("a[href], button");
    return Boolean(heading && action);
  };
  const hasPanel = (el) => {
    const kids = visibleChildren(el);
    if (kids.length < 2) return false;
    const panels = kids.filter((k) => isPanel(k, el));
    if (!panels.length || panels.length === kids.length) return false;
    const rest = kids.filter((k) => !panels.includes(k));
    const words = rest.reduce((n, k) => n + (k.innerText || "").trim().split(/\s+/).filter(Boolean).length, 0);
    return words >= 25;
  };
  const blocksOf = (container) => {
    const out = [];
    for (const child of visibleChildren(unwrap(container))) {
      const el = unwrap(child);
      const role = landmarkOf(el);
      if (role && role !== "region" && el !== container) continue;
      const kids = visibleChildren(el);
      if (kids.filter(opensSection).length >= 2 || kids.filter((k) => isBand(k, el)).length >= 2 || hasPanel(unwrap(el))) out.push(...blocksOf(el));
      else out.push(el);
    }
    return out;
  };

  /* Landmarks taken whole: everything outside main. Inside main, a labelled
     region is a block of the page like any other. */
  for (const lm of landmarks) {
    const role = landmarkOf(lm);
    if (role === "main" || (main && main.contains(lm))) continue;
    add(lm, "landmark", role);
  }
  /* Paragraphs, lists and subheadings set straight into the content are one
     stretch of prose, not a region each: consecutive ones become a run. An
     h1 is a page title and stands alone; an h2 joins the prose it heads. */
  const PROSE = new Set(["P", "UL", "OL", "LI", "DL", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "HR"]);
  const isProse = (el) => PROSE.has(el.tagName) && !el.querySelector("img, video, iframe, form, table");
  /* The container a block really sits in, past single-child wrappers (a
     one-item list around a question is still in the same stretch of text). */
  const outerOf = (el) => {
    let cur = el;
    while (cur.parentElement && visibleChildren(cur.parentElement).length === 1) cur = cur.parentElement;
    return cur;
  };
  const containerOf = (el) => outerOf(el).parentElement;
  const withRuns = (blocks) => {
    const out = [];
    let run = [];
    const flush = () => {
      if (run.length > 1) out.push(run);
      else if (run.length) out.push(run[0]);
      run = [];
    };
    for (const b of blocks) {
      if (isProse(b) && (!run.length || containerOf(run[run.length - 1]) === containerOf(b))) run.push(b);
      else {
        flush();
        if (isProse(b)) run.push(b);
        else out.push(b);
      }
    }
    flush();
    /* Then three or more like blocks in a row (a listing's items set
       straight into the content) become one collection. */
    const grouped = [];
    let group = [];
    const close = () => {
      if (group.length >= 3) grouped.push(group);
      else grouped.push(...group);
      group = [];
    };
    for (const b of out) {
      /* Alike by the classes a theme gives one kind of item (a card with an
         image and one without are still the same card), or, without
         classes, by structure. */
      const kindOf = (el) => (el.classList.length ? `${el.tagName}.${[...el.classList].sort().join(".")}` : skeleton(el));
      /* Blocks that each open a section of their own (an h1 or h2) are
         sections in a row, not a listing's items, however alike their classes. */
      const listable = (el) => {
        if (!opensSection(el)) return true;
        /* A card in a grid can have an h2 too: a section also spans its
           container. Measured on the box that sits in the container, not the
           block unwrapped from it: a full-width band around a narrower inner
           column is a section, and its column is not a card. */
        const o = outerOf(el);
        const c = o.parentElement;
        return !c || o.getBoundingClientRect().width < c.getBoundingClientRect().width * 0.8;
      };
      const like = !Array.isArray(b) && group.length && listable(b) && listable(group[0]) && kindOf(group[0]) === kindOf(b) && containerOf(group[0]) === containerOf(b);
      if (like) group.push(b);
      else {
        close();
        if (Array.isArray(b)) grouped.push(b);
        else group.push(b);
      }
    }
    close();

    /* A lead-in (a heading, perhaps a short intro, nothing to click or see)
       belongs to what it introduces when that is cards, a collection,
       pictures or a set of links: one section, not two. */
    const sumOf = (b) => (Array.isArray(b) ? summariseRun(b) : summarise(b));
    const isLeadIn = (b) => {
      if (Array.isArray(b) && b.length > 3) return false;
      const s = sumOf(b);
      return s.words > 0 && s.words <= 70 && !s.links && !s.media && !s.fields.length && !s.collection;
    };
    const introduces = (b) => {
      if (Array.isArray(b)) return !b.every(isProse);
      const s = summarise(b);
      return Boolean(s.collection) || s.media > 0 || s.links >= 3;
    };
    const merged = [];
    for (let i = 0; i < grouped.length; i++) {
      const b = grouped[i];
      const next = grouped[i + 1];
      if (next && isLeadIn(b) && introduces(next) && containerOf(Array.isArray(b) ? b[0] : b) === containerOf(Array.isArray(next) ? next[0] : next)) {
        const run = [...(Array.isArray(b) ? b : [b]), ...(Array.isArray(next) ? next : [next])];
        run.leadIn = Array.isArray(b) ? b.length : 1;
        run.collectionOf = Array.isArray(next) && !next.every(isProse) ? next.length : 0;
        merged.push(run);
        i++;
      } else merged.push(b);
    }

    /* A lead-out: a lone action after a section ("View all experts") is that
       section's footer, not a region of its own. */
    const isLeadOut = (b) => {
      if (Array.isArray(b)) return false;
      const s = summarise(b);
      return s.words <= 6 && s.links + s.buttons.length <= 1 && s.links + s.buttons.length >= 1 && !s.headings.length && !s.media && !s.fields.length;
    };
    const out2 = [];
    for (const b of merged) {
      const prev = out2[out2.length - 1];
      const prevEl = Array.isArray(prev) ? prev[prev.length - 1] : prev;
      if (prev && isLeadOut(b) && containerOf(prevEl) === containerOf(b) && !(Array.isArray(prev) && prev.every(isProse))) {
        const run = [...(Array.isArray(prev) ? prev : [prev]), b];
        run.leadIn = Array.isArray(prev) ? prev.leadIn || 0 : 0;
        /* A listing's run keeps its count; a lead-in section keeps what it had. */
        run.collectionOf = Array.isArray(prev) ? (prev.leadIn || prev.leadOut ? prev.collectionOf || 0 : prev.length) : 0;
        run.leadOut = true;
        out2[out2.length - 1] = run;
      } else out2.push(b);
    }
    return out2;
  };

  const body = main || document.body;
  for (const block of withRuns(blocksOf(body))) {
    const first = Array.isArray(block) ? block[0] : block;
    if (inside(first) || (!Array.isArray(block) && [...taken].some((t) => block.contains(t)))) continue;
    add(block, main ? "section" : "block", Array.isArray(block) ? null : landmarkOf(block));
  }

  /* Outside main and the landmarks: a page hero set above main, a band
     between main and the footer. Walk down from the body, through anything
     that holds main or a region already taken, and keep what holds neither. */
  if (main) {
    const walk = (el) => {
      for (const child of visibleChildren(el)) {
        const c = unwrap(child);
        if (c === main || taken.has(c) || taken.has(child)) continue;
        /* Fixed and sticky things float over the page: step 2 takes them. */
        if (["fixed", "sticky"].includes(getComputedStyle(c).position) || ["fixed", "sticky"].includes(getComputedStyle(child).position)) continue;
        const holds = c.contains(main) || [...taken].some((t) => c.contains(t));
        if (holds) walk(c);
        else if (!inside(c)) add(c, "block", landmarkOf(c));
      }
    };
    walk(document.body);
  }

  /* 2. Fixed and sticky things not already inside a region. */
  for (const el of document.querySelectorAll("body *")) {
    const pos = getComputedStyle(el).position;
    if ((pos === "fixed" || pos === "sticky") && visible(el) && !inside(el) && !taken.has(el)) {
      const parentFixed = el.parentElement && el.parentElement.closest("*") && [...taken].includes(el.parentElement);
      if (!parentFixed) add(el, pos, landmarkOf(el));
    }
  }

  regions.sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);

  /* The page's opening: when the region holding the h1 is words only (a title
     bar), the short word-only regions directly under it (a headline band, an
     introduction) are the same opening, whatever containers they sit in. A
     hero with a picture opens a page on its own and is left as it is. */
  const flows = regions.filter((r) => r.kind !== "fixed" && r.kind !== "sticky" && r.kind !== "landmark");
  const start = flows.find((r) => r.summary.headings.some((h) => h.level === 1));
  const wordsOnly = (r, most) =>
    !r.summary.media && !r.summary.backgroundImage && !r.summary.collection && !r.summary.fields.length && r.summary.links + r.summary.buttons.length <= 1 && r.summary.words <= most;
  if (start && wordsOnly(start, 40)) {
    const joined = [start];
    for (const r of flows.slice(flows.indexOf(start) + 1)) {
      const last = joined[joined.length - 1];
      const gap = r.box.y - (last.box.y + last.box.h);
      /* Up to three in all, touching, words only and nothing to press: a band with a link is a call to action, not an introduction. */
      const actions = r.summary.links + r.summary.buttons.length;
      if (joined.length >= 3 || gap > 48 || gap < -8 || r.box.h > 450 || actions > 0 || !wordsOnly(r, 90) || r.summary.headings.some((h) => h.level === 1)) break;
      joined.push(r);
    }
    if (joined.length > 1) {
      const els = joined.flatMap((r) => r._els || [r._el]);
      const merged = { ...start, kind: "section", tag: "opening", run: els.length, box: unionBox(els), summary: summariseRun(els), _el: els[0], _els: els };
      for (const r of joined) regions.splice(regions.indexOf(r), 1);
      regions.push(merged);
      regions.sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
    }
  }

  /* Two regions in one place are one: a landmark lying mostly inside another
     (a theme's navigation bar positioned over its header) folds into it, and
     regions side by side in one row (three asides above the footer) are one
     row, read as a collection. A region is a horizontal slice of the page. */
  const merge = (keep, rs, tag) => {
    const els = rs.flatMap((r) => r._els || [r._el]);
    const merged = { ...keep, tag: tag ?? keep.tag, run: els.length, box: unionBox(els), summary: summariseRun(els), _el: els[0], _els: els };
    if (tag === "row") merged.summary.collection = { count: rs.length, item: skeleton(rs[0]._el).slice(0, 160), sample: text(rs[0]._el, 60) };
    for (const r of rs) regions.splice(regions.indexOf(r), 1);
    regions.push(merged);
    regions.sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
  };
  const floats = (r) => r.kind === "fixed" || r.kind === "sticky";
  const area = (b) => b.w * b.h;
  const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  for (let folded = true; folded; ) {
    folded = false;
    /* Landmarks only: a hero under a see-through header holds the header's
       box too, and is still a different thing from it. */
    for (const a of regions.filter((r) => r.kind === "landmark")) {
      const b = regions.find((r) => r !== a && r.kind === "landmark" && area(r.box) <= area(a.box) && overlap(a.box, r.box) >= area(r.box) * 0.8);
      if (b) {
        merge(a, [a, b]);
        folded = true;
        break;
      }
    }
  }
  for (let joined = true; joined; ) {
    joined = false;
    for (const a of regions.filter((r) => !floats(r))) {
      const row = regions.filter(
        (r) =>
          !floats(r) &&
          Math.abs(r.box.y - a.box.y) <= 12 &&
          Math.min(r.box.h, a.box.h) >= Math.max(r.box.h, a.box.h) * 0.7,
      );
      const apart = row.every((r, i) => row.every((s, j) => i === j || r.box.x + r.box.w <= s.box.x + 4 || s.box.x + s.box.w <= r.box.x + 4));
      if (row.length >= 2 && apart) {
        row.sort((r, s) => r.box.x - s.box.x);
        merge(row[0], row, "row");
        joined = true;
        break;
      }
    }
  }

  /* How much of the page's height the regions cover, and where they do not:
     a gap is content no region holds, and a split that loses content is a
     split to fix. Fixed things are left out; they float over the page. */
  const spans = regions
    .filter((r) => r.kind !== "fixed")
    .map((r) => [r.box.y, r.box.y + r.box.h])
    .sort((a, b) => a[0] - b[0]);
  const gaps = [];
  let covered = 0;
  let end = 0;
  for (const [s, e] of spans) {
    if (s > end + GAP) gaps.push({ y: end, h: s - end });
    if (e > end) {
      covered += e - Math.max(s, end);
      end = e;
    }
  }
  const pageH = Math.round(doc.scrollHeight);
  if (pageH > end + GAP) gaps.push({ y: end, h: pageH - end });

  return {
    coverage: pageH ? Math.round((covered / pageH) * 100) / 100 : 0,
    gaps,
    title: document.title,
    width: window.innerWidth,
    height: Math.round(doc.scrollHeight),
    hasMain: Boolean(main),
    generator: document.querySelector('meta[name="generator"]')?.content || null,
    stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href).slice(0, 40),
    regions: regions.map(({ _el, _els, ...r }, i) => ({ n: i + 1, ...r })),
  };
}

/* ---------- the run -------------------------------------------------------- */

const slugify = (u) =>
  u
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

function parseArgs(argv) {
  const out = { urls: [], widths: [1280, 360], wait: 1500, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") out.urls.push(argv[++i]);
    else if (a === "--urls") out.urlFile = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--wait") out.wait = Number(argv[++i]);
    else if (a === "--widths") out.widths = argv[++i].split(",").map(Number);
  }
  return out;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.urlFile) {
    const txt = await readFile(resolve(process.cwd(), opts.urlFile), "utf8");
    opts.urls.push(...txt.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
  }
  if (!opts.urls.length || !opts.out) {
    console.error("Usage: node tools/regions.mjs --urls <file> | --url <href> --out <dir>");
    process.exit(1);
  }
  const outDir = resolve(process.cwd(), opts.out);
  const browser = await chromium.launch(process.env.TOKENKIT_CHROMIUM ? { executablePath: process.env.TOKENKIT_CHROMIUM } : {});
  const pages = [];

  for (const url of opts.urls) {
    const slug = slugify(url);
    const record = { url, slug, widths: {} };
    console.log(`\n${url}`);
    for (const width of opts.widths) {
      const page = await browser.newPage({ viewport: { width, height: width < 600 ? 800 : 900 } });
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(opts.wait);
        /* Wake it as a visitor would (delayed scripts, lazy iframes), decline any
           consent banner, and come back to the top so sticky things sit where a
           reader first sees them. */
        const woke = await wake(page);
        const result = await page.evaluate(splitRegions);
        result.consent = woke.consent;
        const dir = resolve(outDir, "regions", slug);
        await mkdir(dir, { recursive: true });
        /* Crops in two passes. Fixed and sticky things first, at the top,
           where a reader meets them. Then they are hidden and every other
           region is scrolled into view before it is cropped: Chromium paints
           a cross-origin iframe (an embedded form) only near the viewport,
           and nothing floating should sit over the content. */
        const crop = async (r) => {
          const file = `${String(r.n).padStart(2, "0")}@${width}.png`;
          const clip = { x: Math.max(0, r.box.x), y: Math.max(0, r.box.y), width: Math.min(r.box.w, width), height: Math.min(r.box.h, 4000) };
          try {
            await page.screenshot({ path: resolve(dir, file), clip, fullPage: true });
            r.crop = `regions/${slug}/${file}`;
          } catch (e) {
            r.crop = null;
            r.cropError = String(e.message || e).slice(0, 120);
          }
        };
        const floating = (r) => r.kind === "fixed" || r.kind === "sticky";
        for (const r of result.regions.filter(floating)) await crop(r);
        await page.evaluate(() => {
          for (const el of document.querySelectorAll("body *")) {
            const pos = getComputedStyle(el).position;
            if (pos === "fixed" || pos === "sticky") el.style.setProperty("visibility", "hidden", "important");
          }
        });
        for (const r of result.regions.filter((r) => !floating(r))) {
          await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, r.box.y - 40));
          await page.waitForTimeout(250);
          await crop(r);
        }
        record.widths[width] = result;
        console.log(`  ${String(width).padEnd(5)} ${result.regions.length} regions${result.hasMain ? "" : " (no main landmark)"}`);
      } catch (err) {
        record.widths[width] = { error: String(err.message || err) };
        console.log(`  ${String(width).padEnd(5)} failed: ${err.message || err}`);
      } finally {
        await page.close();
      }
    }
    pages.push(record);
  }
  await browser.close();

  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, "regions.json"), JSON.stringify({ generatedAt: new Date().toISOString(), widths: opts.widths, pages }, null, 2));
  const total = pages.reduce((n, p) => n + (p.widths[opts.widths[0]]?.regions?.length || 0), 0);
  console.log(`\n${pages.length} pages, ${total} regions at ${opts.widths[0]}. Wrote ${resolve(outDir, "regions.json")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
