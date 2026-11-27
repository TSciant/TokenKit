#!/usr/bin/env node
/**
 * Keyboard: every key a component's contract promises, pressed and checked
 * (docs/11-tokens-and-contracts.md, phase 7).
 *
 * A contract's a11y.keys is a list of tests, each a promise someone can read
 * and a machine can check:
 *
 *   { "key": "Escape",
 *     "before": [{ "click": "<selector>" } | { "key": "Enter", "from": "<selector>" }],
 *     "from": "<selector to focus first>" | null (keep focus where it is),
 *     "expect": { "selector": "...", "attr": "aria-expanded", "value": "true" }
 *             | { "selector": "...", "prop": "checked", "value": true }
 *             | { "focused": "<selector>", "nth": 2 }   (1-based; -1 is the last)
 *             | { "hidden": "<selector>" },
 *     "says": "closes the list" }
 *
 * Each test opens the contract's story fresh. Writes audits/keyboard.json,
 * which tools/scorecards.mjs reads.
 *
 *   node tools/keyboard-gate.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, isMain, runChecks } from "./lib/stories.mjs";

const contracts = readdirSync(join(ROOT, "contracts")).filter((f) => f.endsWith(".contract.json"))
  .map((f) => JSON.parse(readFileSync(join(ROOT, "contracts", f), "utf8")))
  .filter((c) => c.a11y?.story && Array.isArray(c.a11y.keys) && c.a11y.keys.length);
const byStory = new Map(contracts.map((c) => [c.a11y.story, c]));

const KEY = { Space: " " };

/* write: keep audits/keyboard.json. Off in the fast tier, so a commit's partial run never rewrites the record
   the scorecards are built from (and leaves them stale for the next commit). */
export function keyboardCheck({ write = true } = {}) {
  const results = {};
  return {
    name: "keyboard",
    viewports: ["desktop"],
    stories: (story) => byStory.has(story.id),
    async visit(page, story) {
      const c = byStory.get(story.id);
      const rows = (results[c.component] = { story: story.id, results: [] }).results;
      for (const t of c.a11y.keys) {
        let pass = false, why = "";
        try {
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForSelector("#storybook-root *", { timeout: 5000 });
          await page.waitForTimeout(150);
          for (const b of t.before ?? []) {
            if (b.click) await page.click(b.click);
            else { await page.focus(b.from); await page.keyboard.press(b.key); }
            await page.waitForTimeout(200);
          }
          if (t.from) await page.focus(t.from);
          await page.keyboard.press(t.key);
          await page.waitForTimeout(250);
          const r = await page.evaluate((e) => {
            const pick = (sel, nth) => { const all = [...document.querySelectorAll(sel)]; return nth === -1 ? all.at(-1) : all[(nth ?? 1) - 1]; };
            if (e.focused) { const want = pick(e.focused, e.nth); return { ok: !!want && document.activeElement === want, got: document.activeElement?.getAttribute("data-tk") || document.activeElement?.tagName }; }
            if (e.hidden) { const el = document.querySelector(e.hidden); const shown = el && el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== "hidden"; return { ok: !shown, got: shown ? "still visible" : "hidden" }; }
            const el = document.querySelector(e.selector);
            if (!el) return { ok: false, got: "no element" };
            const v = e.attr ? el.getAttribute(e.attr) : el[e.prop];
            return { ok: v === e.value, got: String(v) };
          }, t.expect);
          pass = r.ok; why = pass ? "" : `got ${r.got}`;
        } catch (err) { why = String(err?.message ?? err).split("\n")[0]; }
        rows.push({ key: t.key, says: t.says, pass, ...(why ? { why } : {}) });
      }
    },
    report() {
      const all = Object.entries(results);
      const failed = all.flatMap(([n, r]) => r.results.filter((x) => !x.pass).map((x) => `${n}: ${x.key} ${x.says} (${x.why})  ${r.story}`));
      const total = all.reduce((n, [, r]) => n + r.results.length, 0);
      console.log(`\ntokenkit keyboard gate — ${all.length} components, ${total} promised keys, each pressed on a fresh story\n`);
      for (const f of failed) console.log(`FAIL  ${f}`);
      if (write) writeFileSync(join(ROOT, "audits/keyboard.json"), JSON.stringify({ note: "Written by tools/keyboard-gate.mjs: each key a contract promises, pressed and checked. Read by tools/scorecards.mjs.", generatedAt: new Date().toISOString(), components: results }, null, 1) + "\n");
      if (failed.length) { console.log(`\n${failed.length} of ${total} keys do not do what the contract says.\n\nKeyboard gate FAILED.`); return false; }
      console.log(`${total} pass · 0 fail\n\nKeyboard gate passed.`);
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([keyboardCheck()])) ? 0 : 1);
}
