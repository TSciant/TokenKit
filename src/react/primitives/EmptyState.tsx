import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { STATUS_ICON } from "./status-icon";

export type EmptyStateCause = "first-use" | "configure" | "no-results" | "cleared" | "pending" | "no-access" | "error";

/* Each cause has its mark, so the same situation always looks the same. */
const MARK: Record<EmptyStateCause, IconName> = {
  "first-use": "plus",
  configure: "wrench",
  "no-results": "search",
  cleared: "inbox",
  pending: "clock",
  "no-access": "lock",
  error: STATUS_ICON.danger,
};

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * Why it is empty, which decides what it says and offers:
   * first-use "No [things] yet" and Create; configure "Configure [feature]";
   * no-results "No results found" and nothing louder than Clear filters;
   * cleared "No new [things]"; pending "You'll see [thing] here when …";
   * no-access "Access permissions needed"; error "Unable to load [thing]"
   * and Reload.
   */
  cause: EmptyStateCause;
  /** About five words, no full stop. Never "No data". */
  title: string;
  /** Its place in the page's outline. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** Full sentences: what happened and what to do, without blaming anyone. */
  description?: ReactNode;
  /** The one thing to do next. A link when it goes somewhere, a button when it acts. */
  action?: { label: string; href?: string; onClick?: () => void };
  /** A quieter way on: a link to read more, or Clear filters. */
  secondary?: { label: string; href?: string; onClick?: () => void };
  /** The cause's mark by default; false for words alone. */
  icon?: IconName | false;
  /** A picture in place of the mark (a Plate): decorative, never the message. */
  media?: ReactNode;
  /** compact: one sentence, for a card or a sidebar. section (default), or page for a whole page. */
  size?: "compact" | "section" | "page";
  /** An error's code, after the description, for support: never in the title. */
  reference?: string;
}

/**
 * EmptyState — where content would be, why there is none, and what to do.
 *
 * It replaces what is empty (the table, headers and all), so a screen reader
 * does not read an empty table first. A real heading at its place in the
 * outline, a sentence or two, and at most two ways on. Left-aligned as one
 * block. Its mark and any picture are decoration. Not while loading (that is
 * a Spinner or a Skeleton), and not for an error that needs action now (an
 * Alert).
 */
export function EmptyState({ cause, title, headingLevel = 2, description, action, secondary, icon, media, size = "section", reference, ...rest }: EmptyStateProps) {
  const H = `h${headingLevel}` as const;
  const mark = icon === false ? null : icon ?? MARK[cause];
  const compact = size === "compact";
  return (
    <div {...rest} data-tk="empty-state" data-size={size === "section" ? undefined : size}>
      {!compact && media ? <div data-tk="empty-state-media" aria-hidden="true">{media}</div> : !compact && mark ? <span data-tk="empty-state-mark"><Icon name={mark} size="lg" /></span> : null}
      {compact ? (
        <p data-tk="empty-state-title">
          {title}
          {secondary ? <> <a data-tk="empty-state-link" href={secondary.href ?? "#"} onClick={secondary.onClick ? (e) => { if (!secondary.href) e.preventDefault(); secondary.onClick?.(); } : undefined}>{secondary.label}</a></> : null}
        </p>
      ) : (
        <H data-tk="empty-state-title">{title}</H>
      )}
      {!compact && description ? <div data-tk="empty-state-description">{description}</div> : null}
      {!compact && reference ? <p data-tk="empty-state-reference">Reference: {reference}</p> : null}
      {!compact && (action || secondary) ? (
        <div data-tk="empty-state-actions">
          {action ? <Button href={action.href} onClick={action.onClick}>{action.label}</Button> : null}
          {secondary ? (
            secondary.href ? <a data-tk="empty-state-link" href={secondary.href}>{secondary.label}</a> : <Button variant="quiet" onClick={secondary.onClick}>{secondary.label}</Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
