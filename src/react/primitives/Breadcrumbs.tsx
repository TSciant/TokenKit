import type { HTMLAttributes } from "react";

export type BreadcrumbsItem = {
  label: string;
  href: string;
};

export interface BreadcrumbsProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** The pages above this one, from the top of the site down. Each is a link. */
  items: BreadcrumbsItem[];
  /**
   * This page's name, as the last crumb. Not a link, and marked as the current
   * page. Leave it out when the page's heading sits right under the trail and
   * says the same thing.
   */
  current?: string;
  /** The landmark's name. "Breadcrumb" unless the page has a second trail. */
  label?: string;
  /**
   * On a narrow box, show only the way up: the parent, as a back link. On by
   * default; turn it off where the whole trail is short enough to wrap.
   */
  collapse?: boolean;
}

/**
 * Breadcrumbs — where this page sits: the pages above it, each a link, from
 * the top of the site down.
 *
 * Use for: sites more than two levels deep, where a reader may arrive from
 * search and want to go up a level. Don't use for: the steps of a form (a
 * trail is places, not progress), history (it is where the page is, not where
 * the reader came from), or a site of one level.
 *
 * An ordered list in a navigation landmark named "Breadcrumb". The marks
 * between crumbs are drawn in CSS, so nothing is read aloud between them.
 * When its box is narrow, the trail folds to the parent alone, as a back link
 * with an arrow: the one step up is what a phone reader wants, and a trail
 * wrapped onto three lines is mostly noise.
 */
export function Breadcrumbs({ items, current, label = "Breadcrumb", collapse = true, ...rest }: BreadcrumbsProps) {
  return (
    <nav data-tk="breadcrumbs" aria-label={label} data-collapse={collapse ? "" : undefined} {...rest}>
      <ol data-tk="breadcrumbs-list">
        {items.map((item, i) => (
          <li key={`${i}-${item.label}`} data-tk="breadcrumbs-item" data-parent={i === items.length - 1 ? "" : undefined}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
        {current ? (
          <li data-tk="breadcrumbs-item" aria-current="page">
            {current}
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
