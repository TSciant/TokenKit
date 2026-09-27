"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useRef, useState, type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

/** Is any part of this box inside the viewport right now? */
function intersectsViewport(node: Element, rootMargin: number): boolean {
  const r = node.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  return (
    r.top < vh + rootMargin &&
    r.bottom > -rootMargin &&
    r.left < vw + rootMargin &&
    r.right > -rootMargin
  );
}

export function useInView<T extends Element>(
  opts: {
    once?: boolean;
    rootMargin?: string;
    threshold?: number | number[];
    enabled?: boolean;
  } = {},
): [RefObject<T | null>, boolean] {
  const {
    once = true,
    rootMargin = "0px 0px -8% 0px",
    threshold = 0.12,
    enabled = true,
  } = opts;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  /* A layout effect, and it answers the question itself before handing over to
     the observer.

     IntersectionObserver's first callback is asynchronous — it lands after the
     browser has already painted at least once. Meanwhile the FX layer marks
     <html data-fx-ready> in its own layout effect, which is what switches on
     `[data-fx-reveal]:not([data-fx-in]) { opacity: 0 }`. So for anything
     already on screen at load the sequence was: paint the content, hide it,
     wait for the observer, fade it back in. Visibly a flash, and to Lighthouse
     a Largest Contentful Paint that arrives when the fade finishes rather than
     when the content did — measured at 4.9s on the homepage against a 1.2s
     first paint.

     getBoundingClientRect is synchronous, so the same question can be answered
     here, before the paint that would have hidden anything. Content that is
     already in view is simply in view: it never hides and it never animates,
     which is also the right call on its own terms — an entrance animation for
     something the reader is already looking at is a delay, not an entrance.
     Everything below the fold still reveals on scroll, via the observer. */
  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      setInView(true);
      return;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    /* The negative bottom inset in the default rootMargin exists to delay a
       reveal until the element is properly on screen. For the "is it already
       here" question that inset would hide things that are visibly present, so
       this check uses a plain viewport test. */
    if (intersectsViewport(node, 0)) {
      setInView(true);
      if (once) return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { root: null, rootMargin, threshold },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [once, rootMargin, threshold, enabled]);

  return [ref, inView];
}
