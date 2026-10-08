import { useId } from "react";
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
  /**
   * Consequence, crossed with `variant`. "danger" for destructive or
   * irreversible actions; the colour is the pack's, and the label still has
   * to say what happens. Neutral renders no attribute.
   */
  tone?: "neutral" | "danger";
  size?: "sm" | "md" | "lg";
  /**
   * Makes the button a toggle: true or false renders `aria-pressed`, left
   * out it is an ordinary button. A toggle defaults to `outline`, because a
   * solid button has nowhere to go when it is switched on. Not for links: a
   * link goes somewhere, it is not on or off.
   */
  pressed?: boolean;
  full?: boolean;
  /** Progressive busy state — disables activation and announces to AT. */
  busy?: boolean;
  /**
   * The words while it is busy: "Posting…", "Saving…". The label changes to
   * them and back, in a polite live region that is there from the first
   * render, so a screen reader hears the change while focus stays put. Say
   * what is happening, with the -ing verb.
   */
  busyLabel?: ReactNode;
  /**
   * Why a disabled button is unavailable. Shown beside it on hover and on
   * focus, and read as its description. A disabled button stays in the tab
   * order so it can say this; without a reason it is still focusable, but
   * the reason is the point.
   */
  reason?: ReactNode;
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
  tone,
  size,
  pressed,
  full,
  busy,
  busyLabel,
  reason,
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
  const isToggle = pressed !== undefined && !isLink;

  /* Unavailable, not removed. A disabled or busy button keeps its place in
     the tab order (aria-disabled, never the native attribute): a keyboard or
     screen-reader user can still find it and hear why it does nothing, which
     the native attribute makes impossible by skipping it entirely. Activation
     is blocked here instead, at the click, which is where Enter and Space on
     a button and a form's implicit submission all arrive. */
  const reasonId = useId();
  const explains = Boolean(disabled && reason != null && reason !== false);
  const { onClick, ...restNoClick } = rest as { onClick?: (e: unknown) => void } & Record<string, unknown>;
  const describedBy = [restNoClick["aria-describedby"], explains ? reasonId : undefined].filter(Boolean).join(" ") || undefined;
  const guard = inert
    ? (e: { preventDefault(): void; stopPropagation(): void }) => {
        e.preventDefault();
        e.stopPropagation();
      }
    : onClick;

  const attrs: Record<string, unknown> = {
    "data-tk": "button",
    "data-variant": variant ?? (isToggle ? "outline" : undefined),
    "data-tone": tone === "danger" ? "danger" : undefined,
    "data-size": size,
    "data-full": full ? "" : undefined,
    "data-busy": busy ? "" : undefined,
    "data-icon": iconOnly ? "" : undefined,
    "data-reason": explains ? "" : undefined,
    "aria-busy": busy ? true : undefined,
    "aria-disabled": inert ? true : undefined,
    ...restNoClick,
    "aria-describedby": describedBy,
    onClick: guard,
  };

  if (isLink) {
    const linkRest = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    attrs.href = inert ? undefined : href ?? linkRest.href;
    attrs.role = attrs.role ?? "link";
    /* An anchor without an href drops out of the tab order; put it back. */
    if (inert) attrs.tabIndex = 0;
  } else {
    attrs.type = type;
    if (isToggle) attrs["aria-pressed"] = pressed;
  }

  return (
    <Tag {...attrs}>
      {lead ? <span data-tk="button-affix" data-side="leading">{lead}</span> : null}
      {hasLabel ? (
        <span data-tk="button-label" aria-live={busyLabel != null ? "polite" : undefined}>
          {busy && busyLabel != null ? busyLabel : children}
        </span>
      ) : null}
      {trail ? (
        <span data-tk="button-affix" data-side="trailing">
          {trail}
        </span>
      ) : null}
      {explains ? (
        /* aria-hidden keeps the reason out of the button's NAME (which is
           computed from its content); aria-describedby still reads it as the
           DESCRIPTION, because a description may point at hidden text. */
        <span data-tk="button-reason" id={reasonId} aria-hidden="true">
          {reason}
        </span>
      ) : null}
    </Tag>
  );
}
