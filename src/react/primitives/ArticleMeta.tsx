import { Fragment, type HTMLAttributes, type ReactNode } from "react";
import { Chip } from "./Chip";
import { Eyebrow } from "./Eyebrow";

export type ArticleMetaPerson = {
  name: string;
  /** Their page, when they have one; the name becomes a link to it. */
  href?: string;
};

export type ArticleMetaTopic = {
  label: string;
  /** The topic's page; with it the topic is a link, without it a chip. */
  href?: string;
};

export interface ArticleMetaProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  /** What kind of piece it is ("Blog", "Report", "Podcast"), shown as a small label first. */
  type?: string;
  /** When it was published, as an ISO date ("2026-09-08"). Goes in the time element's datetime. */
  date: string;
  /**
   * The date in words, when the formatted one is not what you want
   * ("Published this morning", "Autumn 2026"). The ISO date stays in the markup.
   */
  dateLabel?: string;
  /** When it last changed in substance, as an ISO date. Shown as "Updated …". */
  updated?: string;
  /** Who wrote it, in byline order. Shown as "By A, B and C". */
  authors?: ArticleMetaPerson[];
  /** How long it takes, as it should read: "6 min read", "24 min listen". */
  readingTime?: string;
  /** What it is about. Chips when they go nowhere, links when each has a page. */
  topics?: ArticleMetaTopic[];
  /** The locale the dates are written in. */
  locale?: string;
}

/**
 * Read the calendar date off the front of an ISO string and write it out in
 * words. Only the date part counts: "2026-09-08T23:30:00-04:00" is the 8th
 * where it was written, and reading it through a time zone would make it the
 * 9th somewhere else, and different on the server than in the browser.
 */
function formatDate(iso: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(date);
}

function person(p: ArticleMetaPerson): ReactNode {
  return p.href ? <a href={p.href}>{p.name}</a> : p.name;
}

/** "A", "A and B", "A, B and C": a byline, said the way it would be written. */
function byline(people: ArticleMetaPerson[]): ReactNode {
  return people.map((p, i) => (
    <Fragment key={`${i}-${p.name}`}>
      {i === 0 ? null : i === people.length - 1 ? " and " : ", "}
      {person(p)}
    </Fragment>
  ));
}

/**
 * ArticleMeta — the line under an article's title: what it is, when it was
 * published (and updated), who wrote it, how long it takes, and what it is
 * about.
 *
 * One row that wraps, as a list, so a screen reader takes it a piece at a
 * time. The pieces are parted by quiet dots drawn in CSS, which are shapes
 * rather than characters: nothing is read aloud between them, and a dot that
 * would start a wrapped line is clipped away. Dates are time elements with
 * the ISO date in datetime. Not a place for actions: sharing and saving
 * belong in their own row.
 */
export function ArticleMeta({
  type,
  date,
  dateLabel,
  updated,
  authors,
  readingTime,
  topics,
  locale = "en-US",
  ...rest
}: ArticleMetaProps) {
  return (
    <ul data-tk="article-meta" {...rest}>
      {type ? (
        <li>
          <Eyebrow>{type}</Eyebrow>
        </li>
      ) : null}
      <li>
        <span data-tk="visually-hidden">Published </span>
        <time dateTime={date}>{dateLabel ?? formatDate(date, locale)}</time>
      </li>
      {updated ? (
        <li>
          Updated <time dateTime={updated}>{formatDate(updated, locale)}</time>
        </li>
      ) : null}
      {authors?.length ? <li>By {byline(authors)}</li> : null}
      {readingTime ? <li>{readingTime}</li> : null}
      {topics?.length ? (
        <li data-tk="article-meta-topics">
          <span data-tk="visually-hidden">Topics: </span>
          <ul>
            {/* Links get a comma after them, as written text would: two links
                side by side otherwise read as one phrase, to sight and aloud.
                Chips need none; each has its own edge. */}
            {topics.map((t, i) => (
              <li key={t.label}>
                {t.href ? (
                  <>
                    <a href={t.href}>{t.label}</a>
                    {i < topics.length - 1 ? "," : null}
                  </>
                ) : (
                  <Chip>{t.label}</Chip>
                )}
              </li>
            ))}
          </ul>
        </li>
      ) : null}
    </ul>
  );
}
