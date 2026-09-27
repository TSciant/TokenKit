"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import type { CSSProperties, ReactNode } from "react";
import { useMotionFx } from "../motion/useMotionFx";
import type { FxProp } from "../motion/types";

export interface MediaProps {
  figure?: ReactNode;
  size?: "sm" | "md" | "lg";
  fx?: FxProp;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

export function Media({ figure, size, fx, style, className, children }: MediaProps) {
  const motion = useMotionFx(fx, "media");
  return (
    <div
      ref={motion.ref as never}
      data-tk="media"
      data-size={size === "md" ? undefined : size}
      className={className}
      {...motion.props}
      style={{ ...motion.props.style, ...style }}
    >
      {figure ? <div data-tk="media-figure">{figure}</div> : null}
      <div data-tk="media-body">{children}</div>
    </div>
  );
}
