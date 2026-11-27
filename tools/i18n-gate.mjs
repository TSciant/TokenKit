#!/usr/bin/env node
/**
 * i18n gates: two checks on every story, at desktop width
 * (docs/11-tokens-and-contracts.md, phase 7).
 *
 * Right-to-left. The page is put into dir="rtl", as an Arabic or Hebrew page
 * would be. Fails when that makes the page scroll sideways or pushes something
 * that was on screen off it. The kit's CSS is logical (tools/logical-css-gate.mjs),
 * so this catches what CSS alone cannot: absolute offsets set in script, a
 * transform with a direction, an SVG that does not mirror where it should.
 *
 * Text expansion. Every visible text is made about 40% longer, the room a
 * German or Finnish translation takes. Fails when that makes the page scroll
 * sideways, or clips words inside a box that is not meant to cut text (one with
 * text-overflow: ellipsis or a line clamp is meant to, and passes).
 *
 * A story can opt out with a reason: parameters.i18n.skip = "why".
 * Both run last on each story: they change the page, and the next story loads fresh.
 *
 *   node tools/i18n-gate.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, isMain, runChecks } from "./lib/stories.mjs";

/* Findings already recorded, each with what was seen: reported as KNOWN, shown as flagged on the
   component's scorecard, and not failing the build. A new finding still fails. */
const KNOWN = existsSync(join(ROOT, "tools/i18n-known.json")) ? JSON.parse(readFileSync(join(ROOT, "tools/i18n-known.json"), "utf8")) : {};
const knownFor = (check, id) => KNOWN[check]?.[id];

/* Recorded findings seen again are printed KNOWN (the record marks those stories flagged); one recorded but
   not seen this run is named, so its entry can be removed once someone confirms the fix. */
function reportKnown(check, known, seen) {
  for (const k of known) console.log(`KNOWN ${k.why.padEnd(46)} ${k.story}  (${KNOWN[check][k.story]})`);
  for (const id of Object.keys(KNOWN[check] ?? {})) if (seen.has(id) && !known.some((k) => k.story === id)) console.log(`gone  ${id}: recorded in tools/i18n-known.json but not seen this run; remove it if it is fixed`);
}

const paramsOf = (page, id) => page.evaluate(async (sid) => {
  const p = window.__STORYBOOK_PREVIEW__;
  if (!p) return {};
  const s = await p.storyStore.loadStory({ storyId: sid });
  return { onion: !!s.parameters?.onion, i18n: s.parameters?.i18n ?? null };
}, id);

export function rtlCheck() {
  const CHECK = "rtl", fails = [], known = [], skipped = [], seen = new Set();
  let checked = 0;
  return {
    name: CHECK,
    viewports: ["desktop"],
    async visit(page, story) {
      const params = await paramsOf(page, story.id);
      if (params.onion) return;
      if (params.i18n?.skip) { skipped.push(`${story.id}: ${params.i18n.skip}`); return; }
      checked++; seen.add(story.id);
      const r = await page.evaluate(async () => {
        const de = document.documentElement, W = () => de.clientWidth;
        /* Not what sits in a scrolling row: right to left, a row starts from its other end, and what was
           in view is reached by scrolling the other way. That is the row working, not breaking. */
        /* Up the tree as it is laid out: through the slot a tile sits in and out of a shadow root, since a
           pack's scrolling track is inside its own shadow DOM. */
        const up = (n) => n.assignedSlot ?? n.parentElement ?? (n.parentNode instanceof ShadowRoot ? n.parentNode.host : null);
        const inScroller = (e) => { for (let a = up(e); a && a.id !== "storybook-root"; a = up(a)) { const o = getComputedStyle(a).overflowX; if (/auto|scroll/.test(o) && a.scrollWidth > a.clientWidth + 1) return true; } return false; };
        const onScreen = () => [...document.querySelectorAll("#storybook-root *")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.right > 0 && b.left < W() && !inScroller(e); });
        const before = new Set(onScreen());
        const overBefore = de.scrollWidth - W();
        de.dir = "rtl";
        await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        const over = de.scrollWidth - W();
        const gone = [...before].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right <= 0 || b.left >= W()); });
        de.dir = "";
        const name = (e) => e.getAttribute("data-tk") || e.getAttribute("data-shell") || e.tagName.toLowerCase();
        if (over > overBefore + 1) return { why: `scrolls sideways by ${Math.round(over - overBefore)}px` };
        if (gone.length) return { why: `${gone.length} element(s) pushed off screen, first ${name(gone[0])}` };
        return null;
      });
      if (r) (knownFor(CHECK, story.id) ? known : fails).push({ story: story.id, ...r });
    },
    report() {
      console.log(`\ntokenkit right-to-left gate — ${checked} stories at desktop width, rule: dir="rtl" moves nothing off the page\n`);
      for (const f of fails) console.log(`FAIL  ${f.why.padEnd(46)} ${f.story}`);
      for (const s of skipped) console.log(`skip  ${s}`);
      reportKnown(CHECK, known, seen);
      if (fails.length) { console.log(`\n${fails.length} stor${fails.length === 1 ? "y breaks" : "ies break"} right to left.\n\nRight-to-left gate FAILED.`); return false; }
      console.log(`${checked - known.length} pass · 0 fail · ${known.length} known · ${skipped.length} skipped with a reason\n\nRight-to-left gate passed.`);
      return true;
    },
  };
}

export function expansionCheck() {
  const CHECK = "expansion", fails = [], known = [], skipped = [], seen = new Set();
  let checked = 0;
  return {
    name: CHECK,
    viewports: ["desktop"],
    async visit(page, story) {
      const params = await paramsOf(page, story.id);
      if (params.onion) return;
      if (params.i18n?.skip) { skipped.push(`${story.id}: ${params.i18n.skip}`); return; }
      checked++; seen.add(story.id);
      const r = await page.evaluate(async () => {
        const de = document.documentElement, W = de.clientWidth;
        const root = document.getElementById("storybook-root");
        if (!root) return null;
        const meantToCut = (e) => { const cs = getComputedStyle(e); return cs.textOverflow === "ellipsis" || (cs.webkitLineClamp && cs.webkitLineClamp !== "none"); };
        /* Nor text hidden for screen readers: a 1px box with clip is cut on purpose, and a reader hears all of it. */
        const srOnly = (e) => e.clientWidth <= 1 || e.clientHeight <= 1 || getComputedStyle(e).clip !== "auto";
        const clippers = () => [...root.querySelectorAll("*")].filter((e) => { const cs = getComputedStyle(e); return /hidden|clip/.test(cs.overflowX + cs.overflowY) && e.textContent.trim() && !meantToCut(e) && !srOnly(e); });
        const clippedNow = (e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1;
        const before = new Set(clippers().filter(clippedNow));
        const overBefore = de.scrollWidth - W;
        /* Longer by about 40%: each text repeats its own opening words, so line breaking stays realistic. */
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const texts = [];
        /* Not initials: an avatar's letters come from a name and are never translated. */
        for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim().length > 1 && n.parentElement && !/^(SCRIPT|STYLE|CODE|PRE)$/.test(n.parentElement.tagName) && !n.parentElement.closest("[data-tk^=avatar]")) texts.push(n);
        for (const t of texts) { const s = t.textContent; t.textContent = s + " " + s.trim().slice(0, Math.ceil(s.trim().length * 0.4)); }
        await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        const over = de.scrollWidth - W;
        const newlyClipped = clippers().filter((e) => clippedNow(e) && !before.has(e));
        const name = (e) => e.getAttribute("data-tk") || e.getAttribute("data-shell") || e.tagName.toLowerCase();
        if (over > overBefore + 1) return { why: `scrolls sideways by ${Math.round(over - overBefore)}px` };
        if (newlyClipped.length) return { why: `cuts text in ${newlyClipped.length} box(es), first ${name(newlyClipped[0])}` };
        return null;
      });
      if (r) (knownFor(CHECK, story.id) ? known : fails).push({ story: story.id, ...r });
    },
    report() {
      console.log(`\ntokenkit text expansion gate — ${checked} stories at desktop width with every text about 40% longer, rule: no sideways scroll, no words cut\n`);
      for (const f of fails) console.log(`FAIL  ${f.why.padEnd(46)} ${f.story}`);
      for (const s of skipped) console.log(`skip  ${s}`);
      reportKnown(CHECK, known, seen);
      if (fails.length) { console.log(`\n${fails.length} stor${fails.length === 1 ? "y breaks" : "ies break"} with longer text.\n\nText expansion gate FAILED.`); return false; }
      console.log(`${checked - known.length} pass · 0 fail · ${known.length} known · ${skipped.length} skipped with a reason\n\nText expansion gate passed.`);
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([rtlCheck(), expansionCheck()])) ? 0 : 1);
}
