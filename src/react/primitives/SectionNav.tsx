import { useId, type HTMLAttributes } from "react";

export type SectionNavItem = {
  label: string;
  href?: string;
  /** The page you are on: marks the link and says so to assistive technology. */
  current?: boolean;
};

export type SectionNavProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  /** The landmark's name, which tells a screen-reader user which navigation this is. */
  label?: string;
  items: SectionNavItem[];
};

/**
 * Local navigation: the pages beside this one, in a row under a hairline. Use for:
 * the siblings in the section you are in (a product's overview, specs and support;
 * a brand's pages). Don't use for: the site's primary navigation (use the masthead),
 * the steps of a form (use a progress indicator), or switching views on one page
 * (those are tabs, which are buttons). It fills its container and scrolls sideways
 * instead of wrapping. The current page is `aria-current="page"`, which is also
 * what marks it.
 */
export function SectionNav({ label = "In this section", items, ...rest }: SectionNavProps) {
  const id = useId();
  return (
    <nav data-tk="section-nav" aria-labelledby={id} {...rest}>
      <span data-tk="visually-hidden" id={id}>
        {label}
      </span>
      <ul data-tk="section-nav-list">
        {items.map((item) => (
          <li key={item.label}>
            <a data-tk="section-nav-link" href={item.href ?? "#"} aria-current={item.current ? "page" : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
