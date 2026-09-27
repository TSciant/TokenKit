"use client";

import { Suspense, lazy, useState, type ReactNode } from "react";
import type { PresencePanelProps } from "./PresencePanel";

/**
 * PresencePanel, loaded the first time a panel actually opens.
 *
 * Motion is ~43 KB gzipped and the kit uses it in exactly one place: the mega
 * menu's dropdown, which animates out as well as in and so cannot be done in
 * CSS alone. Imported normally it landed in the shared chunk, and every route
 * of the prototype paid for it on first load — measured as the largest single
 * item in a 163 KB first load, on four pages that have no animated panel at
 * all and one that has a closed one.
 *
 * Three things make the deferral invisible rather than merely cheaper:
 *
 *   • Nothing loads until a panel opens for the first time. A reader who never
 *     touches the mega menu never downloads an animation library.
 *   • `preloadPresencePanel()` starts the fetch on hover or focus of the
 *     trigger, which is a beat or two before the click, so by the time the
 *     panel opens the module is usually already there.
 *   • Until it arrives, the Suspense fallback is the same panel without the
 *     tween. The panel opens instantly either way; the animation is the thing
 *     that waits, which is the correct thing to make wait.
 *
 * Once opened, the wrapper stays mounted even when the panel closes —
 * AnimatePresence has to still be there to play the exit.
 */
const Impl = lazy(() => import("./PresencePanel"));

/** Start fetching the module. Safe to call repeatedly; the import is cached. */
export function preloadPresencePanel(): void {
  void import("./PresencePanel");
}

export function PresencePanel(props: PresencePanelProps) {
  const [armed, setArmed] = useState(props.show);
  if (props.show && !armed) setArmed(true);

  if (!armed) return null;

  const { id, className, style, attrs, children } = props;
  const plain: ReactNode = props.show ? (
    <div id={id} className={className} style={style} {...attrs}>
      {children}
    </div>
  ) : null;

  return <Suspense fallback={plain}>{<Impl {...props} />}</Suspense>;
}
