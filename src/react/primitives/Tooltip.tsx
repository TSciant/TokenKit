"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { cloneElement, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { Icon } from "./Icon";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content" | "children"> {
  /** The words. Short: a name or a phrase. Anything longer, or anything a reader needs, is not a tooltip. */
  content: string;
  /** The one focusable element it belongs to (a button, a link). */
  children: ReactElement<{ "aria-describedby"?: string; "aria-labelledby"?: string }>;
  /**
   * The words are the element's name (an icon-only button with no visible
   * text of its own), not a description added after its name.
   */
  labels?: boolean;
  /** Above the element (default) or below it. */
  placement?: "above" | "below";
  /** Shown whatever the pointer and focus do: for documentation and design review, not for use on a page. */
  open?: boolean;
}

/**
 * Tooltip — a few words about a control, shown on hover and on focus.
 *
 * Use for: the name of an icon-only button, or a short supplement to a
 * control that already says what it does. Don't use for: anything a reader
 * needs to complete a task (put it on the page), anything on a touch screen
 * only (there is no hover), rich content or links (a Toggletip), or text on
 * something that cannot take focus. GOV.UK's system has no tooltip at all,
 * for these reasons; this one exists for the icon-button case and holds
 * itself to WCAG 1.4.13: it stays while the pointer is over it, until focus
 * leaves or Escape is pressed, and Escape closes it without moving focus.
 */
export function Tooltip({ content, children, labels = false, placement = "above", open: forced, ...rest }: TooltipProps) {
  const id = useId();
  const [own, setOpen] = useState(false);
  const open = forced ?? own;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const link = labels ? { "aria-labelledby": id } : { "aria-describedby": id };
  return (
    <span
      data-tk="tooltip"
      data-placement={placement}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...rest}
    >
      {cloneElement(children, link)}
      <span data-tk="tooltip-bubble" role="tooltip" id={id} data-open={open ? "" : undefined}>
        {content}
      </span>
    </span>
  );
}

export interface ToggletipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content" | "children"> {
  /** The button's name: what the information is about ("About the pricing"). */
  label: string;
  /** The information. May hold a link. */
  content: ReactNode;
  placement?: "above" | "below";
}

/**
 * Toggletip — a button that shows a short piece of information beside
 * itself, and says it when it does.
 *
 * Use for: an explanation a reader may want and most do not ("Why do we ask
 * this?"), where a link elsewhere would be too much. Don't use for: anything
 * every reader needs (on the page) or more than a few sentences (a Disclosure).
 *
 * A real button with an information icon and a name. Pressing it shows the
 * bubble and puts its words into a polite live region, so a screen reader
 * reads them without moving focus; pressing it again, Escape, or a press
 * anywhere else closes it. Content may include a link, which a tooltip
 * cannot.
 */
export function Toggletip({ label, content, placement = "above", ...rest }: ToggletipProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  return (
    <span data-tk="toggletip" data-placement={placement} ref={root} {...rest}>
      <button data-tk="toggletip-button" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="info" />
        <span data-tk="visually-hidden">{label}</span>
      </button>
      {/* Always in the page, so its words are read when they arrive. */}
      <span data-tk="tooltip-bubble" role="status" data-open={open ? "" : undefined}>
        {open ? content : null}
      </span>
    </span>
  );
}
