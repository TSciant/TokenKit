"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

export type TachFeature = { label: string; val: string; norm: number };

const FEATURES: TachFeature[] = [
  { label: "ALIGN", val: "72%", norm: 0.72 },
  { label: "TOKENS", val: "atoms", norm: 0.86 },
  { label: "CQ", val: "box", norm: 0.64 },
  { label: "PRETEXT", val: "layout", norm: 0.81 },
  { label: "MEANT", val: "≈Got", norm: 0.9 },
  { label: "PACKS", val: "2", norm: 0.5 },
];

export type TachometerProps = {
  /** Needle position 0–1. When set, dial follows this (controlled). */
  value?: number;
  /** Override center label. */
  label?: string;
  /** Override reading under the needle. */
  reading?: string;
  /** Optional feature list; cycles when animated and value is unset. */
  features?: TachFeature[];
  /** Auto-cycle features + ease needle (default true when value unset). */
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
};

function readTokens(el: Element | null) {
  const cs = getComputedStyle(el ?? document.documentElement);
  return {
    "--ink": cs.getPropertyValue("--tk-text-primary").trim() || "#1f1f1f",
    "--bg": cs.getPropertyValue("--tk-surface-default").trim() || "#ffffff",
    "--accent": cs.getPropertyValue("--tk-action-fill").trim() || "#1f1f1f",
    "--danger":
      cs.getPropertyValue("--tk-status-danger-line").trim() || "#e23a3a",
    "--font-display":
      cs.getPropertyValue("--tk-font-sans").trim() || "system-ui, sans-serif",
  };
}

function toHex(color: string): string {
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

function lum(hex: string) {
  const h = toHex(hex).replace("#", "");
  const n = parseInt(h || "0", 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgba(hex: string, a: number) {
  const h = toHex(hex).replace("#", "");
  const n = parseInt(h || "0", 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function shade(hex: string, amt: number) {
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

function drawGauge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tokens: Record<string, string>,
  needle: number,
  featIdx: number,
  features: TachFeature[],
  labelOverride?: string,
  readingOverride?: string,
) {
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
  const danger = toHex(tokens["--danger"] || "#e23a3a");

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
  ctx.strokeStyle = danger;
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0 + span * 0.82, a1);
  ctx.stroke();
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
    ctx.lineWidth = k % 5 === 0 ? 2 : 1;
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
  ctx.fillText(labelText.split("").join("\u200a"), cx, cy + R * 0.7);
}

/**
 * Token-driven tachometer — OutsideIn / QD lineage (P-12).
 * Reads --tk-* CSS vars; canvas is decorative; role=meter + live text carry a11y.
 */
export function Tachometer({
  value,
  label,
  reading,
  features,
  animated,
  className,
  style,
}: TachometerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState({
    label: label ?? "VALUE",
    reading: reading ?? "0%",
    norm: typeof value === "number" ? value : 0,
  });
  const featList = features && features.length ? features : FEATURES;
  const controlled = typeof value === "number";
  const shouldAnimate = animated ?? !controlled;
  const labelId = useId();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let running = true;
    let featIdx = 0;
    let needle = controlled ? Math.max(0, Math.min(1, value as number)) : 0;
    let lastSwap = 0;
    let lastAnnounce = 0;
    const list = featList;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loop = (nowMs: number) => {
      if (!running) return;
      const time = nowMs / 1000;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const root =
        canvas.closest("[data-brand]") ||
        canvas.closest("[data-tk]") ||
        document.documentElement;
      const tokens = readTokens(root);
      const target = controlled
        ? Math.max(0, Math.min(1, value as number))
        : list[featIdx]?.norm ?? 0;

      if (controlled) {
        if (shouldAnimate && !reduce) needle += (target - needle) * 0.12;
        else needle = target;
        featIdx = 0;
      } else if (reduce || !shouldAnimate) {
        needle = list[featIdx]?.norm ?? 0;
      } else {
        if (time - lastSwap > 4.5) {
          featIdx = (featIdx + 1) % list.length;
          lastSwap = time;
        }
        needle += ((list[featIdx]?.norm ?? 0) - needle) * 0.02;
      }

      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      if (
        canvas.width !== Math.round(w * dpr) ||
        canvas.height !== Math.round(h * dpr)
      ) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const f = list[featIdx] || list[0];
      const readingText =
        reading ?? (controlled ? `${Math.round(needle * 100)}%` : f?.val);
      const labelText = label ?? f?.label ?? "VALUE";
      drawGauge(ctx, w, h, tokens, needle, featIdx, list, label, readingText);

      if (nowMs - lastAnnounce > 400) {
        lastAnnounce = nowMs;
        setLive({
          label: labelText,
          reading: readingText ?? `${Math.round(needle * 100)}%`,
          norm: needle,
        });
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [value, label, reading, features, shouldAnimate, controlled, featList]);

  const now = Math.round(live.norm * 100);

  return (
    <div
      data-tk="tachometer"
      className={className}
      style={style}
      role="meter"
      aria-labelledby={labelId}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={now}
      aria-valuetext={`${live.reading}, ${live.label}`}
    >
      <canvas
        ref={canvasRef}
        data-tk="tachometer-canvas"
        aria-hidden="true"
      />
      <p data-tk="visually-hidden" id={labelId} aria-live="polite">
        {live.label}: {live.reading}
      </p>
    </div>
  );
}
