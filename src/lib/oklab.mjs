/**
 * OKLab and OKLCh — one implementation, three callers.
 *
 * tools/nudge-color.mjs already had these matrices; so would the ramp
 * generator, and so would any story that wants to draw a derived ramp. Three
 * copies of Björn Ottosson's constants is three chances to mistype one, and
 * the mistype does not throw — it produces a colour that is slightly wrong
 * everywhere it is used and looks like a taste decision.
 *
 * WHY OKLab RATHER THAN HSL. Interpolating two colours in sRGB or HSL runs
 * the line through whatever the encoding happens to put between them: mid-way
 * from a saturated blue to white in HSL is a blue that has lost most of its
 * chroma and none of its lightness, and a ramp built that way has a dead step
 * in it. OKLab is perceptually uniform enough that equal steps LOOK equal,
 * which is the only property a ramp actually needs.
 *
 * WHY OKLCh FOR RAMPS SPECIFICALLY. A ramp from a brand colour to white has
 * to keep the hue. In OKLab that means interpolating a and b, and two colours
 * of the same hue but different chroma do not lie on a line through the
 * origin — so the hue drifts. Polar form holds hue as a number and
 * interpolates it as one.
 */

const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const fromLinear = (c) =>
  Math.round(255 * clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));

/** sRGB (0–255 per channel) → OKLab. */
export function oklab({ r, g, b }) {
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** OKLab → sRGB (0–255 per channel), clamped into gamut. */
export function srgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/** Perceptual distance. Under 0.03 is a rendition; over 0.10 is another colour. */
export function deltaE(x, y) {
  const A = oklab(x);
  const B = oklab(y);
  return Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b);
}

/** OKLab → OKLCh. Hue in degrees. */
export function oklch(rgb) {
  const { L, a, b } = oklab(rgb);
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

/** OKLCh → sRGB. */
export function fromOklch({ L, C, h }) {
  const rad = (h * Math.PI) / 180;
  return srgb({ L, a: C * Math.cos(rad), b: C * Math.sin(rad) });
}

export const hex = ({ r, g, b }) =>
  `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

export function parseHex(input) {
  const m = String(input).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const s = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

/**
 * N colours from `light` to `dark`, inclusive of both ends.
 *
 * Hue travels the SHORT way round. A ramp whose two ends sit either side of
 * 0° — a warm red and a cool red, say — otherwise walks 340 degrees through
 * green to get somewhere 20 degrees away, and the middle of the ramp is a
 * colour from another brand entirely.
 *
 * Chroma is interpolated rather than held, because holding it is what makes
 * a derived ramp look synthetic: a real brand's pale tint is not its mid-tone
 * at higher lightness, it is also less saturated. Where an end is achromatic
 * — white, black, a true grey — its hue is meaningless and the other end's
 * hue is used for the whole ramp, which is why a brand can hand this a single
 * colour and white and still get its own ramp back.
 */
export function ramp(light, dark, steps) {
  const a = oklch(typeof light === "string" ? parseHex(light) : light);
  const b = oklch(typeof dark === "string" ? parseHex(dark) : dark);
  const n = Math.max(2, Math.round(steps));

  const ACHROMATIC = 0.002;
  const hueA = a.C < ACHROMATIC ? b.h : a.h;
  const hueB = b.C < ACHROMATIC ? a.h : b.h;
  let d = hueB - hueA;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;

  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(
      fromOklch({
        L: a.L + (b.L - a.L) * t,
        C: a.C + (b.C - a.C) * t,
        h: (hueA + d * t + 360) % 360,
      }),
    );
  }
  return out;
}

/** Sort colours lightest first, by OKLab L. */
export function byLightness(entries, get = (x) => x) {
  return [...entries].sort((x, y) => {
    const a = parseHex(get(x));
    const b = parseHex(get(y));
    if (!a || !b) return 0;
    return oklab(b).L - oklab(a).L;
  });
}
