import type { HTMLAttributes, ReactNode } from "react";

export type UtilityLink = {
  label: string;
  href: string;
  /** The page this link goes to is the one being read: marked for a screen reader, and drawn as such. */
  current?: boolean;
};

export interface UtilityNavProps extends HTMLAttributes<HTMLElement> {
  /** The few links every page carries that are not the site's sections: contact, careers, a portal, log in. */
  links: UtilityLink[];
  /** The landmark's name, so it is told apart from the primary navigation. */
  label?: string;
  /** Which edge the row keeps to. End by default, out of the way of the brand. */
  // tk-vocab: align omits center, stretch — a utility row keeps to an edge; centred, it floats free of the brand and the nav
  align?: "start" | "end";
  /** After the links: an account name and Sign out, or a language switch. */
  end?: ReactNode;
}

/**
 * UtilityNav — a short row of small links above or beside the primary
 * navigation.
 *
 * The things a reader looks for on every page but that are not what the site
 * is about: contact, careers, a customer portal, log in. A navigation
 * landmark of its own, named so a screen reader hears it apart from the
 * primary one. Small and quiet, so it never competes with the sections; a few
 * links, not a second menu (anything that grows past five or six belongs in
 * the primary navigation or the footer). Put it at the top, above the
 * site-wide header: the general before the specific. SiteHeader takes it in
 * its `utility` slot.
 */
export function UtilityNav({ links, label = "Utility", align = "end", end, ...rest }: UtilityNavProps) {
  return (
    <nav {...rest} data-tk="utility-nav" data-align={align} aria-label={label}>
      <ul data-tk="utility-nav-list">
        {links.map((l) => (
          <li key={l.label} data-tk="utility-nav-item">
            <a data-tk="utility-nav-link" href={l.href} aria-current={l.current ? "page" : undefined}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      {end ? <div data-tk="utility-nav-end">{end}</div> : null}
    </nav>
  );
}
