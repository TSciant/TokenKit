#!/usr/bin/env node
/**
 * Motion gate — WCAG 2.2.2 (Pause, Stop, Hide), in the two classes of G-81.
 *
 * What has to be equivalent is the information, not the experience, so every
 * loop is one of two things, and each conforms its own way:
 *
 *   data    motion that carries information (a ticker, a feed, a rolling
 *           number). It names a static equivalent that carries the same
 *           information in words, and the reader can have that in its place,
 *           on the same page: a lossless hide. Or the equivalent is what
 *           shows by default, and the motion is something they start.
 *   decor   motion that carries none (a spinner's arc, a skeleton's pulse, a
 *           sparkle). Nothing can stand in for it, so it is hidden from
 *           assistive technology and it stops: when the reader pauses motion
 *           (html[data-motion="paused"], the PauseMotion button) and under
 *           reduced motion.
 *
 * Per story, three checks over what is actually running, not over the source:
 *
 *   TAG     every loop declares its class, on its element or an ancestor
 *           (data-motion-class="data" | "decor"). A loop is a CSS or Web
 *           animation that is infinite or runs past 5 seconds, or a script
 *           still asking for animation frames six seconds after the page
 *           started.
 *   DATA    each data element names its equivalent (data-equivalent="#id"):
 *           it exists, it has words, it is shown by default or a control on
 *           the page (aria-controls) shows it in place of the motion, and
 *           any live region in it is off while the motion runs and never
 *           assertive (the APG carousel's rule).
 *   DECOR   each decor element is aria-hidden, names no equivalent (there is
 *           nothing to be equivalent to), nothing in it loops (or runs past
 *           five seconds) with the page paused, and nothing in it moves at
 *           all under reduced motion.
 *
 * The round also asked that decor loops read --tk-duration-ambient. The
 * verdict changed that: a pause or a five-second stop is what conforms, and
 * the spinner's 700 ms turn is a loop that pauses.
 *
 *   npm run build-storybook && node tools/motion-gate.mjs [--verbose]
 *
 * It runs in `npm run gates`, after forced colours: it changes the page's
 * motion attribute and its media emulation, and puts both back.
 */
import { isMain, runChecks } from "./lib/stories.mjs";

/* Counts animation frames from the first script on, so a loop drawn in script
   (a canvas, a requestAnimationFrame chain) is seen like a CSS one. */
const countFrames = () => {
  const frames = [];
  window.__tkFrames = frames;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    if (frames.length > 600) frames.splice(0, 300);
    frames.push(performance.now());
    return raf(cb);
  };
};

/* What runs now: every animation on the document timeline, its class and
   where it is. Scroll-driven ones are left out (they move with the reader). */
const runningProbe = () => {
  const LIMIT = 5000;
  const name = (el) => el.getAttribute("data-tk") || el.tagName.toLowerCase();
  const out = [];
  for (const a of document.getAnimations()) {
    if (a.playState !== "running" || a.timeline !== document.timeline) continue;
    const el = a.effect?.target;
    if (!el) continue;
    const t = a.effect.getComputedTiming();
    const long = t.iterations === Infinity || (Number(t.delay) || 0) + (Number(t.duration) || 0) * t.iterations > LIMIT;
    const tagged = el.closest("[data-motion-class]");
    out.push({
      what: name(el) + (a.effect.pseudoElement ?? ""),
      long,
      cls: tagged?.getAttribute("data-motion-class") ?? null,
    });
  }
  return out;
};

const framesIn = (ms) => {
  const now = performance.now();
  return (window.__tkFrames ?? []).filter((t) => t > now - ms).length;
};

/* A script loop asks for a frame every ~16 ms; a settle or a one-off does not. */
const SCRIPT_LOOP = 10; // frames in the last second (headless Chromium paints about 21 a second)

const dataProbe = () => {
  const out = [];
  const visible = (el) => el.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) ?? el.getClientRects().length > 0;
  const running = (el) => document.getAnimations().some((a) => a.playState === "running" && a.effect?.target && el.contains(a.effect.target));
  for (const el of document.querySelectorAll('[data-motion-class="data"]')) {
    const what = el.getAttribute("data-tk") || el.tagName.toLowerCase();
    const ref = el.getAttribute("data-equivalent");
    if (!ref) { out.push({ what, reason: "names no equivalent (data-equivalent)" }); continue; }
    const id = ref.replace(/^#/, "");
    const eq = document.getElementById(id);
    if (!eq) { out.push({ what, reason: `its equivalent #${id} is not on the page` }); continue; }
    if (!eq.textContent.trim()) out.push({ what, reason: `its equivalent #${id} has no words` });
    const controls = [...document.querySelectorAll("[aria-controls]")].filter((c) => c.getAttribute("aria-controls").split(/\s+/).includes(id));
    if (!visible(eq) && !controls.length) out.push({ what, reason: `its equivalent #${id} is hidden and no control (aria-controls) shows it` });
    const live = [eq, ...eq.querySelectorAll("[aria-live]")].filter((n) => n.hasAttribute("aria-live"));
    for (const n of live) {
      const v = n.getAttribute("aria-live");
      if (v === "assertive") out.push({ what, reason: `a live region in #${id} is assertive` });
      else if (v !== "off" && running(el)) out.push({ what, reason: `a live region in #${id} is ${v} while the motion runs (off until it stops)` });
    }
    out.push({ what, control: controls[0] ? true : false, id, ok: true });
  }
  return out;
};

const decorProbe = () => {
  const out = [];
  for (const el of document.querySelectorAll('[data-motion-class="decor"]')) {
    const what = el.getAttribute("data-tk") || el.tagName.toLowerCase();
    if (!el.closest('[aria-hidden="true"]')) out.push({ what, reason: "is not aria-hidden (decor carries nothing to read)" });
    if (el.hasAttribute("data-equivalent")) out.push({ what, reason: "names an equivalent (decor has nothing to be equivalent to)" });
  }
  return out;
};

/* Anything still moving inside a decor element. */
/* Anything still moving inside a decor element. With loopsOnly, only what loops or runs past five seconds: decor
   that ends by itself within five conforms by ending (the verdict's "or a five-second stop"), so the pause owes it
   nothing; reduced motion still stops it all (Grok, 2026-10-19). */
const decorRunning = (loopsOnly) =>
  document.getAnimations()
    .filter((a) => a.playState === "running" && a.timeline === document.timeline && a.effect?.target?.closest('[data-motion-class="decor"]'))
    .filter((a) => {
      if (!loopsOnly) return true;
      const t = a.effect.getComputedTiming();
      return t.iterations === Infinity || (Number(t.delay) || 0) + (Number(t.duration) || 0) * t.iterations > 5000;
    })
    .map((a) => (a.effect.target.getAttribute("data-tk") || a.effect.target.tagName.toLowerCase()) + (a.effect.pseudoElement ?? ""));

export function motionCheck(argv = process.argv.slice(2)) {
  const verbose = argv.includes("--verbose");
  const fails = new Map(); // "kind|what|reason" -> Set(story)
  let loops = 0, data = 0, decor = 0, checked = 0;
  const fail = (kind, what, reason, story) => {
    const k = `${kind}|${what}|${reason}`;
    if (!fails.has(k)) fails.set(k, new Set());
    fails.get(k).add(story.id);
  };

  return {
    name: "motion",
    viewports: ["desktop"],
    init: countFrames,
    stories: (e) => e.type === "story",

    async visit(page, story) {
      checked += 1;
      const now = await page.evaluate(runningProbe);
      let scripted = await page.evaluate(framesIn, 1000);
      /* A story still loading asks for frames too, and motion that ends within five seconds of the page starting
         conforms by ending (the wordmark's three beats take three and a half): a loop is one still asking after six. */
      if (scripted >= SCRIPT_LOOP) {
        const since = await page.evaluate(() => performance.now());
        if (since < 6000) await page.waitForTimeout(6000 - since);
        scripted = Math.min(scripted, await page.evaluate(framesIn, 1000));
      }
      const hasDecor = await page.$('[data-motion-class="decor"]');
      const hasData = await page.$('[data-motion-class="data"]');
      const longs = now.filter((a) => a.long);
      if (!longs.length && scripted < SCRIPT_LOOP && !hasDecor && !hasData) return;

      /* TAG */
      for (const a of longs) {
        loops += 1;
        if (!a.cls) fail("tag", a.what, "loops with no class (data-motion-class)", story);
      }
      if (scripted >= SCRIPT_LOOP && !(await page.$("[data-motion-class]")))
        fail("tag", "script", `asks for a frame ${scripted} times a second with no class on the page`, story);

      /* DATA */
      for (const d of await page.evaluate(dataProbe)) {
        if (!d.ok) { fail("data", d.what, d.reason, story); continue; }
        data += 1;
        if (!d.control) continue;
        /* The control has to put the words in the motion's place, and back. */
        const control = page.locator(`[aria-controls~="${d.id}"]`).first();
        await control.click();
        await page.waitForTimeout(150);
        const shown = await page.evaluate((id) => {
          const eq = document.getElementById(id);
          const moving = [...document.querySelectorAll('[data-motion-class="data"]')]
            .filter((m) => m.getAttribute("data-equivalent")?.replace(/^#/, "") === id)
            .some((m) => m.checkVisibility() && document.getAnimations().some((a) => a.playState === "running" && m.contains(a.effect?.target)));
          return { visible: eq.checkVisibility(), moving };
        }, d.id);
        if (!shown.visible) fail("data", d.what, `its control does not show #${d.id}`, story);
        if (shown.moving) fail("data", d.what, `the motion still runs beside #${d.id} once it is shown`, story);
        await control.click();
        await page.waitForTimeout(150);
      }

      /* DECOR */
      for (const d of await page.evaluate(decorProbe)) fail("decor", d.what, d.reason, story);
      /* A script loop cannot be traced to its element, so it is held to decor's rule unless the page has data motion, whose hide is its mechanism. */
      if (hasDecor || (scripted >= SCRIPT_LOOP && !hasData)) {
        decor += 1;
        const before = await page.evaluate(() => document.documentElement.getAttribute("data-motion"));
        await page.evaluate(() => document.documentElement.setAttribute("data-motion", "paused"));
        await page.waitForTimeout(500);
        for (const w of await page.evaluate(decorRunning, true)) fail("decor", w, "still loops with the page paused", story);
        if (scripted >= SCRIPT_LOOP && !hasData && (await page.evaluate(framesIn, 400)) > 3)
          fail("decor", "script", "still asks for frames with the page paused", story);
        await page.evaluate((b) => { if (b == null) document.documentElement.removeAttribute("data-motion"); else document.documentElement.setAttribute("data-motion", b); }, before);

        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForTimeout(500);
        for (const w of await page.evaluate(decorRunning, false)) fail("decor", w, "still moves under reduced motion", story);
        if (scripted >= SCRIPT_LOOP && !hasData && (await page.evaluate(framesIn, 400)) > 3)
          fail("decor", "script", "still asks for frames under reduced motion", story);
        await page.emulateMedia({ reducedMotion: null });
      }
    },

    report() {
      console.log(`\ntokenkit motion gate — ${checked} stories: ${loops} loops tagged or not, ${data} data, ${decor} with decor (WCAG 2.2.2, G-81)\n`);
      const rows = [...fails].map(([k, s]) => { const [kind, what, reason] = k.split("|"); return { kind, what, reason, stories: [...s] }; });
      for (const r of rows.sort((a, b) => a.kind.localeCompare(b.kind))) {
        const shown = verbose ? r.stories : r.stories.slice(0, 3);
        console.log(`FAIL  ${r.kind.padEnd(5)} ${r.what} ${r.reason}  —  ${shown.join(", ")}${r.stories.length > shown.length ? ` (+${r.stories.length - shown.length})` : ""}`);
      }
      if (rows.length) { console.log(`\n${rows.length} distinct failure(s).\n\nMotion gate FAILED.`); return false; }
      console.log("0 fail\n\nMotion gate passed.");
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([motionCheck()])) ? 0 : 1);
}
