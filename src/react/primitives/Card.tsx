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

/**
 * The card's heading. Give it `href` and the card becomes clickable the
 * accessible way: the title is the link, stretched over the whole card, so
 * the link's name is the title (not the card's every word) and buttons inside
 * the card still work. Don't also wrap the card in a link.
 */
export const CardTitle = ({
  as: Tag = "h3",
  href,
  children,
  ...rest
}: { as?: ElementType; href?: string; children?: ReactNode } & HTMLAttributes<HTMLElement>) => (
  <Tag data-tk="card-title" {...rest}>
    {href ? (
      <a data-tk="card-link" href={href}>
        {children}
      </a>
    ) : (
      children
    )}
  </Tag>
);

/**
 * The top of a card: an eyebrow above the title, a subtitle under it, and
 * one small action at the end (a MenuButton, a toggle). Lightning and
 * PatternFly both put status and an action here; a card without them does
 * not need a header and can use CardTitle on its own.
 *
 * The action sits above a stretched title link, so a clickable card can
 * still have its own menu, and a card with an action stops clipping its
 * overflow so the menu can open past the card's edge.
 */
export const CardHeader = ({
  eyebrow,
  subtitle,
  action,
  children,
  ...rest
}: {
  /** A short label above the title: a kind, a status, a date. */
  eyebrow?: ReactNode;
  /** One line under the title. */
  subtitle?: ReactNode;
  /** One small control at the end of the header. */
  action?: ReactNode;
  /** The CardTitle. */
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">) => (
  /* A div, not <header>: outside an article or section a <header> is the
     page's banner landmark, and a grid of cards would announce a dozen of
     them. */
  <div data-tk="card-header" {...rest}>
    <div data-tk="card-header-text">
      {eyebrow ? <span data-tk="eyebrow">{eyebrow}</span> : null}
      {children}
      {subtitle ? <p data-tk="card-subtitle">{subtitle}</p> : null}
    </div>
    {action ? <div data-tk="card-header-action">{action}</div> : null}
  </div>
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
