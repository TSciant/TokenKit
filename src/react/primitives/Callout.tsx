import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * inset: content that should stand out from the page, but that a reader
   * will be fine without. warning: something time-critical, that could
   * affect someone's safety, money or rights, or that corrects a common
   * mistake. At most two warnings on a page.
   */
  variant?: "inset" | "warning";
  /** The heading. Required for a warning (short and specific: "Travelling in the next 3 weeks"); optional for inset text. */
  title?: string;
  /** The heading's level, to fit the page's outline. */
  headingLevel?: 2 | 3 | 4;
  /**
   * Words only a screen reader hears before the callout, so it is heard as
   * set apart and not as more body text. "Information" for inset text,
   * "Important" for a warning (left out when the heading already says
   * important). Rewrite it to suit ("Warning", "Legal").
   */
  label?: string;
  children?: ReactNode;
}

/**
 * Callout — a block set apart from the body text.
 *
 * Two kinds, chosen by how much it matters. Inset text stands out with a
 * thick rule down its edge and no fill: worth noticing, safe to miss.
 * A warning is for what a reader must not miss: a short specific heading,
 * the warning icon and a full border on the warning surface, so its shape
 * says it as well as its colour. Both carry a hidden label, so a screen
 * reader hears where the callout starts. Neither is an alert: a callout is
 * part of the page's content, there when the page loads, never announced
 * (a message about something that just happened is an Alert or a Toast).
 */
export function Callout({ variant = "inset", title, headingLevel = 3, label, children, ...rest }: CalloutProps) {
  const id = useId();
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  const said = label ?? (variant === "warning" ? "Important" : "Information");
  const hideLabel = variant === "warning" && title && /important/i.test(title);
  const hidden = hideLabel ? null : <span data-tk="visually-hidden">{said}: </span>;

  return (
    <div {...rest} data-tk="callout" data-variant={variant} aria-labelledby={title ? `${id}-title` : undefined} role={title ? "group" : undefined}>
      {title ? (
        <H data-tk="callout-title" id={`${id}-title`}>
          {variant === "warning" ? <Icon name="warning" /> : null}
          <span>
            {hidden}
            {title}
          </span>
        </H>
      ) : null}
      <div data-tk="callout-body">
        {title ? null : hidden}
        {children}
      </div>
    </div>
  );
}
