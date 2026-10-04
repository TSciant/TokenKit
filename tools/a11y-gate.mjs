#!/usr/bin/env node
/**
 * Accessibility gate — axe-core over every built story.
 *
 * The Storybook a11y addon checks the story you are looking at. This checks
 * all of them, in one command, with an exit code — which is what CI needs and
 * what a delivery claim needs behind it.
 *
 * It runs against `storybook-static/`, so build first:
 *
 *   npm run build-storybook && npm run a11y
 *   npm run a11y -- --id audit-homepage-modules--insights-feed-cards
 *   npm run a11y -- --verbose        list every failing node
 *
 * `npm run gates` runs this in the same browser pass as the other story gates
 * (tools/browser-gates.mjs); the plumbing is tools/lib/stories.mjs.
 *
 * One exclusion, declared here and in .storybook/preview.tsx so the addon and
 * the gate agree: [data-tk="scrim-content"]. axe resolves a backdrop by
 * walking up for an opaque background and does not composite pseudo-elements,
 * so it cannot see a scrim's wash at all — it reports the plate underneath and
 * fails at 1.27:1. That region is checked by tools/contrast-gate.mjs instead,
 * which composites the wash over pure white, the lightest backdrop an unknown
 * photograph can produce. Harder test, not a waived one.
 *
 * TWO VIEWPORTS, because some of WCAG is a function of the viewport. This gate
 * ran at 1440×1000 only, and reported 167 of 167 stories passing — while
 * Lighthouse, which emulates a phone, failed target-size (2.5.8, Target Size
 * Minimum, and Level AA in WCAG 2.2) on the same build. Both were right. A
 * control that has room around it on a desktop row does not when the row
 * wraps, and a rule about spacing cannot be answered at a width where nothing
 * is crowded.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, VIEWPORTS, isMain, runChecks } from "./lib/stories.mjs";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
/* Nested iframes too. A story that frames other stories (08 Prototype, side
   by side) is two documents, each with its one banner, main and contentinfo;
   axe aggregates landmark-unique across frames and calls them duplicates of
   each other. Every framed page is its own story and is checked there, alone,
   which is the only place its landmarks mean anything. */
const EXCLUDE = [['[data-tk="scrim-content"]'], ["iframe"]];

export function a11yCheck(argv = process.argv.slice(2)) {
  const verbose = argv.includes("--verbose");
  const idIdx = argv.indexOf("--id");
  const only = idIdx > -1 ? argv[idIdx + 1] : null;
  const AXE = readFileSync(resolve(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");

  const failures = [];
  const stories = new Set();
  let checked = 0;

  return {
    name: "a11y",
    viewports: ["desktop", "phone"],
    stories: (e) => !only || e.id === only,

    unrendered(story, vp) {
      stories.add(story.id);
      failures.push({ id: story.id, viewport: vp.name, rule: "render", help: "story never rendered", nodes: [] });
    },

    async visit(page, story, vp) {
      stories.add(story.id);
      await page.evaluate(AXE);

      // The addon runs its own axe against the same page; wait it out rather
      // than racing it. axe refuses to run twice at once and says so.
      let result = null;
      for (let i = 0; i < 12; i++) {
        try {
          result = await page.evaluate(
            ({ tags, exclude }) =>
              window.axe.run(
                { include: [["#storybook-root"]], exclude },
                { runOnly: { type: "tag", values: tags } },
              ),
            { tags: TAGS, exclude: EXCLUDE },
          );
          break;
        } catch (e) {
          if (!String(e).includes("already running")) throw e;
          await page.waitForTimeout(400);
        }
      }
      if (!result) {
        failures.push({ id: story.id, viewport: vp.name, rule: "axe", help: "axe never got a turn", nodes: [] });
        return;
      }

      checked++;
      for (const v of result.violations) {
        failures.push({
          id: story.id,
          viewport: vp.name,
          rule: v.id,
          help: v.help,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target.join(" "),
            why: (n.failureSummary || "").split("\n").map((s) => s.trim()).filter(Boolean).slice(1).join(" · "),
          })),
        });
      }
    },

    report() {
      const tags = TAGS.filter((t) => t !== "best-practice").join(", ");
      const runs = [VIEWPORTS.desktop, VIEWPORTS.phone].map((v) => `${v.name} ${v.width}px`).join(" + ");
      console.log(
        `\ntokenkit a11y gate — ${checked} story runs (${stories.size} stories x ${runs}), ${tags} + best-practice\n`,
      );

      if (!failures.length) {
        console.log(`${checked} pass · 0 fail`);
        console.log("\nAccessibility gate passed.");
        return true;
      }

      for (const f of failures) {
        console.log(`FAIL  ${f.id}  [${f.viewport}]`);
        console.log(`      ${f.rule} (${f.nodes.length}) — ${f.help}`);
        for (const n of f.nodes.slice(0, verbose ? Infinity : 3)) {
          console.log(`        ${n.target}`);
          if (verbose && n.why) console.log(`          ${n.why}`);
        }
        if (!verbose && f.nodes.length > 3) {
          console.log(`        … ${f.nodes.length - 3} more (--verbose)`);
        }
      }
      const failedRuns = new Set(failures.map((f) => `${f.viewport}:${f.id}`)).size;
      console.log(`\n${checked - failedRuns} pass · ${failedRuns} fail`);
      console.log("\nAccessibility gate FAILED.");
      return false;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([a11yCheck()])) ? 0 : 1);
}
