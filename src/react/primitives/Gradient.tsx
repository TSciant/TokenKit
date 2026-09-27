import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * A branded gradient, as four coordinates rather than one named blob.
 *
 * The usual implementation of "the brand gradient" is a single custom
 * property holding a whole `linear-gradient(...)` — one value carrying four
 * decisions, none of which can be changed without rewriting the other three,
 * and a second one defined the moment somebody wants the same colours running
 * the other way. That is a class wearing a token's clothes.
 *
 * Here the pack owns two colours and this owns the arrangement. Every prop
 * below becomes an attribute that CSS reads; nothing is computed in
 * TypeScript and no colour appears in this file. Swapping the pack changes
 * every gradient in the product and touches no component.
 *
 * Use for: a ground. A header wash, a corner glow, a band that needs to stop
 * being flat, a fade that hands off to whatever is beneath it.
 *
 * Don't use for: a ground under text, without a scrim. A contrast ratio is
 * between two colours and a gradient is a range: text that clears 4.5:1 at
 * one end can fail at the other, in the half of the element nobody
 * screenshots. Put text on `[data-tk="scrim"]`, which is measured against the
 * worst backdrop it can be handed, or over a `from`/`to` pair the pack has
 * judged at both ends — 02 Tokens/01 Colour/06 Gradient measures both.
 */
export interface GradientProps {
  as?: ElementType;
  /** Which gradient function paints it. */
  shape?: "linear" | "radial" | "conic" | "fade";
  /** Logical direction. Flipped under `dir="rtl"` by the CSS, not here. */
  direction?:
    | "block-end"
    | "block-start"
    | "inline-end"
    | "inline-start"
    | "diagonal"
    | "diagonal-up";
  /** How far the second colour travels: a wash at one edge, or the full field. */
  emphasis?: "subtle" | "strong";
  /** Centre for radial and conic. Ignored by linear, which has an angle instead. */
  origin?: string;
  /** Override the pack's pair for one element — a specimen sheet, not a page. */
  from?: string;
  to?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Gradient({
  as: Tag = "div",
  shape = "linear",
  direction = "block-end",
  emphasis,
  origin,
  from,
  to,
  className,
  style,
  children,
  ...rest
}: GradientProps & Record<string, unknown>) {
  /* `linear` is what [data-gradient] paints with no value, so it renders as
     the bare attribute rather than as data-gradient="linear" — the same idiom
     as every other base state in the kit, and the reason there is no
     [data-gradient="linear"] rule to match. */
  const overrides: CSSProperties = {
    ...(from ? ({ ["--tk-gradient-from" as string]: from } as CSSProperties) : null),
    ...(to ? ({ ["--tk-gradient-to" as string]: to } as CSSProperties) : null),
    ...(origin ? ({ ["--tk-gradient-origin" as string]: origin } as CSSProperties) : null),
  };

  return (
    <Tag
      data-gradient={shape === "linear" ? "" : shape}
      data-direction={direction}
      data-emphasis={emphasis}
      className={className}
      style={{ ...overrides, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
