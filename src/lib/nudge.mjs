/**
 * Nudge a brand colour until it passes, and move it as little as possible.
 *
 * Holds hue exactly, walks lightness (and chroma, reluctantly) until every
 * contrast constraint is satisfied, and returns the passing colour closest to
 * the original in OKLab. tools/nudge-color.mjs is the command line for this and
 * explains how to read the result; the pack generator and the Loops and Flows
 * page call it directly. One solver, like one copy of the contrast maths.
 */

import { contrastRatio, parseColor } from "./contrast.mjs";
import { deltaE, gamutMap, oklab, oklch } from "./oklab.mjs";

/* --- colour space ---------------------------------------------------------
   OkLCh for the walk, OKLab for the distance.

   The walk used to be in HSL, because lightness and saturation are the two
   knobs a brand book talks in. But HSL's hue is not the hue a reader sees:
   holding HSL hue while HSL lightness moves lets the perceived hue drift (a
   blue darkened in HSL leans purple), so "hue is never moved" was true of
   the numbers and not of the colour. OkLCh holds perceived hue as a number,
   and its lightness is close to how light the colour looks, so equal steps
   of it are equal steps to the eye.

   Chroma is held while lightness moves, and where a lightness cannot hold
   that chroma in sRGB, gamutMap lowers chroma to the most the screen can
   show there. Strictly: the ramp's mapping ends with a clip that may move
   hue by up to a JND, a few degrees on a saturated orange, and a nudge
   promises hue does not move at all, so it takes the colour fully inside
   the gamut instead. That is the move the old saturation band was
   mostly making by hand. A deliberate chroma reduction is still tried, last
   and in small steps, for the case lightness alone cannot solve.

   The distance is plain ΔEOK, as before, because the verdict's thresholds
   (0.03 rendition, 0.10 rebrand) were set against it. ΔEOK undercounts
   chroma, so the result also carries ΔEOK2 (a and b doubled, CSS Color 4
   §20), which says more honestly how far a chroma move went.
-------------------------------------------------------------------------- */

const hex = ({ r, g, b }) =>
  "#" +
  [r, g, b]
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

/* ΔEOK2: OKLab distance with a and b doubled, so chroma counts as much as a reader sees it. */
function deltaE2(x, y) {
  const A = oklab(x);
  const B = oklab(y);
  return Math.hypot(A.L - B.L, 2 * (A.a - B.a), 2 * (A.b - B.b));
}

/**
 * @param {string} color      the brand's stated value
 * @param {Array<{against:string, ratio:number, role:"ink"|"ground"}>} constraints
 * @param {{holdS?:boolean}} opts  holdS: no deliberate chroma reduction (the
 *   gamut can still lower chroma at a lightness that cannot hold it)
 */
export function nudge(color, constraints, opts = {}) {
  const base = parseColor(color);
  if (!base) throw new Error(`unparseable colour: ${color}`);
  const start = oklch(base);

  const satisfies = (rgb) =>
    constraints.every((c) => {
      const other = parseColor(c.against);
      const ratio =
        c.role === "ground"
          ? contrastRatio(other, rgb)   /* their ink on our ground */
          : contrastRatio(rgb, other);  /* our ink on their ground */
      return ratio != null && ratio >= c.ratio;
    });

  /* Lightness first, in steps of 0.0025 OkLCh L out from the original in BOTH
     directions. Both, because the passing side is not always the dark one: a
     colour that fails against a dark ground passes by getting lighter, and a
     solver that only darkens would report no solution for half the real
     cases.

     Chroma second and grudgingly: losing chroma is the move that makes a
     brand colour look washed out, so it is only tried once lightness alone
     has been exhausted, as a share of the original chroma, down to 60%. */
  const cBand = opts.holdS ? [1] : [1, 0.95, 0.9, 0.85, 0.8, 0.7, 0.6];

  let best = null;
  for (const k of cBand) {
    const C = start.C * k;
    for (let step = 0; step <= 400; step += 1) {
      for (const dir of step === 0 ? [0] : [-1, 1]) {
        const L = start.L + dir * step * 0.0025;
        if (L < 0 || L > 1) continue;
        const rgb = parseColor(hex(gamutMap({ L, C, h: start.h }, { strict: true })));
        if (!satisfies(rgb)) continue;
        const d = deltaE(base, rgb);
        if (!best || d < best.delta) best = { rgb, delta: d };
      }
    }
    /* A solution found with less chroma given up is always preferred to one
       found with more, so stop as soon as a band yields anything. */
    if (best) break;
  }

  if (!best) return null;

  const out = hex(best.rgb);
  const end = oklch(best.rgb);
  return {
    from: color.toUpperCase(),
    to: out,
    delta: best.delta,
    delta2: deltaE2(base, best.rgb),
    verdict:
      best.delta < 0.03 ? "rendition" : best.delta < 0.1 ? "noticeable" : "REBRAND",
    /* Moves in OkLCh, as delivered: lightness in points (L × 100) and chroma in
       OkLCh units. The chroma move includes whatever the gamut took. */
    dl: (end.L - start.L) * 100,
    dc: end.C - start.C,
    ratios: constraints.map((c) => {
      const other = parseColor(c.against);
      const was =
        c.role === "ground" ? contrastRatio(other, base) : contrastRatio(base, other);
      const now =
        c.role === "ground"
          ? contrastRatio(other, best.rgb)
          : contrastRatio(best.rgb, other);
      return { ...c, was, now };
    }),
  };
}
