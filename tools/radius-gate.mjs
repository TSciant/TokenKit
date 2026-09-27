#!/usr/bin/env node
/**
 * Radius gate — one rule, checked everywhere.
 *
 *     inner radius = outer radius - the gap between them
 *
 * Two rounded boxes whose arcs do not share a centre look approximate no
 * matter how careful the rest of the page is, and the eye catches it long
 * before anyone can say why. The rule is not a preference; it is the only
 * inner radius that is concentric with a given outer one.
 *
 * The gap is the CONTAINER'S PADDING on that side, not the geometric distance
 * between the two boxes. A field stretched across a grid column sits 230px
 * from its card's left edge and still wants the card's radius less the card's
 * padding: the arc it has to agree with is the corner, and the corner is one
 * padding away.
 *
 * Two things are outside the rule and are skipped:
 *
 *   capsules    --tk-radius-full is a shape, not a rounded rectangle
 *   bleed       a child flush to the parent's edge shares its arc exactly
 *
 *   npm run build-storybook && npm run radius
 *   npm run radius -- --verbose      print every pair, not just the failures
 *
 * Every story, not a title-prefix subset: a filter on the sidebar title once
 * stopped matching after a renumber and the gate reported "0 pass · 0 fail —
 * passed" for every run. The paints() test below already scopes this to real
 * rounded boxes, so a story with none contributes nothing.
 *
 * `npm run gates` runs this in the same browser pass as the other story gates.
 */

import { isMain, runChecks } from "./lib/stories.mjs";

const probe = () => {
  const px = (v) => parseFloat(v) || 0;
  const CAPSULE = 500;
  const out = [];

  const paints = (cs) => {
    const bg = cs.backgroundColor;
    const opaque = bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg);
    /* All four sides, not any one. A card-footer or a chat-composer carries a
       single hairline across its top: that is a rule line separating two parts
       of one box, not a second box inside the first. It has no corners, so
       there is nothing for a corner to agree with — and demanding one would
       mean rounding a divider, which is not a thing. */
    const boxed =
      px(cs.borderTopWidth) > 0 &&
      px(cs.borderRightWidth) > 0 &&
      px(cs.borderBottomWidth) > 0 &&
      px(cs.borderLeftWidth) > 0;
    return opaque || boxed || cs.backgroundImage !== "none";
  };

  for (const el of document.querySelectorAll("[data-tk], fieldset, input, select, textarea, button")) {
    const cs = getComputedStyle(el);
    const inner = px(cs.borderTopLeftRadius);
    if (inner >= CAPSULE) continue;

    /* The rule is about two rounded BOXES. A span, a label, a paragraph —
       anything with no background and no border — is not a box, has no corner,
       and cannot disagree with one. Checking them reported fifteen failures
       that were all text. */
    if (!paints(cs)) continue;

    /* Inline-level boxes are not boxes either. A <mark> inside a card paints a
       background and takes a small radius, but it is a highlight that flows
       with the text — it has no corner to agree with, and its position in the
       card is whatever the line-breaking decided. */
    if (/^inline/.test(cs.display)) continue;

    /* Third-party chrome. Inside the map canvas the DOM belongs to maplibre,
       whose control group is styled by its own stylesheet. The kit re-skins it
       (see map.css) but does not own its geometry, and a gate that fails on
       someone else's button is a gate people start ignoring. */
    if (el.closest('[data-tk="map-canvas"]')) continue;

    let a = el.parentElement;
    let host = null;
    while (a && a !== document.body) {
      const acs = getComputedStyle(a);
      const ar = px(acs.borderTopLeftRadius);
      if (ar > 0 && ar < CAPSULE) { host = { el: a, r: ar, cs: acs }; break; }
      a = a.parentElement;
    }
    if (!host) continue;

    const er = el.getBoundingClientRect();
    const hr = host.el.getBoundingClientRect();
    /* Bleeding: either declared, or flush to the host's edge by geometry.
       getBoundingClientRect is the border box, so a host with a 1px border
       puts its flush child 1px inside it. Measuring from the padding edge is
       what "flush" actually means — without this a bled site-header inside a
       hairlined preview frame reads as a 1px gap and fails. */
    if (el.hasAttribute("data-bleed")) continue;
    const bl = px(host.cs.borderLeftWidth);
    const bt = px(host.cs.borderTopWidth);
    if (er.left < hr.left + bl + 0.5 || er.top < hr.top + bt + 0.5) continue;

    // The gap is the host's padding, which is where the corner actually is.
    const gap = Math.max(px(host.cs.paddingLeft), px(host.cs.paddingTop));

    /* Once the padding is as large as the host's radius, the arc has already
       closed before the child begins: the child is not in the corner and the
       corner imposes nothing on it. The old `Math.max(0, r - gap)` turned "no
       constraint" into "must be square", which is a different rule and a
       wrong one — it failed every specimen sitting on a lightly rounded
       documentation stage. */
    if (gap >= host.r) continue;
    const expect = host.r - gap;

    out.push({
      what: el.getAttribute("data-tk") || el.tagName.toLowerCase(),
      host: host.el.getAttribute("data-tk") || host.el.tagName.toLowerCase(),
      inner: Math.round(inner * 10) / 10,
      outer: Math.round(host.r * 10) / 10,
      gap: Math.round(gap * 10) / 10,
      expect: Math.round(expect * 10) / 10,
      ok: Math.abs(inner - expect) <= 1.5,
    });
  }
  return out;
};

export function radiusCheck(argv = process.argv.slice(2)) {
  const verbose = argv.includes("--verbose");
  const seen = new Set();
  const rows = [];

  return {
    name: "radius",
    viewports: ["desktop"],

    async visit(page, story) {
      for (const r of await page.evaluate(probe)) {
        const key = `${r.what}|${r.host}|${r.outer}|${r.gap}|${r.inner}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ ...r, story: story.id });
      }
    },

    report() {
      const fails = rows.filter((r) => !r.ok);
      console.log(`\ntokenkit radius gate — ${rows.length} distinct nested pairs, rule: inner = outer - gap\n`);
      console.log("      CHILD                HOST             OUTER   GAP   INNER  EXPECT");
      console.log("-".repeat(78));
      for (const r of rows) {
        if (!verbose && r.ok) continue;
        const tag = r.ok ? "ok  " : "FAIL";
        console.log(
          `${tag}  ${r.what.padEnd(20)} ${r.host.padEnd(16)} ${String(r.outer).padEnd(7)} ${String(r.gap).padEnd(5)} ${String(r.inner).padEnd(6)} ${r.expect}`,
        );
      }
      console.log("-".repeat(78));
      console.log(`${rows.length - fails.length} pass · ${fails.length} fail`);
      if (fails.length) {
        console.log("\nRadius gate FAILED.");
        for (const f of fails) console.log(`  ${f.what} in ${f.host} (${f.story}): ${f.inner}px, expected ${f.expect}px`);
        return false;
      }
      console.log("\nRadius gate passed.");
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([radiusCheck()])) ? 0 : 1);
}
