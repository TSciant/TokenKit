import { useId, type HTMLAttributes } from "react";

export type RailNavItem = {
  label: string;
  href?: string;
  /** The page you are on: bolds the row and marks it with a dot. */
  current?: boolean;
  /** A group: these are its children. */
  items?: RailNavItem[];
  /** Open on first paint. A group holding the current page should be open. */
  open?: boolean;
};

export type RailNavProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  /** The small uppercase header, and the landmark's name. */
  title?: string;
  items: RailNavItem[];
};

function Row({ item }: { item: RailNavItem }) {
  if (item.items?.length) {
    return (
      <li>
        <details open={item.open}>
          <summary data-tk="rail-nav-link">
            <span data-tk="rail-nav-mark" aria-hidden="true">
              <svg data-tk="rail-nav-chevron" viewBox="0 0 16 16" focusable="false">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </span>
            <span>{item.label}</span>
          </summary>
          <ul data-tk="rail-nav-list">
            {item.items.map((child) => (
              <Row key={child.label} item={child} />
            ))}
          </ul>
        </details>
      </li>
    );
  }
  return (
    <li>
      <a data-tk="rail-nav-link" href={item.href ?? "#"} aria-current={item.current ? "page" : undefined}>
        <span data-tk="rail-nav-mark" aria-hidden="true">
          {item.current ? <span data-tk="rail-nav-dot" /> : null}
        </span>
        <span>{item.label}</span>
      </a>
    </li>
  );
}

/**
 * Category navigation for a side rail: a header, and a panel of links with
 * groups that open natively. It fills its container, so the rail's width is the
 * page's decision. The current page is `aria-current="page"`, which is also what
 * bolds it, so the styling cannot drift from what a screen reader hears.
 */
export function RailNav({ title = "Categories", items, ...rest }: RailNavProps) {
  const id = useId();
  return (
    <nav data-tk="rail-nav" aria-labelledby={id} {...rest}>
      <p data-tk="rail-nav-title" id={id}>
        {title}
      </p>
      <div data-tk="rail-nav-panel">
        <ul data-tk="rail-nav-list">
          {items.map((item) => (
            <Row key={item.label} item={item} />
          ))}
        </ul>
      </div>
    </nav>
  );
}
