"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useState } from "react";
import type { Transition } from "motion/react";

/* ---------------------------------------------------------------------------
   The bridge between the CSS motion contract and Motion (formerly Framer
   Motion).

   The kit's motion tokens are CSS values — `200ms cubic-bezier(0.2, 0, 0, 1)`.
   Motion wants JavaScript: a number of seconds and a four-number array. Those
   are two different notations for the same decision, and the moment they are
   written down twice they start to drift: someone tunes the CSS hover and the
   JS panel keeps the old curve, and nothing anywhere says they were supposed
   to match.

   So nothing is written down twice. These read the tokens off the document at
   runtime and translate. A brand pack that changes --tk-motion-enter changes
   the CSS transition and the Motion spring in the same edit, because there is
   only one value and both sides are reading it.

   Reading from the document rather than importing a constant is the point: the
   token is resolved in context, so a subtree on a different pack gets that
   pack's pace without anything being threaded through props.
--------------------------------------------------------------------------- */

/** `200ms` / `0.2s` -> seconds, which is what Motion counts in. */
export function durationToSeconds(value: string): number {
  const v = value.trim();
  if (v.endsWith("ms")) return parseFloat(v) / 1000;
  if (v.endsWith("s")) return parseFloat(v);
  const n = parseFloat(v);
  return Number.isFinite(n) ? n / 1000 : 0.2;
}

/** `cubic-bezier(0.2, 0, 0, 1)` -> [0.2, 0, 0, 1]. */
export function easeToArray(value: string): [number, number, number, number] {
  const m = /cubic-bezier\(([^)]+)\)/.exec(value);
  if (m) {
    const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      return parts as [number, number, number, number];
    }
  }
  // The CSS keywords, as their spec-defined curves.
  const named: Record<string, [number, number, number, number]> = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
  };
  return named[value.trim()] ?? [0.2, 0, 0, 1];
}

/**
 * Split a `<duration> <easing>` motion token into its two halves.
 *
 * Splitting on whitespace would break `cubic-bezier(0.2, 0, 0, 1)` at every
 * comma, so the duration is taken off the front and the rest is the curve.
 */
export function parseMotionToken(value: string): Transition {
  const v = value.trim();
  const firstSpace = v.search(/\s/);
  if (firstSpace === -1) return { duration: durationToSeconds(v) };
  return {
    duration: durationToSeconds(v.slice(0, firstSpace)),
    ease: easeToArray(v.slice(firstSpace + 1)),
  };
}

/** Read one motion token off an element, or off :root. */
export function motionToken(name: string, from?: Element | null): Transition {
  const el = from ?? document.documentElement;
  const raw = getComputedStyle(el).getPropertyValue(name);
  return parseMotionToken(raw || "200ms cubic-bezier(0.2, 0, 0, 1)");
}

/**
 * The motion contract, as Motion transitions, resolved in this subtree.
 *
 * Honours prefers-reduced-motion by collapsing every duration to zero rather
 * than by disabling animation: a zero-duration transition still fires its
 * callbacks and still lands in the right end state, so nothing downstream has
 * to branch on whether motion happened. The CSS side does the same thing in
 * 01-reset.css.
 */
export function useMotionTokens(scope?: Element | null) {
  const [tokens, setTokens] = useState<Record<string, Transition>>({});

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    const read = () => {
      const names = [
        "ink",
        "surface",
        "line",
        "elevation",
        "opacity",
        "transform",
        "size",
        "enter",
        "exit",
      ];
      const next: Record<string, Transition> = {};
      for (const n of names) {
        const t = motionToken(`--tk-motion-${n}`, scope);
        next[n] = query.matches ? { ...t, duration: 0 } : t;
      }
      setTokens(next);
    };

    read();
    query.addEventListener("change", read);

    // The pack and density are toolbar globals, so the tokens can change under
    // a mounted component without anything remounting.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-brand", "data-density", "style"],
    });

    return () => {
      query.removeEventListener("change", read);
      observer.disconnect();
    };
  }, [scope]);

  return tokens;
}
