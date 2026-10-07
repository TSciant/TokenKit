#!/usr/bin/env node
/**
 * Titles gate.
 *
 * A page or hero title that runs to four or five lines on a phone is a title
 * the reader scrolls past before it has said anything. Carbon's expressive
 * set and BBC GEL's device groups both resize headings with the screen; the
 * ds-corpus type brief said to measure before copying them. Measured at the
 * story pass's phone width (412px), nine of the kit's titles ran to four
 * lines at their desktop sizes, so the display, title and heading-l sizes
 * became fluid (see --tk-size-display in 03-scale.css), and this keeps them
 * honest: no title past THREE lines at 412px.
 *
 * A title is an h1, anything set in the display or title style, and a
 * hero's title. Lines are the rendered height over the computed line
 * height, so this reads the real font, the real wrap and the real width.
 *
 *   npm run build-storybook && node tools/titles-gate.mjs [--verbose]
 *
 * It runs in `npm run gates` with the other story gates.
 */

import { isMain, runChecks } from "./lib/stories.mjs";

const MAX_LINES = 3;

const probe = () =>
  [...document.querySelectorAll('#storybook-root :is(h1, [data-text="display"], [data-text="title"], [data-tk="hero-title"])')]
    .map((e) => {
      const c = getComputedStyle(e);
      const h = e.getBoundingClientRect().height;
      if (h < 2 || c.display === "none" || c.visibility === "hidden") return null;
      if (e.closest("[aria-hidden='true']")) return null;
      const lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.2;
      return {
        what: e.getAttribute("data-tk") || (e.getAttribute("data-text") ? `[data-text=${e.getAttribute("data-text")}]` : e.tagName.toLowerCase()),
        size: Math.round(parseFloat(c.fontSize) * 10) / 10,
        width: Math.round(e.getBoundingClientRect().width),
        lines: Math.round(h / lh),
        text: e.textContent.trim().slice(0, 60),
      };
    })
    .filter(Boolean);

export function titlesCheck(argv = process.argv.slice(2)) {
  const verbose = argv.includes("--verbose");
  const rows = [];
  return {
    name: "titles",
    viewports: ["phone"],
    async visit(page, story) {
      for (const r of await page.evaluate(probe)) rows.push({ ...r, story: story.id });
    },
    report() {
      const fails = rows.filter((r) => r.lines > MAX_LINES);
      const longest = rows.reduce((m, r) => Math.max(m, r.lines), 0);
      console.log(`\ntokenkit titles gate — ${rows.length} titles at 412px, rule: at most ${MAX_LINES} lines; longest ${longest}\n`);
      for (const r of verbose ? rows : fails) {
        console.log(`${r.lines > MAX_LINES ? "FAIL" : "ok  "}  ${String(r.lines).padStart(2)} lines  ${String(r.size).padStart(5)}px in ${String(r.width).padStart(3)}px  ${r.what.padEnd(20)} ${r.story}  "${r.text}"`);
      }
      if (fails.length) {
        console.log(`\n${fails.length} title(s) over ${MAX_LINES} lines.\n\nTitles gate FAILED.`);
        return false;
      }
      console.log(`${rows.length} pass · 0 fail\n\nTitles gate passed.`);
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([titlesCheck()])) ? 0 : 1);
}
