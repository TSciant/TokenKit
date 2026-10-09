import { useId, type HTMLAttributes } from "react";
import { Arrow } from "./Arrow";

export type LinkListItem = {
  label: string;
  href: string;
  /** A line about where it goes. Optional: most link lists are labels only. */
  description?: string;
};

export interface LinkListProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** A small header naming the list, when nothing above it does. Also the list's accessible name. */
  title?: string;
  items: LinkListItem[];
  /** Columns on a wide screen (1, 2 or 3); one on a narrow one. */
  columns?: 1 | 2 | 3;
}

/**
 * LinkList — links to other pages as a list of short labels: the pages under
 * a section, related reading, quick links.
 *
 * Each row is a whole link with an arrow at its end, ruled off from the next,
 * so a long list scans as a column of places to go. It sits in the content,
 * not in a navigation landmark: the site's navigation is the header's and the
 * rail's. When each link needs a picture or a paragraph, it is a card
 * collection instead.
 */
export function LinkList({ title, items, columns = 1, ...rest }: LinkListProps) {
  const id = useId();
  return (
    <div data-tk="link-list" data-columns={columns > 1 ? String(columns) : undefined} {...rest}>
      {title ? (
        <p data-tk="link-list-title" id={id}>
          {title}
        </p>
      ) : null}
      <ul data-tk="link-list-items" aria-labelledby={title ? id : undefined}>
        {items.map((item) => (
          <li key={item.href + item.label}>
            <a data-tk="link-list-link" href={item.href}>
              <span data-tk="link-list-text">
                <span data-tk="link-list-label">{item.label}</span>
                {item.description ? <span data-tk="link-list-description">{item.description}</span> : null}
              </span>
              <Arrow />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
