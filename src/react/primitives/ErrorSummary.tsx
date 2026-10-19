"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useRef, type HTMLAttributes, type MouseEvent, type ReactNode } from "react";

export type ErrorSummaryItem = {
  /** The message, worded exactly as it is beside the field. */
  text: string;
  /**
   * The field it is about: "#" and its id (Field takes an `id`). For radios
   * or checkboxes, the group's id (a ChoiceGroup's `id`): the link goes to
   * its first option. For a date, the first part in error.
   */
  href: string;
};

export interface ErrorSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** One per answer in error. Nothing renders when the list is empty. */
  errors: ErrorSummaryItem[];
  title?: string;
  /** A line under the title, only if something applies to every error. */
  description?: ReactNode;
  /** Take focus when shown (and when the errors change), so a screen reader hears it and the next Tab is the first link. */
  focusOnShow?: boolean;
  /**
   * Put this at the start of the page's title while the summary is shown,
   * and take it off after, so a screen reader announces the error with the
   * page. Set false when the page manages its own title (a server-rendered
   * page that sets "Error: " itself).
   */
  titlePrefix?: string | false;
}

/**
 * ErrorSummary — the list of what went wrong, at the top of the page.
 *
 * After a form is submitted with mistakes: a box above the page's heading
 * titled "There is a problem", every error as a link to its field, focus on
 * the box, and "Error: " at the start of the page's title. A link moves
 * focus to the field and scrolls its label (or its group's legend) into view
 * with it, so the reader sees the question and not just a box. Each message
 * is worded exactly as the error beside its field: the summary repeats them,
 * it does not replace them. Shown for a single error too.
 */
export function ErrorSummary({
  errors,
  title = "There is a problem",
  description,
  focusOnShow = true,
  titlePrefix = "Error: ",
  ...rest
}: ErrorSummaryProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const shown = errors.length > 0;
  const key = errors.map((e) => e.href + e.text).join("|");

  useEffect(() => {
    if (shown && focusOnShow) box.current?.focus();
  }, [shown, focusOnShow, key]);

  useEffect(() => {
    if (!shown || !titlePrefix || typeof document === "undefined") return;
    if (document.title.startsWith(titlePrefix)) return;
    document.title = titlePrefix + document.title;
    return () => {
      if (document.title.startsWith(titlePrefix)) document.title = document.title.slice(titlePrefix.length);
    };
  }, [shown, titlePrefix]);

  /* Focus the field, and bring its label or legend into view with it. */
  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    const target = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!target) return;
    /* A group (a ChoiceGroup's fieldset, a date's) is not focusable: its first control is. */
    const field = target.matches("input, select, textarea, button")
      ? target
      : target.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea") ?? target;
    e.preventDefault();
    const legend = field.closest("fieldset")?.querySelector(":scope > legend");
    const label = field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null;
    (legend ?? label ?? field).scrollIntoView({ block: "start" });
    field.focus({ preventScroll: true });
  };

  if (!shown) return null;

  return (
    <div {...rest} ref={box} data-tk="error-summary" tabIndex={-1} aria-labelledby={`${id}-title`}>
      <div role="alert">
        <h2 data-tk="error-summary-title" id={`${id}-title`}>
          {title}
        </h2>
        {description ? <div data-tk="error-summary-description">{description}</div> : null}
        <ul data-tk="error-summary-list">
          {errors.map((err) => (
            <li key={err.href + err.text}>
              <a data-tk="error-summary-link" href={err.href} onClick={(e) => go(e, err.href)}>
                {err.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
