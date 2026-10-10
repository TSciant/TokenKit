"use client";
/* Client component: it uses React state, effects or DOM APIs. See the note at the top of chrome.tsx. */

import { ipsumLabels, ipsumLabel, ipsumTitles, ipsumEyebrow } from "../../lib/token-ipsum";
import { useState, useId, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { BRAND } from "./brand";
/* Re-exported: the generated stories name the default brand as Masthead.BRAND. */
export { BRAND } from "./brand";
import { flushSync } from "react-dom";
import { Arrow } from "../primitives/Arrow";
import type { Cols } from "./types";
import { useMotionTokens } from "../../lib/motion-tokens";
/* The animated panel is loaded on demand — Motion is ~43 KB gzipped and this
   is the only place in the kit that needs it. See PresencePanelLazy.tsx. */
import { preloadPresencePanel, PresencePanel } from "../motion/PresencePanelLazy";

/* Masthead, in a file of its own so a client cut can take it without the rest of chrome.tsx, which re-exports it. */

/** Top-level destinations. */
export const NAV = ipsumLabels(6, "masthead-nav");

/** The nav item that owns the mega panel; every other item is a plain link. */
export const MEGA_TRIGGER = NAV[0];

export type ContactCtaProps = {
  children?: React.ReactNode;
  variant?: "solid" | "outline" | "quiet";
  size?: "sm" | "md" | "lg";
};

/** Label on the header's conversion affordance. */
export const CONTACT_CTA_LABEL = ipsumLabel("contact-cta-label");

/** 03 — the persistent conversion affordance in the header's trailing edge. */
export function ContactCta({
  children = CONTACT_CTA_LABEL,
  variant,
  size = "sm",
}: ContactCtaProps = {}) {
  return (
    <button data-tk="button" data-size={size} data-variant={variant} type="button">
      {children}
    </button>
  );
}

export type HeaderSearchProps = {
  /** Accessible name for the field. */
  label?: string;
  /** The one placeholder the kit keeps. The label is hidden here, so once the
      field opens this is its only visible cue; it echoes the label and never
      replaces it. Text tertiary on the input's surface is in the contrast gate
      (input/placeholder). Every other field has a visible label and none. */
  placeholder?: string;
  /** Name of the submit button while collapsed, and once open. */
  openLabel?: string;
  submitLabel?: string;
  /** Whether the field starts expanded. */
  initialOpen?: boolean;
};

/** Accessible name for the header's search field. */
export const HEADER_SEARCH_LABEL = `Search ${BRAND}`;

/** 04 — a disclosure that eases open instead of swapping the DOM. */
export function HeaderSearch({
  label = HEADER_SEARCH_LABEL,
  placeholder = "Search",
  openLabel = "Open search",
  submitLabel = "Search",
  initialOpen = false,
}: HeaderSearchProps = {}) {
  const [open, setOpen] = useState(initialOpen);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  /* Focus after the state change, in the event handler rather than an effect.
     The input is always mounted now, so there is no mount to hang a ref
     callback on, and `inert` has to come off before anything can be focused.
     flushSync is the documented way to say "apply this render now, then touch
     the DOM" — an effect would be a second render and a frame of delay. */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (open) return;
    flushSync(() => setOpen(true));
    input.current?.focus();
  };

  return (
    <form
      role="search"
      data-tk="search"
      data-open={open || undefined}
      onSubmit={submit}
      onBlur={(e) => {
        // Collapse only when focus leaves the whole control and nothing is typed.
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        if (!input.current?.value) setOpen(false);
      }}
    >
      {/* An icon-only search box has no accessible name. This one does, and it
          is the only visually hidden element left in the control. */}
      <label data-tk="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <input
        ref={input}
        id={id}
        data-tk="input"
        type="search"
        placeholder={placeholder}
        inert={!open}
      />
      <button
        data-tk="button"
        data-size="sm"
        data-variant="quiet"
        type="submit"
        aria-expanded={open}
        aria-controls={id}
      >
        <SearchIcon />
        <span data-tk="visually-hidden">{open ? submitLabel : openLabel}</span>
      </button>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Three group headings; the column count below follows them. */
export const MEGA_HEADINGS = ipsumTitles(3, "mega-menu-headings");

/** Mega panel groups: a heading mapped to its destinations. */
export type MegaMenu = Record<string, string[]>;

export const MEGA: MegaMenu = {
  [MEGA_HEADINGS[0]]: ipsumLabels(4, "mega-menu-group-1"),
  [MEGA_HEADINGS[1]]: ipsumLabels(6, "mega-menu-group-2"),
  [MEGA_HEADINGS[2]]: ipsumLabels(8, "mega-menu-group-3"),
};

/** Carried by both the wide mega panel's rail and the compact sheet's promo. */
export const MEGA_ACTIONS = ipsumLabels(2, "mega-menu-actions");

/** Kickers over the compact sheet's promo and its spill-over nav. */
export const NAV_SHEET_PROMO_EYEBROW = ipsumEyebrow("nav-sheet-promo-eyebrow");

export const NAV_SHEET_MORE_EYEBROW = ipsumEyebrow("nav-sheet-more-eyebrow");

/**
 * Compact navigation sheet — graceful degradation of the mega menu.
 * Same facts as the wide mega (promo + grouped links + top-level destinations),
 * stacked for a narrow header box. Not a second IA.
 */
function NavSheet({
  id,
  open,
  onClose,
  withMega,
  navItems,
  menu,
  trigger,
  actions,
  cta,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  withMega: boolean;
  navItems: string[];
  menu: MegaMenu;
  trigger: string;
  actions: string[];
  /** The contact action, shown at the foot of the sheet when the header is too narrow to hold it. */
  cta?: ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        document.querySelector<HTMLButtonElement>("[data-header-menu]")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const first = wrap.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={wrap}
      id={id}
      data-tk="site-header-drawer"
      data-open={open ? "" : undefined}
      hidden={!open}
    >
      <div data-tk="site-header-sheet">
        {withMega ? (
          <>
            <div data-on="inverse" data-tk="site-header-promo" data-shell="stack" data-gap="3">
              <p data-tk="eyebrow" style={{ margin: 0 }}>
                {NAV_SHEET_PROMO_EYEBROW}
              </p>
              {/* The first action is the one the sheet is selling; the rest sit
                  under it as outlines. */}
              {actions.map((label, n) => (
                <button
                  key={label}
                  data-tk="button"
                  data-variant={n === 0 ? "solid" : "outline"}
                  data-size="sm"
                  type="button"
                  onClick={onClose}
                >
                  {label} <Arrow />
                </button>
              ))}
            </div>

            <div data-shell="stack" data-gap="5">
              {Object.entries(menu).map(([heading, links]) => (
                <section key={heading} data-shell="stack" data-gap="2" aria-labelledby={`${id}-${heading}`}>
                  <h3 id={`${id}-${heading}`} data-tk="site-header-sheet-heading">
                    {heading}
                  </h3>
                  <ul data-tk="site-header-sheet-list">
                    {links.map((l) => (
                      <li key={l}>
                        <a href="#main" onClick={onClose}>
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div data-tk="site-header-sheet-rule" />

            <nav aria-label="More" data-shell="stack" data-gap="1">
              <p data-tk="eyebrow" style={{ margin: 0 }}>
                {NAV_SHEET_MORE_EYEBROW}
              </p>
              <ul data-tk="site-header-sheet-list">
                {navItems
                  .filter((item) => item !== trigger)
                  .map((item) => (
                    <li key={item}>
                      <a href="#main" onClick={onClose}>
                        {item}
                      </a>
                    </li>
                  ))}
              </ul>
            </nav>
          </>
        ) : (
          <nav aria-label="Primary">
            <ul data-tk="site-header-sheet-list">
              {navItems.map((item) => (
                <li key={item}>
                  <a href="#main" onClick={onClose}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {cta ? <div data-tk="site-header-sheet-cta">{cta}</div> : null}
      </div>
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {open ? (
        <path
          d="M4 4l10 10M14 4L4 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M3 5h12M3 9h12M3 13h12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export type MastheadProps = {
  /** Wordmark text. */
  brand?: string;
  navItems?: string[];
  /** Aria label for the primary nav. */
  navLabel?: string;
  /** Swaps the inline nav for the mega menu, wide and compact alike. */
  withMegaMenu?: boolean;
  megaMenu?: MegaMenu;
  /** The nav item that owns the panel; every other item is a plain link. */
  megaTrigger?: string;
  megaActions?: string[];
  megaColumns?: Cols;
  /** The mega panel open on first render (wide header only). */
  megaInitialOpen?: boolean;
  showSearch?: boolean;
  /** The search field's accessible name. Left out, it is “Search” and the brand, so a site named in `brand` is the site searched. */
  searchLabel?: string;
  showContactCta?: boolean;
  /** The contact button's label (“Contact us”, “Book a call”). */
  contactLabel?: string;
};

/** 01 — wordmark, nav, CTA, search.
 *
 * Wide: inline nav (optional mega). Narrow: same facts in a sheet behind Menu.
 * Graceful degradation, not a restructured mobile chrome.
 */
export function Masthead({
  brand = BRAND,
  navItems = NAV,
  navLabel = "Primary",
  withMegaMenu = false,
  megaMenu = MEGA,
  megaTrigger = MEGA_TRIGGER,
  megaActions = MEGA_ACTIONS,
  megaColumns = 3,
  megaInitialOpen = false,
  showSearch = true,
  searchLabel,
  showContactCta = true,
  contactLabel = CONTACT_CTA_LABEL,
}: MastheadProps = {}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const close = () => setMenuOpen(false);

  return (
    <header data-tk="site-header" data-mega={withMegaMenu ? "" : undefined}>
      <div data-tk="site-header-bar">
        <a href="#main" data-tk="site-header-brand">
          {brand}
        </a>

        <nav aria-label={navLabel} data-tk="site-header-nav">
          {withMegaMenu ? (
            <MegaMenu
              navItems={navItems}
              menu={megaMenu}
              trigger={megaTrigger}
              actions={megaActions}
              columns={megaColumns}
              initialOpen={megaInitialOpen}
            />
          ) : (
            <ul>
              {navItems.map((item) => (
                <li key={item}>
                  <a href="#main">{item}</a>
                </li>
              ))}
            </ul>
          )}
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
          <MenuIcon open={menuOpen} />
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>

        <div data-tk="site-header-actions">
          {showSearch ? <HeaderSearch label={searchLabel ?? `Search ${brand}`} /> : null}
          {showContactCta ? (
            <span data-header-cta="">
              <ContactCta>{contactLabel}</ContactCta>
            </span>
          ) : null}
        </div>
      </div>

      <NavSheet
        id={menuId}
        open={menuOpen}
        onClose={close}
        withMega={withMegaMenu}
        navItems={navItems}
        menu={megaMenu}
        trigger={megaTrigger}
        actions={megaActions}
        cta={showContactCta ? <ContactCta variant="solid" size="md">{contactLabel}</ContactCta> : undefined}
      />
    </header>
  );
}

export type MegaMenuProps = {
  navItems?: string[];
  menu?: MegaMenu;
  /** The nav item that owns the panel; every other item is a plain link. */
  trigger?: string;
  actions?: string[];
  columns?: Cols;
  /** Open on first render, so the panel can be looked at without a click. */
  initialOpen?: boolean;
};

/** 02 — the mega menu, opened by click and closed by Escape. */
function MegaMenu({
  navItems = NAV,
  menu = MEGA,
  trigger = MEGA_TRIGGER,
  actions = MEGA_ACTIONS,
  columns = 3,
  initialOpen = false,
}: MegaMenuProps = {}) {
  const [open, setOpen] = useState<string | null>(initialOpen ? trigger : null);
  const wrap = useRef<HTMLDivElement>(null);
  const panelId = useId();

  /* Motion rather than CSS for this one, because the panel leaves as well as
     arrives. A CSS transition cannot animate an element that React has already
     unmounted; @starting-style covers the entrance and nothing covers the
     exit. AnimatePresence holds the node until its exit finishes. Both
     transitions are read from --tk-motion-*, so the panel and every CSS
     transition in the kit stay on the same pace. */
  const tokens = useMotionTokens(wrap.current);

  /* This one is an effect on purpose. Document-level listeners are an external
     system with a lifetime React does not manage, subscribed on open and torn
     down on close — the textbook case, and the only one left in the kit
     outside src/lib/use-measure.ts. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        wrap.current?.querySelector<HTMLButtonElement>("[aria-expanded='true']")?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    /* No positioning here on purpose. The panel is anchored to the header (which is
       position: relative), not to this cell of it: anchored to the cell, a panel
       is as wide as the nav column and its groups fold into one tall stack. */
    <div ref={wrap}>
      <ul data-shell="inline" data-gap="5" style={{ justifyContent: "center" }}>
        {navItems.map((item) => {
          const hasPanel = item === trigger;
          return (
            <li key={item}>
              {hasPanel ? (
                <button
                  data-tk="button"
                  data-variant="quiet"
                  data-size="sm"
                  type="button"
                  aria-expanded={open === item}
                  aria-controls={panelId}
                  /* Start fetching the animation module a beat before it is
                     needed. Hover and focus both reach it; a click that beats
                     the fetch still opens the panel, just without the tween. */
                  onPointerEnter={preloadPresencePanel}
                  onFocus={preloadPresencePanel}
                  onClick={() => setOpen(open === item ? null : item)}
                >
                  {item}
                  <span aria-hidden="true" style={{ fontSize: "0.7em" }}>
                    {open === item ? "▲" : "▼"}
                  </span>
                </button>
              ) : (
                <a href="#main">{item}</a>
              )}
            </li>
          );
        })}
      </ul>

      <PresencePanel
        show={Boolean(open)}
        enter={tokens.enter}
        exit={tokens.exit}
        id={panelId}
        attrs={{ "data-shell": "sidebar", "data-gap": "6" }}
        style={{
            position: "absolute",
            insetInlineStart: 0,
            insetInlineEnd: 0,
            insetBlockStart: "calc(100% + var(--tk-space-4))",
            zIndex: 10,
            padding: "var(--tk-space-6)",
            /* Surface root: never read-and-write --tk-radius-nested on one
               element. Outer = pad + leaf so inverse rail + buttons keep arcs. */
            ["--_radius-gap" as string]: "var(--tk-space-6)",
            ["--_radius" as string]:
              "calc(var(--_radius-gap) + var(--tk-radius-lg))",
            borderRadius: "var(--_radius)",
            ["--tk-radius-nested" as string]:
              "max(0px, calc(var(--_radius) - var(--_radius-gap)))",
            background: "var(--tk-surface-raised)",
            border: "1px solid var(--tk-line-default)",
            boxShadow: "var(--tk-shadow-md)",
          }}
        >
          {/* The promo rail. Inverted against the panel's own surface. */}
          <div
            data-on="inverse"
            data-shell="stack"
            data-gap="3"
            style={{
              padding: "var(--tk-space-5)",
              borderRadius: "var(--tk-radius-nested)",
              flexBasis: "14rem",
            }}
          >
            {actions.map((label) => (
              <button
                key={label}
                data-tk="button"
                data-variant="outline"
                data-size="sm"
                type="button"
              >
                {label} <Arrow />
              </button>
            ))}
          </div>

          <div data-shell="grid" data-cols={String(columns)} data-gap="6">
            {Object.entries(menu).map(([heading, links]) => (
              <div key={heading} data-shell="stack" data-gap="2">
                <h3
                  style={{
                    fontSize: "var(--tk-size-base)",
                    fontWeight: "var(--tk-weight-semibold)",
                    margin: 0,
                  }}
                >
                  {heading}
                </h3>
                <ul data-shell="stack" data-gap="1">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#main" style={{ fontSize: "var(--tk-size-sm)" }}>
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
      </PresencePanel>
    </div>
  );
}

/* Exported apart from its declaration, as it was in chrome.tsx: the masthead drives it, so it has no story of its own. */
export { MegaMenu };
