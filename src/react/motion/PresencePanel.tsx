"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Transition } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

/**
 * A panel that animates in and, more importantly, out.
 *
 * This is the one place in the kit that needs an animation library rather than
 * CSS. A CSS transition cannot animate an element React has already unmounted:
 * @starting-style covers the entrance and nothing covers the exit.
 * AnimatePresence holds the node until its exit finishes.
 *
 * It is a module of its own so that it can be loaded on demand — see
 * PresencePanelLazy.tsx. Motion is ~43 KB gzipped and this is a dropdown
 * nobody sees until they open it; every route was paying for it up front.
 *
 * Both transitions are passed in from --tk-motion-*, so the panel and every
 * CSS transition in the kit stay on the same pace.
 */
/* Motion's own Transition, imported as a type. `import type` is erased at
   compile time, so naming it here costs the bundle nothing — the runtime
   import stays inside this module, which is the one that loads on demand. */
export type PresenceTransition = Transition;

export type PresencePanelProps = {
  /** Mounted and animating in when true; animating out when it goes false. */
  show: boolean;
  enter?: PresenceTransition;
  exit?: PresenceTransition;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** data-* and aria-* for the panel element. */
  attrs?: Record<string, string | undefined>;
  children?: ReactNode;
};

export function PresencePanel({
  show,
  enter,
  exit,
  id,
  className,
  style,
  attrs,
  children,
}: PresencePanelProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: enter }}
          exit={{ opacity: 0, y: -8, transition: exit }}
          id={id}
          className={className}
          style={style}
          {...attrs}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default PresencePanel;
