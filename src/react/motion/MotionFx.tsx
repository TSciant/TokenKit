"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { normalizeFx, type FxContext, type FxProp } from "./types";
import { useInView } from "./useInView";
import { useParallax } from "./useParallax";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useFxReady } from "./useMotionFx";

export type MotionFxProps = {
  fx?: FxProp;
  /** When fx is true, infer the recipe from this role (default section). */
  context?: FxContext;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Merge FX onto a single child instead of wrapping (keeps one DOM node). */
  merge?: boolean;
};

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else (ref as { current: T | null }).current = value;
    }
  };
}

/**
 * Motion FX host. Progressive: without observers children still render;
 * with JS, IntersectionObserver drives reveal + parallax CSS variables.
 */
export function MotionFx({
  fx,
  context = "section",
  as: Tag = "div",
  className,
  style,
  children,
  merge = false,
}: MotionFxProps) {
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
  const setRefs = mergeRefs(viewRef, paraRef);

  /* Announce the FX layer, exactly as useMotionFx does.
 
     This line was missing, and its absence was invisible: the attributes this
     component writes are all still there in devtools, the IntersectionObserver
     still fires, data-fx-in still lands. What never happened was the hiding —
     every reveal rule in motion-fx.css is scoped to [data-fx-ready] on <html>,
     deliberately, so that content is never lost to a script that did not run.
     No flag, no hidden state, no animation to play back from.
 
     Found by tools/attribute-gate.mjs, which asked whether any rule keyed on
     data-fx-reveal="rise" reached the element carrying it, and got no for all
     four presets in the story built to demonstrate them.
 
     Before the early return below, because it is a hook. */
  useFxReady(Boolean(cfg) && !reduced);

  if (!cfg || reduced) {
    if (merge && isValidElement(children)) return children;
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  const fxStyle: CSSProperties = {
    ...style,
    ...(parallaxAmt > 0
      ? ({ ["--tk-fx-y" as string]: "0px" } as CSSProperties)
      : null),
  };

  const dataAttrs = {
    "data-fx": "",
    "data-fx-context": context,
    "data-fx-reveal": typeof reveal === "string" ? reveal : undefined,
    "data-fx-in": reveal ? (inView ? "" : undefined) : "",
    "data-fx-parallax": parallaxAmt > 0 ? "" : undefined,
  };

  if (merge && isValidElement(children)) {
    const child = children as ReactElement<{
      ref?: Ref<HTMLElement>;
      style?: CSSProperties;
      className?: string;
    }>;
    return cloneElement(child, {
      ref: mergeRefs(child.props.ref, setRefs),
      style: { ...child.props.style, ...fxStyle },
      className:
        [child.props.className, className].filter(Boolean).join(" ") ||
        undefined,
      ...dataAttrs,
    } as never);
  }

  return (
    <Tag
      ref={setRefs as never}
      className={className}
      style={fxStyle}
      {...dataAttrs}
    >
      {children}
    </Tag>
  );
}
