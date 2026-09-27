"use client";

import { Suspense, lazy, useRef, useState, type ComponentProps } from "react";
import type { Map as MapComponent } from "./Map";
import { useIsomorphicLayoutEffect } from "../motion/useIsomorphicLayoutEffect";

/**
 * The Map, loaded only by the pages that have one and only when it is wanted.
 *
 * maplibre-gl is roughly 800 KB of JavaScript. Two page compositions use it,
 * but a page module exports every composition from one file,
 * so a static import put the whole of maplibre in the shared chunk: every
 * route's first load was 443 KB and Lighthouse reported 287 KB of unused
 * JavaScript on pages that show no map at all.
 *
 * Splitting the chunk is only half of it. React.lazy starts fetching the
 * moment the component renders, and a map three screens down renders with
 * everything else — so the homepage still paid for maplibre while the reader
 * was looking at the hero.
 *
 * React.lazy rather than next/dynamic on purpose: the pages run in Storybook
 * too, and a Next-only import would fork the page source between the hosts.
 * lazy + Suspense is React, so it works in both.
 *
 * The placeholder is the same box at the same aspect ratio, which is what
 * keeps this from trading a bundle problem for a layout-shift one.
 */
const MapImpl = lazy(() => import("./Map").then((m) => ({ default: m.Map })));

export type MapActivation = "view" | "interaction";

type MapLazyProps = ComponentProps<typeof MapComponent> & {
  /**
   * When the 800 KB is allowed to arrive.
   *
   * `"view"` (default) loads as the container approaches the viewport, then
   * waits for the browser to go idle. Right for a map the reader scrolls down
   * to: by the time they get there it is drawn, and nothing was fetched for a
   * reader who never scrolled.
   *
   * `"interaction"` draws a placeholder with a button and loads nothing until
   * it is pressed. Right for a map inside the first screen, where there is no
   * "before the reader arrives" to hide the work in. Measured on the contact
   * page, whose map begins 98 px above the fold: evaluating maplibre is a
   * ~230 ms task on a throttled phone, and it put 350 ms of Total Blocking
   * Time between first paint and the page answering a tap. Deferring to idle
   * did not help — Time to Interactive is defined as the end of that
   * busyness, so the work stays inside the window wherever it is queued. Not
   * doing the work is the only thing that moves the number, and a reader who
   * wants the map is one press away from it.
   *
   * This is the facade pattern, and the placeholder is a real one: same box,
   * same ratio, drawn surface, no layout shift when it is replaced.
   */
  activate?: MapActivation;
  /**
   * How early `activate="view"` starts loading, as a CSS margin around the
   * viewport. One screen of lead time means the map is usually ready by the
   * time it arrives rather than popping in under the reader.
   */
  rootMargin?: string;
  /** Button label for `activate="interaction"`. */
  activateLabel?: string;
};

/**
 * Resolve once the browser has finished the work the reader is waiting on.
 *
 * For a map below the fold this is free: the reader is still scrolling, and
 * the 230 ms of parsing happens in a gap rather than in front of them.
 */
function whenIdle(fn: () => void): () => void {
  let cancelled = false;
  const go = () => {
    if (cancelled) return;
    const ric = (
      globalThis as {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    /* Safari has no requestIdleCallback; a task queued behind the current one
       is the same idea with a worse guarantee, which is fine here. The 2s
       timeout is the ceiling either way — an idle moment that never comes
       should not mean a map that never loads. */
    if (ric) ric(() => !cancelled && fn(), { timeout: 2000 });
    else setTimeout(() => !cancelled && fn(), 1);
  };

  if (document.readyState === "complete") {
    go();
    return () => {
      cancelled = true;
    };
  }
  window.addEventListener("load", go, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", go);
  };
}

export function Map({
  activate = "view",
  rootMargin = "100% 0px",
  activateLabel,
  ...props
}: MapLazyProps) {
  const { ratio = "16 / 9", className, style, label = "Map" } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (reached || activate !== "view") return;
    const node = hostRef.current;
    if (!node) return;

    let cancelIdle: (() => void) | undefined;
    const arrive = () => {
      cancelIdle = whenIdle(() => setReached(true));
    };

    /* No IntersectionObserver — a very old browser, or a test environment.
       Load it rather than never showing a map. */
    if (typeof IntersectionObserver === "undefined") {
      arrive();
      return () => cancelIdle?.();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          io.disconnect();
          arrive();
        }
      },
      { root: null, rootMargin },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelIdle?.();
    };
  }, [reached, rootMargin, activate]);

  const facade = activate === "interaction" && !reached;

  const placeholder = (
    <div
      ref={hostRef}
      data-tk="map"
      data-pending=""
      className={className}
      style={{ ["--_ratio" as string]: ratio, ...style }}
      /* A facade is a control, not a busy region: it is finished, and it is
         waiting for the reader rather than for the network. Only the "view"
         placeholder is genuinely loading. */
      role={facade ? undefined : "region"}
      aria-label={facade ? undefined : label}
      aria-busy={facade ? undefined : "true"}
    >
      {facade ? (
        <button
          type="button"
          data-tk="button"
          data-variant="outline"
          data-size="sm"
          data-map-activate=""
          onClick={() => setReached(true)}
        >
          {activateLabel ?? `Load the interactive map — ${label}`}
        </button>
      ) : (
        <p data-tk="visually-hidden">
          The map loads when it comes into view. It is a geographic
          illustration; the surrounding text carries the same information.
        </p>
      )}
    </div>
  );

  if (!reached) return placeholder;

  return (
    <Suspense fallback={placeholder}>
      <MapImpl {...props} />
    </Suspense>
  );
}
