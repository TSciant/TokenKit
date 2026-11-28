#!/usr/bin/env node
/**
 * Events: what the kit's components report, held to their contracts
 * (docs/11-tokens-and-contracts.md, phase 8).
 *
 * A component reports through one DOM event, tk:event (src/lib/tk-event.ts),
 * and never calls an analytics vendor. Its contract says what it may send:
 *
 *   "events": { "dismiss": { "when": "...", "props": { "how": ["escape", "backdrop", "button", "app"] },
 *                            "trigger": [{ "click": "<selector>" } | { "key": "Escape", "from": "<selector>" | null }],
 *                            "expect": { "how": "escape" } } }
 *
 * A prop's type is "number", "boolean" or a list of the only words it may
 * carry. A free string is never allowed, so typed text, an option's label and
 * a name cannot be sent. On every story this check fails:
 *
 *   - a tk:event from a component with no contract, or an event its contract
 *     does not declare, or a field it does not declare, or a value of the
 *     wrong kind or outside its list;
 *   - any request to an analytics vendor (the kit sends nothing on its own).
 *
 * And for each declared event with a trigger, on the contract's story
 * (a11y.story), opened fresh: the trigger is run and the event must arrive
 * with what `expect` says. Writes audits/events.json, read by the scorecards.
 *
 *   node tools/event-gate.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, isMain, runChecks } from "./lib/stories.mjs";

const contracts = readdirSync(join(ROOT, "contracts")).filter((f) => f.endsWith(".contract.json"))
  .map((f) => JSON.parse(readFileSync(join(ROOT, "contracts", f), "utf8")));
const byName = new Map(contracts.map((c) => [c.component, c]));
const declared = (c) => Object.entries(c.events ?? {}).filter(([k]) => !k.startsWith("$"));
const withTriggers = contracts.filter((c) => c.a11y?.story && declared(c).some(([, e]) => e.trigger));
const byStory = new Map();
for (const c of withTriggers) (byStory.get(c.a11y.story) ?? byStory.set(c.a11y.story, []).get(c.a11y.story)).push(c);

const VENDORS = /posthog|google-analytics|googletagmanager|segment\.(io|com)|mixpanel|amplitude|plausible|hotjar|fullstory/i;
const KEY = { Space: " " };

/* Recorded from the first line of every story, before any component mounts. */
function init() {
  window.__tkEvents = [];
  window.addEventListener("tk:event", (e) => { try { window.__tkEvents.push(JSON.parse(JSON.stringify(e.detail))); } catch { window.__tkEvents.push({ bad: true }); } }, true);
}

/** What is wrong with one event, against its contract: an empty list when nothing is. */
export function judge(d) {
  if (!d || d.bad || typeof d.component !== "string" || typeof d.event !== "string") return ["not a tk:event detail ({ component, event, props })"];
  const c = byName.get(d.component);
  if (!c) return [`${d.component}: no contract of that name`];
  const e = c.events?.[d.event];
  if (!e || d.event.startsWith("$")) return [`${d.component}.${d.event}: not declared in its contract`];
  const out = [];
  for (const [k, v] of Object.entries(d.props ?? {})) {
    const t = e.props?.[k];
    if (t === undefined) out.push(`${d.component}.${d.event}: field "${k}" is not declared`);
    else if (Array.isArray(t) ? !t.includes(v) : typeof v !== t) out.push(`${d.component}.${d.event}: "${k}" is ${JSON.stringify(v)}, declared ${Array.isArray(t) ? `one of ${t.join(", ")}` : `a ${t}`}`);
  }
  return out;
}

export function eventCheck({ write = true } = {}) {
  const fails = [];
  const seen = {}; /* component -> event -> { fired, matched } */
  let stories = 0, events = 0;
  return {
    name: "events",
    viewports: ["desktop"],
    init,
    async visit(page, story) {
      stories++;
      const atLoad = await page.evaluate(() => window.__tkEvents ?? []);
      events += atLoad.length;
      for (const d of atLoad) for (const why of judge(d)) fails.push(`${why}  ${story.id}`);
      const vendors = await page.evaluate((re) => performance.getEntriesByType("resource").map((r) => r.name).filter((n) => new RegExp(re, "i").test(n)), VENDORS.source);
      for (const v of vendors) fails.push(`called an analytics vendor (${new URL(v).host})  ${story.id}`);

      for (const c of byStory.get(story.id) ?? []) for (const [name, e] of declared(c)) {
        if (!e.trigger) continue;
        const row = ((seen[c.component] ??= {})[name] = { fired: false, matched: false });
        try {
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForSelector("#storybook-root *", { timeout: 5000 });
          /* A link chosen in a trigger must not take the story away before its event is read. */
          await page.evaluate(() => { window.__tkEvents = []; document.addEventListener("click", (ev) => { if (ev.target.closest?.("a[href]")) ev.preventDefault(); }, true); });
          await page.waitForTimeout(150);
          for (const s of e.trigger) {
            if (s.click) await page.click(s.click);
            else { if (s.from) await page.focus(s.from); await page.keyboard.press(KEY[s.key] ?? s.key); }
            await page.waitForTimeout(200);
          }
          const got = (await page.evaluate(() => window.__tkEvents)).filter((d) => d.component === c.component && d.event === name);
          row.fired = got.length > 0;
          const want = Object.entries(e.expect ?? {});
          const hit = got.find((d) => want.every(([k, v]) => d.props?.[k] === v));
          row.matched = !!hit;
          if (!row.fired) fails.push(`${c.component}.${name}: its trigger sent nothing  ${story.id}`);
          else if (!hit) fails.push(`${c.component}.${name}: sent ${JSON.stringify(got[0].props)}, its contract expects ${JSON.stringify(e.expect)}  ${story.id}`);
          for (const d of got) for (const why of judge(d)) fails.push(`${why}  ${story.id}`);
        } catch (err) { fails.push(`${c.component}.${name}: ${String(err?.message ?? err).split("\n")[0]}  ${story.id}`); }
      }
    },
    report() {
      const total = withTriggers.reduce((n, c) => n + declared(c).length, 0);
      const fired = Object.values(seen).reduce((n, ev) => n + Object.values(ev).filter((r) => r.matched).length, 0);
      console.log(`\ntokenkit event gate — ${stories} stories, ${events} event(s) at load; ${total} declared event(s) on ${withTriggers.length} components, each triggered on a fresh story\n`);
      for (const f of fails) console.log(`FAIL  ${f}`);
      if (write) writeFileSync(join(ROOT, "audits/events.json"), JSON.stringify({ note: "Written by tools/event-gate.mjs: each declared tk:event, triggered and checked against its contract. Read by tools/scorecards.mjs.", generatedAt: new Date().toISOString(), components: Object.fromEntries(contracts.filter((c) => c.events).map((c) => [c.component, { declared: declared(c).map(([k]) => k), seen: Object.entries(seen[c.component] ?? {}).filter(([, r]) => r.matched).map(([k]) => k), decision: c.events.$decision ?? null }])) }, null, 1) + "\n");
      if (fails.length) { console.log(`\n${fails.length} problem(s).\n\nEvent gate FAILED.`); return false; }
      console.log(`${fired} of ${total} declared events arrive as their contracts say · no undeclared event or field · no vendor called\n\nEvent gate passed.`);
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([eventCheck()])) ? 0 : 1);
}
