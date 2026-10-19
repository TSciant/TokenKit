"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

/* A spinner is named one of three ways, and exactly one. */
type SpinnerName =
  /** Words beside the arc, read out too: "Loading your invoices…". */
  | { label: ReactNode; a11yLabel?: never; decorative?: never }
  /** Words for screen readers only, when there is no room for them on screen. */
  | { a11yLabel: string; label?: never; decorative?: never }
  /** Something else already says it is loading (a busy Button, a skeleton group): the arc is silent. */
  | { decorative: true; label?: never; a11yLabel?: never };

export type SpinnerProps = SpinnerName &
  Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    /**
     * Still waiting. Set false when the wait is over: the region stays, so
     * `doneLabel` can be said.
     */
    loading?: boolean;
    /** Said once the wait is over ("Invoices loaded"), when the change is not obvious otherwise. */
    doneLabel?: string;
    /** The text's own size by default (it sits in what it waits for), or an icon size. */
    size?: "inherit" | "sm" | "md" | "lg";
    /** In the line, or centred in the box that is loading. */
    placement?: "inline" | "center";
    /**
     * Milliseconds before it shows, so a quick load never flashes a spinner.
     * Default 400; 0 shows it at once.
     */
    delay?: number;
  };

/**
 * Spinner — something is coming, and it is not known what it looks like.
 *
 * An arc in the text's colour at the text's size, with its words in one
 * polite status region; focus stays where the reader put it. When the
 * coming content's shape is known, use a Skeleton instead; inside a button,
 * Button's `busy`. One spinner talks at a time: give the others `decorative`.
 * For a long wait, say how long or show progress, not a spinner.
 */
export function Spinner({ label, a11yLabel, decorative, loading = true, doneLabel, size = "inherit", placement = "inline", delay = 400, ...rest }: SpinnerProps) {
  const [shown, setShown] = useState(delay <= 0);
  useEffect(() => {
    if (!loading) { setShown(delay <= 0); return; }
    if (delay <= 0) { setShown(true); return; }
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [loading, delay]);

  const common = { "data-tk": "spinner", "data-size": size === "inherit" ? undefined : size, "data-placement": placement === "inline" ? undefined : placement } as const;
  const arc = <span data-tk="spinner-arc" data-motion-class="decor" aria-hidden="true" />;

  if (decorative) return loading && shown ? <span {...rest} {...common} aria-hidden="true">{arc}</span> : null;

  /* The region is there from the start, so the words are announced when they arrive. */
  return (
    <span {...rest} {...common} role="status">
      {loading ? (
        shown ? (
          <>
            {arc}
            {label ? <span data-tk="spinner-label">{label}</span> : <span data-tk="visually-hidden">{a11yLabel}</span>}
          </>
        ) : null
      ) : doneLabel ? (
        <span data-tk="visually-hidden">{doneLabel}</span>
      ) : null}
    </span>
  );
}

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** A line of text, a block (an image, a card) or a circle (an avatar). */
  shape?: "text" | "block" | "circle";
  /** Lines of text; the last is shorter. Keep it to a few: not every line needs one. */
  lines?: 1 | 2 | 3;
  /** Any CSS length. Text and blocks fill their box by default; a circle is 2.5rem. */
  width?: string;
  /** A block's height, any CSS length (6rem by default). */
  height?: string;
  /** Breathe while waiting (stopped under reduced motion either way). */
  animated?: boolean;
}

/**
 * Skeleton — the shape of what is coming, while it comes.
 *
 * Shapes that stand for the content (a line for text, a circle for an
 * avatar, a block for an image), in the text colour at a tenth. Hidden from
 * screen readers: put them in a SkeletonGroup, which says what is loading.
 * Not with a spinner, and not for toasts, menus or dialogs.
 */
export function Skeleton({ shape = "text", lines = 1, width, height, animated = true, style, ...rest }: SkeletonProps) {
  const vars = { ...(width ? { "--_w": width } : {}), ...(height ? { "--_h": height } : {}), ...style } as CSSProperties;
  return (
    <span {...rest} data-tk="skeleton" data-motion-class="decor" data-shape={shape} data-animated={animated ? undefined : "false"} aria-hidden="true" style={vars}>
      {shape === "text" ? Array.from({ length: lines }, (_, i) => <span key={i} data-tk="skeleton-line" />) : null}
    </span>
  );
}

export interface SkeletonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** What is loading, for screen readers: "Loading team members". */
  label: string;
  children?: ReactNode;
}

/** SkeletonGroup — the skeletons of one region, busy, with what is loading said once. Not a live region. */
export function SkeletonGroup({ label, children, ...rest }: SkeletonGroupProps) {
  return (
    <div {...rest} data-tk="skeleton-group" aria-busy="true">
      <span data-tk="visually-hidden">{label}</span>
      {children}
    </div>
  );
}
