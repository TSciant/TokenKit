"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, useState } from "react";
import { HeaderSearch } from "../react/patterns/chrome";
import { PROTO_NAV, type ProtoRoute } from "./nav";

export function PrototypeHeader({
  current,
  onNavigate,
}: {
  current: ProtoRoute;
  onNavigate: (route: ProtoRoute) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const go = (route: ProtoRoute) => {
    setMenuOpen(false);
    onNavigate(route);
    window.scrollTo(0, 0);
  };

  return (
    <header data-tk="site-header">
      <div data-tk="site-header-bar">
        <button
          type="button"
          data-tk="site-header-brand"
          onClick={() => go("home")}
          style={{
            background: "none",
            border: 0,
            padding: 0,
            cursor: "pointer",
            font: "inherit",
            color: "inherit",
          }}
        >
          Token Kit
        </button>

        <nav aria-label="Primary" data-tk="site-header-nav">
          <ul>
            {PROTO_NAV.map((item) => (
              <li key={item.route}>
                <button
                  type="button"
                  data-tk="nav-link"
                  data-current={current === item.route ? "" : undefined}
                  aria-current={current === item.route ? "page" : undefined}
                  onClick={() => go(item.route)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          data-tk="button"
          data-variant="outline"
          data-size="sm"
          data-header-menu=""
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>

        <div data-tk="site-header-actions">
          <HeaderSearch />
          <button
            data-tk="button"
            data-size="sm"
            type="button"
            onClick={() => go("contact")}
          >
            Contact us
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id={menuId} data-tk="compact-nav" role="dialog" aria-label="Menu">
          <nav aria-label="Primary mobile">
            <ul data-shell="stack" data-gap="2" style={{ listStyle: "none", margin: 0, padding: "var(--tk-space-4)" }}>
              {PROTO_NAV.map((item) => (
                <li key={item.route}>
                  <button
                    type="button"
                    data-tk="button"
                    data-variant={current === item.route ? "solid" : "quiet"}
                    onClick={() => go(item.route)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  data-tk="button"
                  data-variant="solid"
                  onClick={() => go("contact")}
                >
                  Contact us
                </button>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
