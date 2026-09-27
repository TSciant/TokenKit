"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useRef, type RefObject } from "react";

/**
 * Scroll-linked parallax via rAF. Writes --tk-fx-y (px) while intersecting.
 * Intensity is a fraction of viewport travel (0.08–0.2 feels intentional).
 */
export function useParallax<T extends HTMLElement>(
  intensity: number,
  enabled: boolean,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled || intensity === 0) {
      node?.style.removeProperty("--tk-fx-y");
      return;
    }

    let raf = 0;
    let intersecting = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        intersecting = !!entry?.isIntersecting;
        if (!intersecting) {
          node.style.setProperty("--tk-fx-y", "0px");
        } else {
          tick();
        }
      },
      { root: null, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );
    io.observe(node);

    const tick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!intersecting) return;
        const rect = node.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 at viewport center, ±1 at edges
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        const y = progress * intensity * -80; // px travel
        node.style.setProperty("--tk-fx-y", `${y.toFixed(2)}px`);
      });
    };

    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    tick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
      node.style.removeProperty("--tk-fx-y");
    };
  }, [intensity, enabled]);

  return ref;
}
