"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
   Measurement hooks.

   Both of these are the legitimate use of an effect: synchronising with the
   layout engine, which is an external system React does not own. Neither
   derives state from props, neither reacts to a state change, and neither
   would be better as a value computed during render.

   Three things they get right that the hand-rolled copies did not:

   1. useLayoutEffect, not useEffect. These read geometry and then write a
      style that changes geometry. On useEffect that lands after paint, so the
      first frame shows the unmeasured size and the second shows the measured
      one — a flash on every mount, which is exactly the "wonky grow" it is
      supposed to prevent.

   2. A callback ref, not a RefObject. A RefObject's .current changes without
      telling anyone, so an effect keyed on it never re-runs and the observers
      stay attached to a node that is no longer in the document. Switching a
      view unmounts one element and mounts another; state re-runs the effect on
      the element itself.

   3. One frame per burst. A ResizeObserver during a drag fires every frame and
      a MutationObserver fires per mutation; measuring synchronously in the
      callback reads layout that the same callback is about to invalidate.
      Coalescing into one rAF is the difference between measuring once and
      measuring per node touched.
--------------------------------------------------------------------------- */

/** Coalesce a burst of observer callbacks into one measurement per frame. */
function useFrameThrottle(fn: () => void) {
  const pending = useRef(0);
  const latest = useRef(fn);
  latest.current = fn;

  return useCallback(() => {
    if (pending.current) return;
    pending.current = requestAnimationFrame(() => {
      pending.current = 0;
      latest.current();
    });
  }, []);
}

/** The element's own border-box inline size. */
export function useInlineSize() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState(0);

  const measure = useCallback(() => {
    if (node) setSize(Math.round(node.getBoundingClientRect().width));
  }, [node]);

  const schedule = useFrameThrottle(measure);

  useLayoutEffect(() => {
    if (!node) return;
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(node);
    return () => ro.disconnect();
  }, [node, measure, schedule]);

  return [setNode, size] as const;
}

/**
 * The block size an element needs in order to contain everything it paints,
 * including descendants positioned outside its flow.
 *
 * Returns undefined when nothing escapes, which is the common case — 24 of the
 * 25 audit rebuilds have no positioned descendant at all. That matters: the
 * expensive part is walking the subtree, so the walk is skipped entirely
 * unless a mutation has put something positioned in it.
 */
export function useStageHeight() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState<number>();

  const measure = useCallback(() => {
    if (!node) return;

    // Is anything actually out of flow? If not there is nothing to reserve,
    // and the subtree walk below is pure cost.
    const escapers: HTMLElement[] = [];
    for (const el of node.querySelectorAll<HTMLElement>("*")) {
      const p = getComputedStyle(el).position;
      if (p === "absolute" || p === "fixed") escapers.push(el);
    }
    if (!escapers.length) {
      setHeight(undefined);
      return;
    }

    // Measure from the frame's top, not its bottom: growing the frame moves
    // its bottom but not a panel anchored to something inside it, so the
    // number is stable and there is no feedback loop.
    const top = node.getBoundingClientRect().top;
    let bottom = top;
    for (const el of escapers) {
      for (const n of [el, ...el.querySelectorAll<HTMLElement>("*")]) {
        const r = n.getBoundingClientRect();
        if (r.height > 0 && r.bottom > bottom) bottom = r.bottom;
      }
    }

    const needed = Math.ceil(bottom - top);
    setHeight((prev) =>
      prev !== undefined && Math.abs(prev - needed) <= 1 ? prev : needed,
    );
  }, [node]);

  const schedule = useFrameThrottle(measure);

  useLayoutEffect(() => {
    if (!node) return;
    measure();

    const ro = new ResizeObserver(schedule);
    ro.observe(node);

    // Opening a panel is a DOM change, not a resize of the frame.
    const mo = new MutationObserver(schedule);
    mo.observe(node, { childList: true, subtree: true, attributes: true });

    // The root font size is set on <html> by the toolbar decorator, and a
    // change there resizes everything without resizing the frame's parent.
    const rfs = new ResizeObserver(schedule);
    rfs.observe(document.documentElement);

    return () => {
      ro.disconnect();
      mo.disconnect();
      rfs.disconnect();
    };
  }, [node, measure, schedule]);

  return [setNode, height] as const;
}
