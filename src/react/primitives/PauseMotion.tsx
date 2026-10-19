"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

/* The page's motion: paused by the reader (on <html data-motion="paused">),
   off because the device asks for reduced motion, or running. */
type Motion = "paused" | "reduced" | "running";
const KEY = "tk-motion";
const REDUCE = "(prefers-reduced-motion: reduce)";

function readMotion(): Motion {
  if (typeof document === "undefined") return "running";
  if (window.matchMedia?.(REDUCE).matches) return "reduced";
  return document.documentElement.dataset.motion === "paused" ? "paused" : "running";
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  const mq = window.matchMedia?.(REDUCE);
  mq?.addEventListener("change", onChange);
  return () => { mo.disconnect(); mq?.removeEventListener("change", onChange); };
}

/** Pause or play the page's looping motion, and remember it for the next page. */
export function setMotionPaused(paused: boolean, remember = true) {
  const root = document.documentElement;
  if (paused) root.dataset.motion = "paused";
  else delete root.dataset.motion;
  if (!remember) return;
  try { if (paused) localStorage.setItem(KEY, "paused"); else localStorage.removeItem(KEY); } catch { /* storage blocked: this page only */ }
}

/**
 * True while looping motion should stand still: the reader paused it, or the
 * device asks for reduced motion. For motion drawn in script (a canvas, a
 * timer) that CSS cannot stop; CSS loops key on `:root[data-motion="paused"]`.
 */
export function useMotionPaused() {
  return useSyncExternalStore(subscribe, readMotion, () => "running" as Motion) !== "running";
}

export interface PauseMotionProps {
  /** The action while motion runs. */
  pauseLabel?: string;
  /** The action while it is paused. */
  playLabel?: string;
  /** Said beside it, and read as its description, when the device has motion off and the control has nothing to do. */
  reducedReason?: ReactNode;
  variant?: "solid" | "outline" | "quiet";
  size?: "sm" | "md" | "lg";
  /** Keep the choice for the next page (localStorage). Default true. */
  remember?: boolean;
  onChange?: (paused: boolean) => void;
}

/**
 * PauseMotion — one button that pauses every loop on the page, and plays
 * them again: spinners, skeletons, a busy button's turn, the tachometer, and
 * any motion of the page's own marked `data-motion-class="decor"` (the kit's
 * CSS stops it) or drawn in script that reads `useMotionPaused()`. Motion
 * that carries information is not decor: it names a static equivalent
 * instead (`data-motion-class="data"`, `data-equivalent`).
 *
 * Its words name the action ("Pause animations", then "Play animations")
 * and change when it is pressed, so it carries no pressed state. Put it
 * once, early in the page (the header's utilities), before the moving
 * content; the choice is kept for the next page. When the device asks for
 * reduced motion nothing loops, so it shows as paused, unavailable, and
 * says why. WCAG 2.2.2: motion that starts on its own, lasts more than five
 * seconds and sits beside other content can be paused.
 */
export function PauseMotion({ pauseLabel = "Pause animations", playLabel = "Play animations", reducedReason = "Animations are off in your device settings.", variant = "quiet", size = "sm", remember = true, onChange }: PauseMotionProps) {
  const motion = useSyncExternalStore(subscribe, readMotion, () => "running" as Motion);

  /* The last page's choice, before anything else has drawn a frame of motion it should not have. */
  useEffect(() => {
    if (!remember) return;
    try { if (localStorage.getItem(KEY) === "paused") document.documentElement.dataset.motion = "paused"; } catch { /* storage blocked */ }
  }, [remember]);

  const paused = motion !== "running";
  const toggle = () => { setMotionPaused(!paused, remember); onChange?.(!paused); };

  return (
    <Button
      variant={variant}
      size={size}
      icon={<Icon name={paused ? "play" : "pause"} size="sm" />}
      onClick={toggle}
      disabled={motion === "reduced"}
      reason={motion === "reduced" ? reducedReason : undefined}
    >
      {paused ? playLabel : pauseLabel}
    </Button>
  );
}
