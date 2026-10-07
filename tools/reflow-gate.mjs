#!/usr/bin/env node
/**
 * Reflow gate.
 *
 * WCAG 1.4.10: content reflows to 320 CSS pixels without scrolling in two
 * directions. BBC GEL's smallest grid group starts at the same width. The
 * kit's layout is intrinsic (shells fit columns to the space they have), so
 * this should hold by construction, and measuring it found that it did not:
 * 32 of 219 stories scrolled sideways at 320px (the ds-corpus grid brief),
 * among them the masthead on every page, the map, and a hidden tooltip that
 * still had a width. This keeps it holding.
 *
 * Per story, in the phone pass: narrow the viewport to 320px, and fail if the
 * document is wider than the viewport. Skipped: onion-skin stories (fixed to
 * the size their design was drawn at, by design) and any story that declares
 * `parameters.reflow: { skip: "why" }` — a documentation sheet that is a
 * wide table on purpose says so, with its reason, where it is written.
 *
 *   npm run build-storybook && node tools/reflow-gate.mjs
 *
 * It runs in `npm run gates` with the other story gates.
 */

import { isMain, runChecks, VIEWPORTS } from "./lib/stories.mjs";

const WIDTH = 320;

export function reflowCheck() {
  const fails = [];
  const skipped = [];
  let checked = 0;
  return {
    name: "reflow",
    viewports: ["phone"],
    async visit(page, story) {
      const params = await page.evaluate(async (id) => {
        const p = window.__STORYBOOK_PREVIEW__;
        if (!p) return {};
        const s = await p.storyStore.loadStory({ storyId: id });
        return { onion: !!s.parameters?.onion, reflow: s.parameters?.reflow ?? null };
      }, story.id);
      if (params.onion) return;
      if (params.reflow?.skip) {
        skipped.push(`${story.id}: ${params.reflow.skip}`);
        return;
      }
      checked += 1;
      await page.setViewportSize({ width: WIDTH, height: 800 });
      try {
        await page.waitForTimeout(150);
        const r = await page.evaluate(() => {
          const de = document.documentElement;
          const over = de.scrollWidth - de.clientWidth;
          if (over <= 1) return null;
          /* Name the outermost thing past the edge: that is where to look. */
          let what = null;
          for (const e of document.querySelectorAll("#storybook-root *")) {
            const b = e.getBoundingClientRect();
            if (b.right <= de.clientWidth + 1 || b.width < 1) continue;
            const pb = e.parentElement.getBoundingClientRect();
            if (pb.right > de.clientWidth + 1 && e.parentElement.id !== "storybook-root") continue;
            what = e.getAttribute("data-tk") || e.getAttribute("data-shell") || e.tagName.toLowerCase();
            break;
          }
          return { over: Math.round(over), what };
        });
        if (r) fails.push({ story: story.id, ...r });
      } finally {
        const { width, height } = VIEWPORTS.phone;
        await page.setViewportSize({ width, height });
      }
    },
    report() {
      console.log(`\ntokenkit reflow gate — ${checked} stories at ${WIDTH}px, rule: nothing scrolls sideways (WCAG 1.4.10)\n`);
      for (const f of fails) console.log(`FAIL  ${String(f.over).padStart(4)}px over  ${String(f.what).padEnd(22)} ${f.story}`);
      for (const s of skipped) console.log(`skip  ${s}`);
      if (fails.length) {
        console.log(`\n${fails.length} stor${fails.length === 1 ? "y scrolls" : "ies scroll"} sideways at ${WIDTH}px.\n\nReflow gate FAILED.`);
        return false;
      }
      console.log(`${checked} pass · 0 fail · ${skipped.length} skipped with a reason\n\nReflow gate passed.`);
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([reflowCheck()])) ? 0 : 1);
}
