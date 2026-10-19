"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useMotionPaused } from "./PauseMotion";
import { readTachTokens, drawTachometer } from "../../lib/tachometer-draw.mjs";

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

/* The drawing lives in src/lib/tachometer-draw.mjs, so a page without React draws
   the same dial (and the light pack's hatched red zone comes with it). */
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
  /* Where the dial was, so pausing or a pack change holds the current feature instead of starting over. */
  const held = useRef<{ featIdx: number; needle: number | null }>({ featIdx: 0, needle: null });
  const [live, setLive] = useState({
    label: label ?? "VALUE",
    reading: reading ?? "0%",
    norm: typeof value === "number" ? value : 0,
  });
  const featList = features && features.length ? features : FEATURES;
  const controlled = typeof value === "number";
  const shouldAnimate = animated ?? !controlled;
  /* Paused by the reader or reduced by the device: the needle goes straight to its value and the features stop cycling. */
  const still = useMotionPaused();
  /* Cycling on its own, the reading changes every few seconds: not announced while it does (the APG carousel's rule). */
  const cycling = !controlled && shouldAnimate && !still;
  const labelId = useId();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let running = true;
    let featIdx = held.current.featIdx % featList.length;
    let needle = controlled ? Math.max(0, Math.min(1, value as number)) : held.current.needle ?? 0;
    let lastSwap = 0;
    let lastAnnounce = 0;
    const list = featList;
    const reduce = still;

    /* One frame: move the needle a step and draw. True while there is still somewhere to go. */
    const frame = (nowMs: number) => {
      const time = nowMs / 1000;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const root =
        canvas.closest("[data-brand]") ||
        canvas.closest("[data-tk]") ||
        document.documentElement;
      const tokens = readTachTokens(root);
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
      drawTachometer(ctx, w, h, tokens, needle, featIdx, list, label, readingText);
      held.current = { featIdx, needle };

      if (nowMs - lastAnnounce > 400) {
        lastAnnounce = nowMs;
        setLive({
          label: labelText,
          reading: readingText ?? `${Math.round(needle * 100)}%`,
          norm: needle,
        });
      }

      return cycling || Math.abs(target - needle) > 0.001;
    };

    /* Frames only while something moves; a settled or still dial is drawn once, and again when its box or the page's pack changes. */
    const loop = (nowMs: number) => {
      if (!running) return;
      raf = frame(nowMs) ? requestAnimationFrame(loop) : 0;
    };
    const redraw = () => { if (running && !raf) raf = requestAnimationFrame(loop); };
    const ro = new ResizeObserver(redraw);
    ro.observe(canvas);
    const mo = new MutationObserver(redraw);
    mo.observe(document.documentElement, { attributes: true, subtree: false });
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    };
  }, [value, label, reading, features, shouldAnimate, controlled, featList, still, cycling]);

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
        data-motion-class="decor"
        aria-hidden="true"
      />
      <p data-tk="visually-hidden" id={labelId} aria-live={cycling ? "off" : "polite"}>
        {live.label}: {live.reading}
      </p>
    </div>
  );
}
