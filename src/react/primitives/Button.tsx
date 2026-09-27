import type {
  ButtonHTMLAttributes,
  ElementType,
  ReactNode,
  AnchorHTMLAttributes,
} from "react";

export type ButtonIconPosition = "leading" | "trailing";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Polymorphic root. Pass "a" (or provide href) for a progressive link. */
  as?: ElementType;
  href?: string;
  variant?: "solid" | "outline" | "quiet";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  /** Progressive busy state — disables activation and announces to AT. */
  busy?: boolean;
  /**
   * Bound icon slot. Prefer this when you have one icon and a position.
   * Maps to leading or trailing via `iconPosition` (default leading).
   * With no children, renders icon-only (set `aria-label`).
   */
  icon?: ReactNode;
  /** Where `icon` lands. Ignored when `leading` / `trailing` are passed. */
  iconPosition?: ButtonIconPosition;
  /** Explicit leading slot (wins over `icon` when both are set). */
  leading?: ReactNode;
  /** Explicit trailing slot (wins over `icon` when both are set). */
  trailing?: ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  children?: ReactNode;
}

/**
 * Button. Props land as attributes; CSS resolves look.
 *
 * Progressive enhancement:
 * - With `href` / `as="a"` it is a real link (works without JS).
 * - `busy` is an enhancement on top of a still-valid disabled control.
 * - `icon` + `iconPosition` bind one glyph; `leading` / `trailing` remain
 *   the open composition slots. Icon-only = icon with no label children.
 */
export function Button({
  as,
  href,
  variant,
  size,
  full,
  busy,
  icon,
  iconPosition = "leading",
  leading,
  trailing,
  type = "button",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const Tag: ElementType = as ?? (href ? "a" : "button");
  const isLink = Tag === "a" || href != null;
  const inert = Boolean(disabled || busy);

  const lead =
    leading ?? (icon && iconPosition === "leading" ? icon : undefined);
  const trail =
    trailing ?? (icon && iconPosition === "trailing" ? icon : undefined);

  const hasLabel =
    children !== undefined &&
    children !== null &&
    !(typeof children === "string" && children.trim() === "");
  const iconOnly = Boolean(icon || lead || trail) && !hasLabel;

  const attrs: Record<string, unknown> = {
    "data-tk": "button",
    "data-variant": variant,
    "data-size": size,
    "data-full": full ? "" : undefined,
    "data-busy": busy ? "" : undefined,
    "data-icon": iconOnly ? "" : undefined,
    "aria-busy": busy ? true : undefined,
    "aria-disabled": inert && isLink ? true : undefined,
    ...rest,
  };

  if (isLink) {
    const linkRest = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    attrs.href = inert ? undefined : href ?? linkRest.href;
    attrs.role = attrs.role ?? "link";
    if (inert) {
      attrs.tabIndex = -1;
      attrs.onClick = (e: { preventDefault(): void }) => e.preventDefault();
    }
  } else {
    attrs.type = type;
    attrs.disabled = inert || undefined;
  }

  return (
    <Tag {...attrs}>
      {lead ? <span data-tk="button-affix" data-side="leading">{lead}</span> : null}
      {hasLabel ? <span data-tk="button-label">{children}</span> : null}
      {trail ? (
        <span data-tk="button-affix" data-side="trailing">
          {trail}
        </span>
      ) : null}
    </Tag>
  );
}
