/* The tachometer's drawing, as a plain module so any page can draw it, not
   only React: Tachometer.tsx calls it each frame, and a page without React
   (the ds-corpus exchange views) imports it the same way.

     import { readTachTokens, drawTachometer } from "…/src/lib/tachometer-draw.mjs";
     drawTachometer(ctx, width, height, readTachTokens(el), needle, featIdx, features, label, reading);

   Colours come from the pack's tokens at draw time. The red zone (the last
   18% of the dial) is the pack's danger line; when that line cannot stand out
   against the dial (a grey pack, where danger is near-black on a near-black
   pod), the zone is drawn hatched in the dial's text colour instead, so it is
   carried by shape, not hue (the wireframe packs stay grey; status is never
   colour alone). */

/** @param {Element | null} el */
export function readTachTokens(el) {
  const cs = getComputedStyle(el ?? document.documentElement);
  return {
    "--ink": cs.getPropertyValue("--tk-text-primary").trim() || "#1f1f1f",
    "--bg": cs.getPropertyValue("--tk-surface-default").trim() || "#ffffff",
    "--accent": cs.getPropertyValue("--tk-action-fill").trim() || "#1f1f1f",
    "--danger": cs.getPropertyValue("--tk-status-danger-line").trim() || "#e23a3a",
    "--font-display": cs.getPropertyValue("--tk-font-sans").trim() || "system-ui, sans-serif",
  };
}

/** @param {string} color */
export function toHex(color) {
  const c = (color || "").trim();
  if (!c) return "#111111";
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    if (/^[0-9a-fA-F]{6}$/.test(h)) return `#${h}`;
  }
  const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (m) {
    const r = Math.round(Math.min(255, parseFloat(m[1])));
    const g = Math.round(Math.min(255, parseFloat(m[2])));
    const b = Math.round(Math.min(255, parseFloat(m[3])));
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillStyle = c;
      const got = String(ctx.fillStyle);
      if (got.startsWith("#")) return toHex(got);
      const m2 = got.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
      if (m2) return toHex(`rgb(${m2[1]},${m2[2]},${m2[3]})`);
    }
  } catch {
    /* ignore */
  }
  return "#888888";
}

/** @param {string} hex */
function lum(hex) {
  const h = toHex(hex).replace("#", "");
  const n = parseInt(h || "0", 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** @param {string} hex @param {number} a */
function rgba(hex, a) {
  const h = toHex(hex).replace("#", "");
  const n = parseInt(h || "0", 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** @param {string} hex @param {number} amt */
function shade(hex, amt) {
  const h = toHex(hex).replace("#", "");
  const n = parseInt(h || "0", 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt < 0) {
    const f = 1 + amt;
    r = Math.round(r * f);
    g = Math.round(g * f);
    b = Math.round(b * f);
  } else {
    r = Math.round(r + (255 - r) * amt);
    g = Math.round(g + (255 - g) * amt);
    b = Math.round(b + (255 - b) * amt);
  }
  return `rgb(${r},${g},${b})`;
}

/* How far apart two colours sit, as a luminance ratio (1 = the same). */
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/**
 * Draw one frame of the dial.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w @param {number} h
 * @param {Record<string, string>} tokens from readTachTokens
 * @param {number} needle 0 to 1
 * @param {number} featIdx which feature is shown
 * @param {{ label: string; val: string; norm: number }[]} features
 * @param {string} [labelOverride] @param {string} [readingOverride]
 */
export function drawTachometer(ctx, w, h, tokens, needle, featIdx, features, labelOverride, readingOverride) {
  const cx = w / 2;
  const cy = h * 0.55;
  const R = Math.min(w, h) * 0.4;
  const a0 = Math.PI * 0.75;
  const span = Math.PI * 1.5;
  const a1 = a0 + span;
  const ink = tokens["--ink"] || "#111";
  const bg = tokens["--bg"] || "#fff";
  const inkL = lum(ink);
  const bgL = lum(bg);
  const podBase = inkL < bgL ? ink : bg;
  const textC = inkL < bgL ? bg : ink;
  const rawAcc = tokens["--accent"] || textC;
  const acc = lum(rawAcc) < 0.33 ? textC : rawAcc;
  const fontD = tokens["--font-display"] || "system-ui, sans-serif";
  const dkO = shade(podBase, -0.5);
  const dkI = shade(podBase, -0.14);
  const nd = Math.max(0, Math.min(1, needle));
  const rawDanger = toHex(tokens["--danger"] || "#e23a3a");
  /* Can the danger line be seen on the pod? If not, the zone is hatched in the text colour. */
  const dangerSeen = ratio(rawDanger, dkI) >= 2 && ratio(rawDanger, dkO) >= 2;
  const danger = dangerSeen ? rawDanger : toHex(textC);

  const g = ctx.createRadialGradient(cx, cy - R * 0.25, R * 0.2, cx, cy, R * 1.35);
  g.addColorStop(0, dkI);
  g.addColorStop(1, dkO);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.24, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgba(acc, 0.22);
  ctx.stroke();
  ctx.lineCap = "round";
  ctx.lineWidth = R * 0.085;
  ctx.strokeStyle = rgba(textC, 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0, a1);
  ctx.stroke();
  ctx.save();
  ctx.strokeStyle = danger;
  if (!dangerSeen) { ctx.lineCap = "butt"; ctx.setLineDash([R * 0.035, R * 0.035]); }
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0 + span * 0.82, a1);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.shadowColor = toHex(acc);
  ctx.shadowBlur = R * 0.16;
  ctx.strokeStyle = toHex(acc);
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0, a0 + span * Math.max(0.001, nd));
  ctx.stroke();
  ctx.restore();
  for (let k = 0; k <= 10; k++) {
    const ang = a0 + span * (k / 10);
    const inR = k % 5 === 0 ? R * 0.84 : R * 0.9;
    const outR = R * 0.96;
    ctx.strokeStyle = k >= 9 ? rgba(danger, 0.85) : rgba(textC, 0.4);
    ctx.lineWidth = k % 5 === 0 ? 2 : k >= 9 && !dangerSeen ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * inR, cy + Math.sin(ang) * inR);
    ctx.lineTo(cx + Math.cos(ang) * outR, cy + Math.sin(ang) * outR);
    ctx.stroke();
  }
  const dn = features.length;
  const gp = R * 0.13;
  const sx = cx - (gp * (dn - 1)) / 2;
  const dy = cy - R * 0.46;
  for (let i = 0; i < dn; i++) {
    ctx.beginPath();
    ctx.arc(sx + i * gp, dy, R * 0.028, 0, Math.PI * 2);
    ctx.fillStyle = i === featIdx ? toHex(acc) : rgba(textC, 0.25);
    ctx.fill();
  }
  const na = a0 + span * nd;
  ctx.strokeStyle = toHex(acc);
  ctx.lineWidth = R * 0.03;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(na) * R * 0.15, cy - Math.sin(na) * R * 0.15);
  ctx.lineTo(cx + Math.cos(na) * R * 0.82, cy + Math.sin(na) * R * 0.82);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.085, 0, Math.PI * 2);
  ctx.fillStyle = toHex(acc);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.038, 0, Math.PI * 2);
  ctx.fillStyle = dkO;
  ctx.fill();
  const f = features[featIdx] || features[0];
  const valText = readingOverride ?? (f ? f.val : `${Math.round(nd * 100)}`);
  const labelText = (labelOverride ?? (f ? f.label : "VALUE")).toUpperCase();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let fs = R * 0.4;
  if (valText.length > 3) fs = R * 0.33;
  if (valText.length > 5) fs = R * 0.27;
  ctx.fillStyle = toHex(textC);
  ctx.font = `600 ${Math.round(fs)}px ${fontD}, sans-serif`;
  ctx.fillText(valText, cx, cy + R * 0.42);
  ctx.fillStyle = toHex(acc);
  ctx.font = `500 ${Math.round(R * 0.135)}px ${fontD}, monospace`;
  ctx.fillText(labelText.split("").join(" "), cx, cy + R * 0.7);
}
