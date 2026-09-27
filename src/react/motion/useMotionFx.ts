"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useCallback, type CSSProperties } from "react";
import { normalizeFx, type FxContext, type FxProp } from "./types";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { useInView } from "./useInView";
import { useParallax } from "./useParallax";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type MotionFxBind = {
  ref: (node: HTMLElement | null) => void;
  inView: boolean;
  /** Spread onto the host element. */
  props: {
    "data-fx"?: string;
    "data-fx-reveal"?: string;
    "data-fx-in"?: string;
    "data-fx-parallax"?: string;
    "data-fx-context"?: string;
    style?: CSSProperties;
  };
};

/**
 * Announce that the FX layer is running.
 *
 * src/css/components/motion-fx.css scopes every "hidden until revealed" rule
 * to [data-fx-ready] on <html>. Nothing hides until this lands, so a page
 * whose JavaScript never runs shows all of its content instead of none of it.
 * Set once per document, from a layout effect so it is in place before the
 * first paint that could have hidden anything.
 *
 * Exported because there are two callers. MotionFx.tsx repeats this file's
 * logic rather than calling useMotionFx — it has a cloneElement path that the
 * hook's ref callback cannot serve — and it repeated everything EXCEPT this
 * line. See the note at its call site: a page built only from <MotionFx>
 * elements wrote data-fx-reveal and data-fx-in onto its content while <html>
 * never got data-fx-ready, so nothing ever hid and the reveal did nothing at
 * all. Whether a page animated depended on whether some unrelated component
 * on it happened to use the hook.
 */
export function useFxReady(active: boolean) {
  useIsomorphicLayoutEffect(() => {
    if (!active) return;
    document.documentElement.setAttribute("data-fx-ready", "");
  }, [active]);
}

/** Bind FX attributes + refs onto a primitive's own root element. */
export function useMotionFx(
  fx: FxProp | undefined,
  context: FxContext = "default",
): MotionFxBind {
  const cfg = normalizeFx(fx, context);
  const reduced = usePrefersReducedMotion();
  const reveal = cfg && !reduced ? cfg.reveal : false;
  const parallaxAmt =
    cfg && !reduced && typeof cfg.parallax === "number" ? cfg.parallax : 0;

  const [viewRef, inView] = useInView<HTMLElement>({
    once: cfg?.once ?? true,
    rootMargin: cfg?.rootMargin,
    threshold: cfg?.threshold,
    enabled: Boolean(reveal),
  });
  const paraRef = useParallax<HTMLElement>(parallaxAmt, parallaxAmt > 0);
  useFxReady(Boolean(cfg) && !reduced);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      (viewRef as { current: HTMLElement | null }).current = node;
      (paraRef as { current: HTMLElement | null }).current = node;
    },
    [viewRef, paraRef],
  );

  if (!cfg || reduced) {
    return { ref, inView: true, props: {} };
  }

  return {
    ref,
    inView: reveal ? inView : true,
    props: {
      "data-fx": "",
      "data-fx-context": context,
      "data-fx-reveal": typeof reveal === "string" ? reveal : undefined,
      "data-fx-in": reveal ? (inView ? "" : undefined) : "",
      "data-fx-parallax": parallaxAmt > 0 ? "" : undefined,
      style:
        parallaxAmt > 0
          ? ({ ["--tk-fx-y" as string]: "0px" } as CSSProperties)
          : undefined,
    },
  };
}
