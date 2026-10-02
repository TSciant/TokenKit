import { useId, type HTMLAttributes } from "react";

export type OnThisPageItem = {
  label: string;
  href: string;
  /** The heading you are at. */
  current?: boolean;
  /** Sub-headings, one level down. */
  items?: OnThisPageItem[];
};

export type OnThisPageProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  /** The small uppercase title, and the landmark's name. */
  title?: string;
  items: OnThisPageItem[];
};

function List({ items }: { items: OnThisPageItem[] }) {
  return (
    <ul data-tk="toc-list">
      {items.map((item) => (
        <li key={item.href}>
          <a data-tk="toc-link" href={item.href} aria-current={item.current ? "location" : undefined}>
            {item.label}
          </a>
          {item.items?.length ? <List items={item.items} /> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * The contents of a long page, as a list of its headings. Use for: an article,
 * a guide or a policy long enough to need a way back up, in a side rail. Don't
 * use for: moving between pages (use a section nav or the rail nav) or for a
 * page short enough to read without it. The heading you are at is
 * `aria-current="location"`; marking it as the reader scrolls is the page's job,
 * and this component only draws what it is told.
 */
export function OnThisPage({ title = "On this page", items, ...rest }: OnThisPageProps) {
  const id = useId();
  return (
    <nav data-tk="toc" aria-labelledby={id} {...rest}>
      <p data-tk="toc-title" id={id}>
        {title}
      </p>
      <List items={items} />
    </nav>
  );
}
