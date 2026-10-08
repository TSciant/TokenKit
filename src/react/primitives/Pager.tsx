import type { HTMLAttributes } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface PagerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> {
  /** The page shown now, from 1. */
  page: number;
  /** How many pages there are. */
  total: number;
  /** The address of page n. A pager is links: every page has a URL. */
  href: (page: number) => string;
  /**
   * The words on the way back, saying what is there: "Newer conversations",
   * "Previous results". Default "Previous".
   */
  prevLabel?: string;
  /** The words on the way on: "Older conversations". Default "Next". */
  nextLabel?: string;
  /**
   * Show the page numbers between them (the first, the last, and the pages
   * either side of this one, with gaps marked). Off, it says "Page 3 of 12".
   * On a narrow container the numbers fold back to that sentence.
   */
  numbers?: boolean;
  /** The navigation's accessible name. Default "Pages". */
  label?: string;
}

/** The numbers to show: first, last, and one either side of the current; null is a gap. */
export function pagerSlots(page: number, total: number): (number | null)[] {
  const keep = new Set(
    [1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total),
  );
  const out: (number | null)[] = [];
  let last = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - last === 2)
      out.push(n - 1); // a gap of one page shows the page, not "…"
    else if (n - last > 2) out.push(null);
    out.push(n);
    last = n;
  }
  return out;
}

/**
 * Pager — the way through a long list, one page at a time.
 *
 * Worded links back and on ("← Newer conversations"), absent at the ends
 * rather than disabled (there is nothing to press, so there is no button),
 * and where you are between them. Every page is a link with its own address,
 * so it works without JavaScript, can be shared and comes back with Back.
 * Not for steps through a form: those are a form's own Continue and Back.
 */
export function Pager({
  page,
  total,
  href,
  prevLabel = "Previous",
  nextLabel = "Next",
  numbers = false,
  label = "Pages",
  ...rest
}: PagerProps) {
  const count = (
    <p data-tk="pager-count">
      Page {page} of {total}
    </p>
  );
  return (
    <nav
      data-tk="pager"
      data-numbers={numbers ? "" : undefined}
      aria-label={label}
      {...rest}
    >
      <div data-tk="pager-row">
        <div data-tk="pager-prev">
          {page > 1 ? (
            <Button
              variant="outline"
              href={href(page - 1)}
              rel="prev"
              icon={<Icon name="arrowLeft" size="sm" />}
            >
              {prevLabel}
            </Button>
          ) : null}
        </div>
        {count}
        {numbers ? (
          <ol data-tk="pager-pages">
            {pagerSlots(page, total).map((n, i) =>
              n == null ? (
                <li key={`gap-${i}`} data-tk="pager-gap" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={n}>
                  <a
                    data-tk="pager-page"
                    href={href(n)}
                    aria-current={n === page ? "page" : undefined}
                    aria-label={`Page ${n}`}
                  >
                    {n}
                  </a>
                </li>
              ),
            )}
          </ol>
        ) : null}
        <div data-tk="pager-next">
          {page < total ? (
            <Button
              variant="outline"
              href={href(page + 1)}
              rel="next"
              icon={<Icon name="arrowRight" size="sm" />}
              iconPosition="trailing"
            >
              {nextLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
