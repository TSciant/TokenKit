import type { HTMLAttributes } from "react";
import { MenuButton } from "./MenuButton";

export type LanguageSwitcherLanguage = {
  /** BCP 47: "en", "cy", "fi", "ar". */
  code: string;
  /** The language's name in itself: "Cymraeg", "Suomi", "العربية". */
  name: string;
  /** The same page in that language. */
  href: string;
  /** The language this page is in. */
  current?: boolean;
  /** Hidden words in that language, for a screen reader: "Newid yr iaith i'r Gymraeg". */
  describe?: string;
  dir?: "ltr" | "rtl";
};

export interface LanguageSwitcherProps extends HTMLAttributes<HTMLElement> {
  languages: LanguageSwitcherLanguage[];
  /** The landmark's name, in the page's own language: "Language" here, "Iaith" on the Welsh page. */
  label?: string;
  /** How many to show before the rest move behind a menu. Default 3. */
  collapseAfter?: number;
  /** The menu's words, in the page's language: "More languages", "Lisää kieliä". */
  moreLabel?: string;
}

/**
 * LanguageSwitcher — the same page in another language.
 *
 * Links, each in its own language's name and marked with its language, so a
 * reader who knows none of the page's language still finds theirs, and a
 * screen reader says it in the right voice. The page's own language is shown
 * as the current one, and never behind the menu. Past a few, the rest
 * move behind a menu. Put it in the same place on every page; it goes to
 * the same page, keeps what was typed, and translates nothing. Only offer
 * a language the service is fully written in.
 */
export function LanguageSwitcher({ languages, label = "Language", collapseAfter = 3, moreLabel = "More languages", ...rest }: LanguageSwitcherProps) {
  const collapse = languages.length > collapseAfter + 1;
  let visible = collapse ? languages.slice(0, collapseAfter) : languages;
  /* The page's own language is never behind the menu: it takes the last visible place. */
  const current = languages.find((l) => l.current);
  if (collapse && current && !visible.includes(current)) visible = [...visible.slice(0, -1), current];
  const more = collapse ? languages.filter((l) => !visible.includes(l)) : [];
  return (
    <nav {...rest} data-tk="language-switcher" aria-label={label}>
      <ul data-tk="language-switcher-list">
        {visible.map((l) => (
          <li key={l.code}>
            {l.current ? (
              <span data-tk="language-switcher-current" lang={l.code} dir={l.dir} aria-current="true">{l.name}</span>
            ) : (
              <a data-tk="language-switcher-link" href={l.href} lang={l.code} hrefLang={l.code} dir={l.dir}>
                {l.describe ? <><span aria-hidden="true">{l.name}</span><span data-tk="visually-hidden">{l.describe}</span></> : l.name}
              </a>
            )}
          </li>
        ))}
        {more.length ? (
          <li>
            <MenuButton label={moreLabel} variant="quiet" items={more.map((l) => ({ label: l.name, href: l.href, current: l.current, lang: l.code, hreflang: l.code, dir: l.dir, describe: l.describe }))} />
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
