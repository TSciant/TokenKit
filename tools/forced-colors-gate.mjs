#!/usr/bin/env node
/**
 * Forced-colours gate.
 *
 * Windows High Contrast (forced colours) throws away the page's colours and
 * paints everything from a handful of system colours the reader chose. What
 * survives is structure: text, borders, outlines. What does not survive is
 * every way of drawing a boundary that is not a border — a background fill,
 * a box-shadow ring, an inset shadow standing in for a stroke. A solid button
 * with no border is a filled rectangle in the normal theme and a floating word
 * in forced colours; a focus ring drawn with box-shadow is simply gone.
 *
 * None of the systems in the ds-corpus colour brief checks this; USWDS comes
 * closest ("let users select their own text and background colors"), and that
 * is what forced colours is. So, per story, with `forced-colors: active`
 * emulated:
 *
 *   BOUNDARY  every visible control whose shape is painted (a fill that
 *             differs from its ground, a shadow, a background image) keeps a
 *             drawn border on all four sides. A transparent border is fine
 *             and is the usual fix: forced colours repaint it in the reader's
 *             text colour. Text-only controls look the same in both modes
 *             and are not asked for one.
 *   STATE     a control that is on (aria-pressed, -current, -selected,
 *             -checked) looks different from its sibling that is off, with
 *             forced colours on: a state shown only by a fill is no state.
 *   FOCUS     tabbing through the story, the focused element (or the box
 *             within three levels that presents it) has an outline.
 *             Not a box-shadow (removed), not a border colour change (forced
 *             to one colour, so the change is invisible).
 *
 * Native checkboxes and radios are exempt (the browser draws them in system
 * colours), as are iframes (their document is checked as its own story) and
 * controls inside the map canvas (maplibre's DOM).
 *
 *   npm run build-storybook && node tools/forced-colors-gate.mjs [--verbose]
 *
 * It runs in `npm run gates` with the other story gates, last, because it
 * changes the page's media emulation and its focus.
 */

import { isMain, runChecks } from "./lib/stories.mjs";

const TABS = 30;

const boundaryProbe = () => {
  const px = (v) => parseFloat(v) || 0;
  const out = [];
  const sel = [
    "button", "a[href]", "input", "select", "textarea", "summary",
    '[role="button"]', '[role="tab"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]', '[role="combobox"]',
  ].join(",");
  const sides = ["Top", "Right", "Bottom", "Left"];
  const alpha = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return c === "transparent" ? 0 : 1;
    const p = m[1].split(/[ ,/]+/).filter(Boolean);
    return p.length > 3 ? parseFloat(p[3]) : 1;
  };
  for (const el of document.querySelectorAll(sel)) {
    if (el.closest('[data-tk="map-canvas"]')) continue;
    if (el.matches('input[type="hidden"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="color"]')) continue;
    if (el.matches("summary") && !el.hasAttribute("data-tk")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
    /* Visually hidden (the clip pattern) is not on screen to be bounded. */
    if (cs.position === "absolute" && (cs.clip === "rect(0px, 0px, 0px, 0px)" || cs.clipPath === "inset(50%)")) continue;
    /* A control laid over a visible label (a stretched or covering input) is
       drawn by what it covers; only its covering element is seen. */
    if (Number(cs.opacity) < 0.05) continue;
    /* Only a SHAPE that is painted loses anything. A text button, a nav link,
       an FAQ row look the same in both modes: words in the reader's button
       colour. A filled pill, a shadowed chip, a carousel dot, a current-page
       marker: forced colours repaint the fill as the page ground and drop
       the shadow, and the shape is gone. Read in the normal theme, because
       that is the shape there is to lose. The control is checked, and so is
       every mark it owns: its ::before and ::after, and any wordless element
       inside it (a dot, a bar) — the hero dots and the rail nav's current
       marker were exactly that, and invisible in forced colours. */
    const label = el.getAttribute("data-tk") || el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : "");
    const marks = [[el, null, label]];
    for (const pseudo of ["::before", "::after"]) marks.push([el, pseudo, `${label}${pseudo}`]);
    for (const d of el.querySelectorAll("*")) {
      /* A mark is a pure shape: no words, no icon, no picture. A tile holding
         an icon keeps the icon in forced colours, which is what it says. */
      if (d.closest("svg") || d.textContent.trim() || d.querySelector("svg, img, picture, video, canvas")) continue;
      const tag = d.getAttribute("data-tk") || d.tagName.toLowerCase();
      marks.push([d, null, `${label} > ${tag}`]);
    }
    for (const [node, pseudo, what] of marks) {
      const c = getComputedStyle(node, pseudo);
      if (pseudo && (c.content === "none" || c.content === "normal")) continue;
      if (c.display === "none" || c.visibility === "hidden") continue;
      if ((parseFloat(c.width) || 0) < 1 && pseudo) continue;
      const drawn = sides.every((s) => px(c[`border${s}Width`]) > 0 && !/none|hidden/.test(c[`border${s}Style`]));
      if (drawn) continue;
      /* The ground a fill is seen against: the nearest painted thing behind
         it (for a pseudo-element, its own host first). */
      let ground = "rgb(255, 255, 255)";
      for (let a = pseudo ? node : node.parentElement; a; a = a.parentElement) {
        const bg = getComputedStyle(a).backgroundColor;
        if (alpha(bg) > 0) { ground = bg; break; }
      }
      const filled = alpha(c.backgroundColor) > 0.05 && c.backgroundColor !== ground;
      const shadow = c.boxShadow !== "none";
      const image = c.backgroundImage !== "none" && !/^url\(/.test(c.backgroundImage);
      if (!(filled || shadow || image)) continue;
      out.push({
        what,
        variant: el.getAttribute("data-variant") || "",
        reason: `shape painted by ${filled ? "a fill" : shadow ? "a shadow" : "a gradient"}, no border`,
      });
    }
  }
  return out;
};

/* STATE: under forced colours, a control that is on (pressed, current,
   selected, checked by ARIA) must look different from its sibling that is
   off. Read with the emulation on, comparing everything forced colours leave
   alone: borders, outline, weight, decoration, the marks' sizes, and the
   colours themselves (identical unless the CSS chose system colours for the
   on state). The pressed chip was a fill and nothing else, so in forced
   colours on and off were the same chip. */
const stateProbe = () => {
  const ATTRS = ["aria-pressed", "aria-current", "aria-selected", "aria-checked"];
  const on = (el, a) => el.hasAttribute(a) && !["false", ""].includes(el.getAttribute(a));
  const sig = (el) => {
    const parts = [];
    for (const pseudo of [null, "::before", "::after"]) {
      const c = getComputedStyle(el, pseudo);
      /* A background counts only where the CSS opted out of forced colours:
         otherwise it is the reader's Canvas, at whatever alpha it had, and an
         opaque Canvas and a transparent one on a Canvas page look the same. */
      const bg = c.forcedColorAdjust === "none" ? c.backgroundColor : "";
      parts.push([c.borderTopWidth, c.borderTopStyle, c.fontWeight, c.textDecorationLine, c.fontStyle,
        bg, c.color, pseudo ? `${c.content}|${c.width}|${c.height}|${c.display}` : ""].join(","));
    }
    for (const d of el.querySelectorAll("*")) {
      const c = getComputedStyle(d);
      if (c.display === "none" || c.visibility === "hidden") continue;
      /* Not the child's size: two chips with different labels differ in
         width and say nothing about state. */
      parts.push(`${d.tagName}:${c.borderTopWidth}${c.borderTopStyle}:${c.forcedColorAdjust === "none" ? c.backgroundColor : ""}:${c.color}:${c.fontWeight}`);
    }
    return parts.join("|");
  };
  const groups = new Map();
  for (const a of ATTRS) {
    for (const el of document.querySelectorAll(`[${a}]`)) {
      if (el.closest('[data-tk="map-canvas"]')) continue;
      if (a === "aria-current" && !el.matches("a, button, [role]")) continue;
      const scope = el.parentElement?.closest('[data-tk], ul, ol, nav, fieldset, [role="group"], [role="tablist"], [role="radiogroup"]') ?? document.body;
      const kind = `${a}|${el.getAttribute("data-tk") || el.tagName}|${el.getAttribute("data-variant") || ""}`;
      if (!groups.has(scope)) groups.set(scope, new Map());
      const g = groups.get(scope);
      if (!g.has(kind)) g.set(kind, { on: [], off: [] });
      g.get(kind)[on(el, a) ? "on" : "off"].push(el);
    }
  }
  /* aria-current marks one of many: the others carry no attribute at all, so
     its off siblings are the same kind of element in the same scope. */
  for (const el of document.querySelectorAll('[aria-current]:not([aria-current="false"])')) {
    const scope = el.parentElement?.closest('[data-tk], ul, ol, nav, fieldset, [role="group"], [role="tablist"], [role="radiogroup"]') ?? document.body;
    const tk = el.getAttribute("data-tk");
    if (!tk) continue;
    const kind = `aria-current|${tk}|${el.getAttribute("data-variant") || ""}`;
    const g = groups.get(scope)?.get(kind);
    if (!g) continue;
    for (const sib of scope.querySelectorAll(`[data-tk="${tk}"]:not([aria-current])`)) g.off.push(sib);
  }
  const out = [];
  for (const g of groups.values()) {
    for (const [kind, { on: ons, off }] of g) {
      if (!ons.length || !off.length) continue;
      const offSigs = new Set(off.map(sig));
      for (const el of ons) {
        if (offSigs.has(sig(el))) {
          const [attr, what, variant] = kind.split("|");
          out.push({ what: what.toLowerCase(), variant, reason: `${attr} on looks the same as off` });
          break;
        }
      }
    }
  }
  return out;
};

const focusProbe = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  if (el.closest('[data-tk="map-canvas"]') || el.tagName === "IFRAME") return { skip: true };
  const cs = getComputedStyle(el);
  const has = (e) => {
    const s = getComputedStyle(e);
    return !/none/.test(s.outlineStyle) && parseFloat(s.outlineWidth) > 0;
  };
  /* The ring may be drawn by the element or by the thing that presents it:
     a choice card outlines itself when its (visually plain) input has focus. */
  let outlined = has(el);
  for (let a = el.parentElement, i = 0; !outlined && a && i < 3; a = a.parentElement, i++) outlined = has(a);
  return {
    outlined,
    what: el.getAttribute("data-tk") || el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : ""),
    variant: el.getAttribute("data-variant") || "",
    reason: `outline ${cs.outlineStyle} ${cs.outlineWidth}`,
  };
};

export function forcedColorsCheck(argv = process.argv.slice(2)) {
  const verbose = argv.includes("--verbose");
  const fails = new Map(); // key -> { kind, what, variant, reason, stories: [] }
  let checked = 0;
  let focused = 0;

  const note = (kind, r, story) => {
    const key = `${kind}|${r.what}|${r.variant}`;
    if (!fails.has(key)) fails.set(key, { kind, ...r, stories: [] });
    const f = fails.get(key);
    if (f.stories.length < 3 && !f.stories.includes(story.id)) f.stories.push(story.id);
  };

  return {
    name: "forced-colors",
    viewports: ["desktop"],

    async visit(page, story) {
      checked += 1;
      for (const r of await page.evaluate(boundaryProbe)) note("boundary", r, story);
      await page.emulateMedia({ forcedColors: "active" });
      try {
        await page.waitForTimeout(50);
        for (const r of await page.evaluate(stateProbe)) note("state", r, story);

        /* Tab from the top of the document, so :focus-visible applies as it
           does for a keyboard reader. Stop when focus leaves the story or
           comes back round. */
        await page.evaluate(() => {
          document.activeElement?.blur?.();
          window.scrollTo(0, 0);
        });
        const seen = new Set();
        for (let i = 0; i < TABS; i++) {
          await page.keyboard.press("Tab");
          const handle = await page.evaluateHandle(() => document.activeElement);
          const r = await page.evaluate(focusProbe);
          const inRoot = await handle.evaluate((el) => !!el.closest("#storybook-root, [data-tk]"));
          const id = await handle.evaluate((el) => {
            el.__fcId ??= Math.random().toString(36).slice(2);
            return el.__fcId;
          });
          await handle.dispose();
          if (!r || !inRoot || seen.has(id)) break;
          seen.add(id);
          if (r.skip) continue;
          focused += 1;
          if (!r.outlined) note("focus", r, story);
        }
      } finally {
        await page.evaluate(() => document.activeElement?.blur?.()).catch(() => {});
        await page.emulateMedia({ forcedColors: "none" });
      }
    },

    report() {
      const list = [...fails.values()];
      console.log(
        `\ntokenkit forced-colours gate — ${checked} stories under forced-colors: active, ${focused} focus stops\n`,
      );
      for (const f of list) {
        console.log(`FAIL  ${f.kind.padEnd(8)} ${(f.what + (f.variant ? ` (${f.variant})` : "")).padEnd(34)} ${f.reason}`);
        if (verbose || list.length < 40) console.log(`        in ${f.stories.join(", ")}`);
      }
      if (list.length) {
        console.log(`\n${list.length} distinct failure(s).\n\nForced-colours gate FAILED.`);
        return false;
      }
      console.log("0 fail\n\nForced-colours gate passed.");
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([forcedColorsCheck()])) ? 0 : 1);
}
