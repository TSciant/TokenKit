/**
 * WCAG contrast math. Plain ESM so Node and the browser run the identical
 * code — the gate and the UI cannot drift, because there is only one copy.
 *
 * Reference: WCAG 2.2 relative luminance and contrast ratio definitions.
 */

/** Accepts #rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), and the keyword transparent. */
export function parseColor(input) {
  if (input == null) return null;
  const s = String(input).trim().toLowerCase();

  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  const hex = /^#([0-9a-f]{3,8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = parseInt(h.slice(0, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
  }

  // rgb(0 0 0 / 50%) and rgb(0, 0, 0, 0.5) both appear in computed styles.
  const rgb = /^rgba?\(([^)]+)\)$/.exec(s);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const num = (v) =>
      v.endsWith("%") ? (parseFloat(v) / 100) * 255 : parseFloat(v);
    const alpha = (v) =>
      v == null ? 1 : v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v);
    return {
      r: Math.round(num(parts[0])),
      g: Math.round(num(parts[1])),
      b: Math.round(num(parts[2])),
      a: alpha(parts[3]),
    };
  }

  return null;
}

/** Composite a translucent colour over an opaque backdrop. */
export function flatten(fg, bg) {
  if (fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b, a: 1 };
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

function channelToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color) {
  const c = typeof color === "string" ? parseColor(color) : color;
  if (!c) return null;
  return (
    0.2126 * channelToLinear(c.r) +
    0.7152 * channelToLinear(c.g) +
    0.0722 * channelToLinear(c.b)
  );
}

/**
 * Contrast ratio. `backdrop` is required when either colour may be
 * translucent — WCAG is defined over composited colours, and skipping the
 * composite is the most common way a gate reports a passing ratio for a pair
 * that fails on screen.
 */
export function contrastRatio(fg, bg, backdrop) {
  let f = typeof fg === "string" ? parseColor(fg) : fg;
  let b = typeof bg === "string" ? parseColor(bg) : bg;
  if (!f || !b) return null;

  const base = backdrop
    ? typeof backdrop === "string"
      ? parseColor(backdrop)
      : backdrop
    : { r: 255, g: 255, b: 255, a: 1 };

  b = flatten(b, base);
  f = flatten(f, b);

  const L1 = relativeLuminance(f);
  const L2 = relativeLuminance(b);
  if (L1 == null || L2 == null) return null;
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

/** Thresholds by what the pair actually is. */
export const THRESHOLD = {
  /** 1.4.3 — body text */
  textNormal: 4.5,
  /** 1.4.3 — >=24px, or >=18.66px bold */
  textLarge: 3,
  /** 1.4.6 — AAA body text */
  textNormalAAA: 7,
  /** 1.4.11 — UI component boundaries and meaningful graphics */
  nonText: 3,
  /** 1.4.11 — focus indicator against adjacent colours */
  focus: 3,
};

export function judge(fg, bg, kind = "textNormal", backdrop) {
  const ratio = contrastRatio(fg, bg, backdrop);
  if (ratio == null) {
    return { ratio: null, required: THRESHOLD[kind], pass: false, kind, reason: "unparseable" };
  }
  const required = THRESHOLD[kind];
  return { ratio, required, pass: ratio >= required, kind, reason: null };
}

/** Pick whichever ink wins against a fill. */
export function pickInk(bg, light = "#ffffff", dark = "#111111") {
  const a = contrastRatio(light, bg) ?? 0;
  const b = contrastRatio(dark, bg) ?? 0;
  return a >= b ? light : dark;
}

export function format(ratio) {
  return ratio == null ? "n/a" : `${ratio.toFixed(2)}:1`;
}
