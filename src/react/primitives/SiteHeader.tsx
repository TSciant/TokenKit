"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, useState, type ReactNode } from "react";

export type SiteHeaderProps = {
  brand?: ReactNode;
  nav?: { label: string; href?: string }[];
  /** Mega-menu sheet on small boxes instead of a stacked restructure. */
  withMegaMenu?: boolean;
  actions?: ReactNode;
};

const DEFAULT_NAV = [
  { label: "Services", href: "#main" },
  { label: "About", href: "#main" },
  { label: "Insights", href: "#main" },
  { label: "Contact", href: "#main" },
];

/**
 * Site chrome: brand, primary nav, optional mega sheet. Graceful small-box
 * degradation via sheet — not a second mobile DOM.
 */
export function SiteHeader({
  brand = "Token Kit",
  nav = DEFAULT_NAV,
  withMegaMenu = false,
  actions,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  return (
    <header data-tk="site-header" data-mega={withMegaMenu ? "" : undefined}>
      <div data-tk="site-header-bar">
        <a href="#main" data-tk="site-header-brand">
          {brand}
        </a>

        <nav aria-label="Primary" data-tk="site-header-nav">
          <ul>
            {nav.map((item) => (
              <li key={item.label}>
                <a href={item.href ?? "#main"}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div data-tk="site-header-actions">
          {actions}
          {withMegaMenu ? (
            <button
              type="button"
              data-tk="button"
              data-variant="quiet"
              data-size="sm"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((v) => !v)}
            >
              Menu
            </button>
          ) : null}
        </div>
      </div>

      {withMegaMenu && menuOpen ? (
        <div data-tk="site-header-sheet" id={menuId}>
          <p data-tk="site-header-sheet-heading">Explore</p>
          <ul data-tk="site-header-sheet-list">
            {nav.map((item) => (
              <li key={item.label}>
                <a href={item.href ?? "#main"} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
