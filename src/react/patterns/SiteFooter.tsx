import { ipsumLabels } from "../../lib/token-ipsum";
import { BRAND } from "./brand";
import { Plate } from "../primitives/Plate";

/* SiteFooter, in a file of its own so a client cut can take it without the rest of chrome.tsx, which re-exports it. */

export const FOOTER_LEGAL_LINKS = ipsumLabels(3, "footer-legal-links");

export const FOOTER_NAV_LINKS = ipsumLabels(3, "footer-nav-links");

export const FOOTER_SOCIAL_LINKS = ipsumLabels(3, "footer-social-links");

export const FOOTER_SUBSCRIBE_LABEL = `Subscribe to the ${BRAND} weekly roundup`;

export const FOOTER_COPYRIGHT = `© 2026 ${BRAND}. All rights reserved.`;

export type SiteFooterProps = {
  legalLinks?: string[];
  navLinks?: string[];
  socialLinks?: string[];
  /** Aria label for the social list. */
  socialLabel?: string;
  subscribeLabel?: string;
  subscribeCta?: string;
  copyright?: string;
  /** 1-6. Picks the stand-in mark. */
  seed?: number;
};

/** 13 — the inverted closing band. */
export function SiteFooter({
  legalLinks = FOOTER_LEGAL_LINKS,
  navLinks = FOOTER_NAV_LINKS,
  socialLinks = FOOTER_SOCIAL_LINKS,
  socialLabel = "Social",
  subscribeLabel = FOOTER_SUBSCRIBE_LABEL,
  subscribeCta = "Sign up now",
  copyright = FOOTER_COPYRIGHT,
  seed = 4,
}: SiteFooterProps = {}) {
  return (
    <footer data-on="inverse" style={{ padding: "var(--tk-space-7) var(--tk-gutter)" }}>
      <div data-shell="sidebar" data-gap="6" data-side="start">
        <div data-shell="stack" data-gap="3" style={{ flexBasis: "12rem" }}>
          <Plate ratio="1 / 1" texture="none" seed={seed} style={{ inlineSize: "5rem" }} />
          <ul data-shell="inline" data-gap="2" style={{ fontSize: "var(--tk-size-sm)" }}>
            {legalLinks.map((l) => (
              <li key={l}>
                <a href="#main" data-tk="footer-link">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* alignItems as well as textAlign: a stack's children hug their content, so text-align
            alone ended the text inside boxes that themselves sat at the column's start, and the
            subscribe line and the copyright drifted left of the nav and the chips. */}
        <div data-shell="stack" data-gap="3" style={{ textAlign: "end", alignItems: "flex-end" }}>
          <ul
            data-shell="inline"
            data-gap="3"
            style={{ justifyContent: "flex-end", fontSize: "var(--tk-size-sm)" }}
          >
            {navLinks.map((l) => (
              <li key={l}>
                <a href="#main" data-tk="footer-link">
                  {l}
                </a>
              </li>
            ))}
          </ul>

          <p style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
            {subscribeLabel}{" "}
            <a href="#main" data-tk="footer-link">
              {subscribeCta}
            </a>
          </p>

          <ul
            data-shell="inline"
            data-gap="2"
            aria-label={socialLabel}
            style={{ justifyContent: "flex-end" }}
          >
            {socialLinks.map((s) => (
              <li key={s}>
                <a href="#main" data-tk="chip" data-interactive>
                  {s}
                </a>
              </li>
            ))}
          </ul>

          <p style={{ margin: 0, fontSize: "var(--tk-size-sm)", color: "var(--tk-text-secondary)" }}>
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
