/**
 * Nudge a brand colour until it passes, and move it as little as possible.
 *
 * Holds hue exactly, walks lightness (and saturation, reluctantly) until every
 * contrast constraint is satisfied, and returns the passing colour closest to
 * the original in OKLab. tools/nudge-color.mjs is the command line for this and
 * explains how to read the result; the pack generator and the Loops and Flows
 * page call it directly. One solver, like one copy of the contrast maths.
 */

import { contrastRatio, parseColor } from "./contrast.mjs";
import { deltaE } from "./oklab.mjs";

/* --- colour space ---------------------------------------------------------
   HSL for the walk, because lightness and saturation are the two knobs a
   brand book actually talks in. OKLab for the distance, because HSL is not
   perceptually uniform and ranking candidates by HSL distance picks the
   wrong winner — an equal step of HSL lightness is a much larger perceived
   change in a saturated yellow than in a dark blue.
-------------------------------------------------------------------------- */

const hex = (r, g, b) =>
  "#" +
  [r, g, b]
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

function rgbToHsl({ r, g, b }) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
  const S = s / 100, L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - c / 2;
  const t = h / 60;
  let rgb;
  if (t < 1) rgb = [c, x, 0];
  else if (t < 2) rgb = [x, c, 0];
  else if (t < 3) rgb = [0, c, x];
  else if (t < 4) rgb = [0, x, c];
  else if (t < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 };
}

/**
 * @param {string} color      the brand's stated value
 * @param {Array<{against:string, ratio:number, role:"ink"|"ground"}>} constraints
 * @param {{holdS?:boolean, maxS?:number}} opts
 */
export function nudge(color, constraints, opts = {}) {
  const base = parseColor(color);
  if (!base) throw new Error(`unparseable colour: ${color}`);
  const start = rgbToHsl(base);

  const satisfies = (rgb) =>
    constraints.every((c) => {
      const other = parseColor(c.against);
      const ratio =
        c.role === "ground"
          ? contrastRatio(other, rgb)   /* their ink on our ground */
          : contrastRatio(rgb, other);  /* our ink on their ground */
      return ratio != null && ratio >= c.ratio;
    });

  /* Lightness first, in 0.25% steps out from the original in BOTH directions.
     Both, because the passing side is not always the dark one: a colour that
     fails against a dark ground passes by getting lighter, and a solver that
     only darkens would report no solution for half the real cases.

     Saturation second and grudgingly: desaturating is the move that makes a
     brand colour look washed out, so it is only tried once lightness alone
     has been exhausted, and only within ±25 points. */
  const sBand = opts.holdS ? [0] : [0, -2, 2, -5, 5, -9, 9, -14, 14, -20, 20, -25, 25];

  let best = null;
  for (const ds of sBand) {
    const s = Math.min(100, Math.max(0, start.s + ds));
    for (let step = 0; step <= 400; step += 1) {
      for (const dir of step === 0 ? [0] : [-1, 1]) {
        const l = start.l + dir * step * 0.25;
        if (l < 0 || l > 100) continue;
        const rgb = hslToRgb({ h: start.h, s, l });
        const snapped = parseColor(hex(rgb.r, rgb.g, rgb.b));
        if (!satisfies(snapped)) continue;
        const d = deltaE(base, snapped);
        if (!best || d < best.delta) {
          best = { rgb: snapped, delta: d, hsl: { h: start.h, s, l } };
        }
      }
    }
    /* A solution found with less saturation movement is always closer than
       one found with more, so stop as soon as a band yields anything. */
    if (best) break;
  }

  if (!best) return null;

  const out = hex(best.rgb.r, best.rgb.g, best.rgb.b);
  return {
    from: color.toUpperCase(),
    to: out,
    delta: best.delta,
    verdict:
      best.delta < 0.03 ? "rendition" : best.delta < 0.1 ? "noticeable" : "REBRAND",
    dl: best.hsl.l - start.l,
    ds: best.hsl.s - start.s,
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
