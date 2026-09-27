"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import type { ElementType, HTMLAttributes, ReactNode, CSSProperties } from "react";
import { useMotionFx } from "../motion/useMotionFx";
import type { FxProp } from "../motion/types";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: "default" | "flat" | "bare";
  interactive?: boolean;
  /** Motion FX. `true` infers a recipe for this host; or pass a reveal name / object. */
  fx?: FxProp;
  children?: ReactNode;
}

export function Card({
  as: Tag = "div",
  variant,
  interactive,
  fx,
  children,
  style,
  ...rest
}: CardProps) {
  const motion = useMotionFx(fx, "card");
  const mergedStyle: CSSProperties = {
    ...motion.props.style,
    ...style,
  };

  return (
    <Tag
      data-tk="card"
      data-variant={variant === "default" ? undefined : variant}
      data-interactive={interactive ? "" : undefined}
      {...rest}
      ref={motion.ref as never}
      {...motion.props}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}

export const CardTitle = ({
  as: Tag = "h3",
  children,
  ...rest
}: { as?: ElementType; children?: ReactNode } & HTMLAttributes<HTMLElement>) => (
  <Tag data-tk="card-title" {...rest}>
    {children}
  </Tag>
);

export const CardBody = ({ children, ...rest }: HTMLAttributes<HTMLElement>) => (
  <p data-tk="card-body" {...rest}>
    {children}
  </p>
);

export const CardFooter = ({ children, ...rest }: HTMLAttributes<HTMLElement>) => (
  <div data-tk="card-footer" {...rest}>
    {children}
  </div>
);
