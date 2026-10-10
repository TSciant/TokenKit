"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { ipsumDeck, ipsumHeadline, ipsumLabel } from "../../lib/token-ipsum";
/* Patterns now in files of their own, so a client cut can take one alone; re-exported here so no import moves. */
export { BRAND } from "./brand";
export { NAV, MEGA_TRIGGER, CONTACT_CTA_LABEL, ContactCta, HEADER_SEARCH_LABEL, HeaderSearch, MEGA_HEADINGS, MEGA, MEGA_ACTIONS, NAV_SHEET_PROMO_EYEBROW, NAV_SHEET_MORE_EYEBROW, Masthead } from "./Masthead";
/* MegaMenu is a type (the panel groups) and the panel component, under one name. */
export { MegaMenu } from "./Masthead";
export type { ContactCtaProps, HeaderSearchProps, MastheadProps, MegaMenuProps } from "./Masthead";
export { FOOTER_LEGAL_LINKS, FOOTER_NAV_LINKS, FOOTER_SOCIAL_LINKS, FOOTER_SUBSCRIBE_LABEL, FOOTER_COPYRIGHT, SiteFooter } from "./SiteFooter";
export type { SiteFooterProps } from "./SiteFooter";

/* ---------------------------------------------------------------------------
   01-04, 13, 14 — the chrome every page carries.
   Grayscale, unbranded, structural. No colour, no spacing value, no size in
   any of this file: everything reads --tk-*.

   As in marketing.tsx, every component takes its content and its shape as
   props, defaulted to Token Ipsum placeholders. Defaults are exported
   constants rather than inline literals — the story generator reads those
   defaults and can only emit an identifier or a literal, never a call — so a
   caller can spread and amend one; props are content and shape only, never
   styling.

   Every generator call is seeded with the component and the slot, so the same
   words come back on every run and two screenshots stay comparable.
--------------------------------------------------------------------------- */

export const PAGE_CRUMBS = ["Home", ipsumLabel("page-hero-crumb")];

export const PAGE_HERO_TITLE = ipsumHeadline("page-hero-title");

export const PAGE_HERO_DECK = ipsumDeck("page-hero-deck");

export type PageHeroProps = {
  title?: string;
  /** Ancestors only. The current page is appended from `title`. */
  crumbs?: string[];
  deck?: string;
  /** Aria label for the breadcrumb nav. */
  breadcrumbLabel?: string;
};

/** 14 — breadcrumb over a tinted title band. */
export function PageHero({
  title = PAGE_HERO_TITLE,
  crumbs = PAGE_CRUMBS,
  deck = PAGE_HERO_DECK,
  breadcrumbLabel = "Breadcrumb",
}: PageHeroProps = {}) {
  return (
    <div>
      <nav
        aria-label={breadcrumbLabel}
        style={{
          background: "var(--tk-surface-inverse)",
          padding: "var(--tk-space-3) var(--tk-gutter)",
        }}
      >
        <div data-on="inverse" style={{ background: "transparent", padding: 0 }}>
          <ol data-shell="inline" data-gap="2" style={{ fontSize: "var(--tk-size-sm)" }}>
            {crumbs.map((c) => (
              <li key={c} data-shell="inline" data-gap="2">
                <a href="#main">{c}</a>
                <span aria-hidden="true">/</span>
              </li>
            ))}
            <li aria-current="page">{title}</li>
          </ol>
        </div>
      </nav>

      <div
        style={{
          background: "var(--tk-surface-sunken)",
          /* Block padding only: the center shell inside carries the gutter.
             This band used to pad inline as well, and a title on a phone
             lost two gutters to it. */
          paddingBlock: "var(--tk-space-7)",
        }}
      >
        <div data-shell="center" data-width="wide" data-gap="3">
          <h1 style={{ margin: 0 }}>{title}</h1>
          {deck ? <p data-tk="card-body">{deck}</p> : null}
        </div>
      </div>
    </div>
  );
}

