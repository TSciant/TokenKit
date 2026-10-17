import type { HTMLAttributes, ReactNode } from "react";

export type SummaryAction = {
  /** The visible words ("Change"). */
  label: string;
  href: string;
  /** What it changes, said after the label to a screen reader ("Change: date of birth"). Defaults to the row's key when that is text. */
  context?: string;
};

export type SummaryRow = {
  key: ReactNode;
  value: ReactNode;
  action?: SummaryAction;
};

export interface SummaryListProps extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
  rows: SummaryRow[];
  /** Hairlines between rows (default), or none, for a short list inside a card. */
  divided?: boolean;
}

/**
 * SummaryList — facts as pairs of a name and a value, each changeable.
 *
 * Use for: what a reader has entered, before they send it (check your
 * answers); the details of a record (a profile, an order). Don't use for:
 * data a reader compares across rows and columns (a Table), or steps.
 *
 * A description list: each row a term and its details, read as pairs. A
 * row's action is a link whose words say what it changes ("Change", then,
 * hidden, the row's name), because a page of links all called "Change" is
 * no help to someone moving between links. Wide, a row is three columns;
 * in a box under 32rem the value goes under its name.
 */
export function SummaryList({ rows, divided = true, ...rest }: SummaryListProps) {
  return (
    <dl data-tk="summary-list" data-divided={divided ? "" : undefined} {...rest}>
      {rows.map((r, i) => (
        <div key={i} data-tk="summary-row">
          <dt data-tk="summary-key">{r.key}</dt>
          <dd data-tk="summary-value">{r.value}</dd>
          {r.action ? (
            <dd data-tk="summary-action">
              <a href={r.action.href}>
                {r.action.label}
                <span data-tk="visually-hidden"> {r.action.context ?? (typeof r.key === "string" ? r.key : "")}</span>
              </a>
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
