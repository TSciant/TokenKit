import type { HTMLAttributes, ReactNode } from "react";

export interface PhaseBannerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /**
   * What state the site is in, in a word or two: Prototype, Beta, Preview,
   * Staging. Shown as an eyebrow, first, because it is the one thing every
   * reader needs before they trust anything below it.
   */
  label?: string;
  /** Where you are, when that helps: the page or route. Optional. */
  title?: ReactNode;
  /**
   * One line of context: what this is, or where feedback goes. Keep it to a
   * sentence; a banner that needs two is a page.
   */
  children?: ReactNode;
  /** Stay at the top of the viewport while the page scrolls. Default true. */
  sticky?: boolean;
  /**
   * Announce changes to the title or text politely (the banner is a status
   * region). Default true; turn it off when the banner never changes.
   */
  live?: boolean;
}

/**
 * PhaseBanner — a quiet strip above the site header saying what state the
 * site is in (a prototype, a beta) and, optionally, where you are and one
 * line of context.
 *
 * It sits above SiteHeader (SiteHeader's `banner`) and sticks to the top by
 * default, so the caveat stays in view however far down a reader goes. It is
 * a statement, not an alert: no colour of its own beyond the surface, and no
 * close button, because the state it describes does not go away when someone
 * dismisses it.
 */
export function PhaseBanner({
  label = "Prototype",
  title,
  children,
  sticky = true,
  live = true,
  ...rest
}: PhaseBannerProps) {
  return (
    <div
      data-tk="phase-banner"
      data-sticky={sticky ? "" : undefined}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
      {...rest}
    >
      <span data-tk="eyebrow">{label}</span>
      {title ? <strong data-tk="phase-banner-title">{title}</strong> : null}
      {children ? <span data-tk="phase-banner-text">{children}</span> : null}
    </div>
  );
}
