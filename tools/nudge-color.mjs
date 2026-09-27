#!/usr/bin/env node
/**
 * Nudge a brand colour until it passes, and move it as little as possible.
 *
 * The problem this solves comes up on every brand book and has exactly two
 * bad answers. The first is to ship the brand colour where it fails, which is
 * how a button arrives with a label nobody can read. The second is to give
 * the job to a different colour from the palette — a grey ring instead of an
 * orange one — which passes, and quietly tells the client their brand does
 * not apply to the parts of the page people actually use.
 *
 * The third answer is to keep the colour and move it. A brand colour is a
 * HUE plus a specific rendition of it; the hue is what anyone recognises and
 * the last few points of lightness are not. So this holds hue exactly, walks
 * lightness (and saturation, reluctantly) until every constraint is
 * satisfied, and returns the passing colour closest to the original in OKLab
 * — which is a perceptual distance, not an sRGB one, so "closest" means what
 * a person would say it means rather than what the arithmetic finds
 * convenient.
 *
 *   node tools/nudge-color.mjs --color "#F59E0B" --on "#FFFFFF:3" --on "#E5E7EB:3"
 *   node tools/nudge-color.mjs --color "#E11D7A" --under "#FFFFFF:4.5"
 *
 *   --on    <hex:ratio>   this colour is the INK, drawn on that ground
 *   --under <hex:ratio>   that colour is the ink, drawn on THIS one
 *   --hold-s              refuse to move saturation, lightness only
 *
 * WHAT THE OUTPUT MEANS, and the part worth reading before trusting it.
 *
 * ΔE is reported in OKLab units, where roughly 0.02 is the threshold a
 * careful eye starts to notice on adjacent swatches and 0.10 is plainly a
 * different colour. A nudge under ~0.03 is a rendition; a nudge over ~0.10 is
 * a rebrand and should be sent back to whoever owns the brand rather than
 * quietly shipped. The tool does not refuse large nudges — it prints them
 * with a verdict, because the decision is the designer's and the number is
 * only there so the decision is an informed one.
 *
 * Hue is never moved. A hue shift is the one change that reads as "wrong
 * colour" rather than "same colour, different light", and no contrast floor
 * is worth it: if hue movement were allowed, the solver would happily walk
 * orange to brown and report a small ΔE.
 */

import { pathToFileURL } from "node:url";
import { format } from "../src/lib/contrast.mjs";
import { nudge } from "../src/lib/nudge.mjs";

/* The solver lives in src/lib/nudge.mjs so the browser can run the same one.
   Re-exported for the pack generator, which imports it from here. */
export { nudge };

/* --- cli ----------------------------------------------------------------- */

function report(label, r) {
  if (!r) {
    console.log(`${label}: no value on this hue satisfies every constraint.`);
    return;
  }
  const sign = (n) => (n >= 0 ? "+" : "") + n.toFixed(1);
  console.log(
    `${label.padEnd(26)} ${r.from} → ${r.to}   ΔE ${r.delta.toFixed(4)} ` +
      `(${r.verdict})   L ${sign(r.dl)}  S ${sign(r.ds)}`,
  );
  for (const c of r.ratios) {
    console.log(
      `    ${c.role === "ground" ? "under" : "   on"} ${c.against}  ` +
        `${format(c.was).padStart(6)} → ${format(c.now).padStart(6)}  (needs ${c.ratio}:1)`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const get = (flag) =>
    argv.reduce((acc, a, i) => (a === flag ? argv[i + 1] : acc), undefined);
  const all = (flag) =>
    argv.reduce((acc, a, i) => (a === flag ? [...acc, argv[i + 1]] : acc), []);

  const color = get("--color");
  if (!color) {
    console.error("usage: node tools/nudge-color.mjs --color <hex> --on <hex:ratio> ...");
    process.exit(2);
  }
  const parse = (spec, role) => {
    const [against, ratio] = spec.split(":");
    return { against, ratio: Number(ratio), role };
  };
  const constraints = [
    ...all("--on").map((s) => parse(s, "ink")),
    ...all("--under").map((s) => parse(s, "ground")),
  ];
  if (!constraints.length) {
    console.error("give at least one --on or --under constraint");
    process.exit(2);
  }
  report(color, nudge(color, constraints, { holdS: argv.includes("--hold-s") }));
}
