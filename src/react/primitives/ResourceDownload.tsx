import type { HTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

export interface ResourceDownloadProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  /** What the file is, as a title ("Annual report 2026"). It is the link's text. */
  title: string;
  /** Where the file is. */
  href: string;
  /** The file's format as a reader knows it: "PDF", "Excel", "PowerPoint", "CSV", "MP3". */
  format: string;
  /** How big it is, as it should read: "1.2 MB". Worth giving: it tells a reader on a phone what they are in for. */
  size?: string;
  /** How long it is, as it should read: "24 pages", "18 slides", "32 minutes". */
  length?: string;
  /** When it was published, as an ISO date. Goes in the time element's datetime. */
  date?: string;
  /** The date in words, when the formatted one is not what you want. */
  dateLabel?: string;
  /** One or two sentences on what is in it. */
  description?: string;
  /** Ask the browser to save the file rather than open it. Leave off for PDFs, which most readers want to open. */
  download?: boolean;
  /** Where to ask for the file in another format, when it may not suit assistive technology. */
  alternativeHref?: string;
  /** The words of that link. */
  alternativeLabel?: string;
  /** The level of the title's heading, to fit the outline of the page it is on. */
  headingLevel?: 2 | 3 | 4;
  /** @deprecated Use headingLevel; kept until the next minor release. */
  level?: 2 | 3 | 4;
  /** The locale the date is written in. */
  locale?: string;
}

const ICONS: Record<string, IconName> = {
  pdf: "fileText",
  word: "fileText",
  excel: "table",
  csv: "table",
  powerpoint: "layers",
  "slide deck": "layers",
  slides: "layers",
  mp3: "headphones",
  audio: "headphones",
  mp4: "film",
  video: "film",
  zip: "archive",
};

/* The tile's label: short enough for the tile. The whole name is in the line under the title. */
const SHORT: Record<string, string> = { powerpoint: "PPT", excel: "XLS", word: "DOC", keynote: "KEY" };
/* A known format by its usual letters; otherwise its first word, when that is short ("Slide deck" is "Slide"); otherwise none, and the icon alone says it is a file. */
const short = (format: string) => {
  const f = format.trim();
  const first = f.split(/s+/)[0];
  return SHORT[f.toLowerCase()] ?? (first.length <= 5 ? first : null);
};

function formatDate(iso: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(date);
}

/**
 * ResourceDownload — a file a reader can take away: a report, a slide deck, a
 * recording. Its title is the link, and under it what the reader is about to
 * get: the format, the size and how long it is.
 *
 * Use for: a document, deck, data file or recording offered as a file. Don't
 * use for: a page (link to it), a list of files that differ only in format
 * (one item, the formats in its line), or a button that only says "Download".
 * A link whose words are "Download" names nothing; out of context, a screen
 * reader's list of links reads "Download, Download, Download". The title is
 * the link here so every one says what it is.
 *
 * The format and size are written out next to the link, not hidden in it, so
 * everyone reads the same thing. The file's tile is a picture of a file, not
 * a preview, and is hidden from assistive technology. When a file may not
 * work with assistive technology (a scanned PDF, a deck), give
 * alternativeHref: a way to ask for it in another format.
 */
export function ResourceDownload({
  title,
  href,
  format,
  size,
  length,
  date,
  dateLabel,
  description,
  download,
  alternativeHref,
  alternativeLabel = "Request an accessible format",
  headingLevel, level: legacyLevel,
  locale = "en-US",
  ...rest
}: ResourceDownloadProps) {
  const level = headingLevel ?? legacyLevel ?? 3;
  const H = `h${level}` as "h2" | "h3" | "h4";
  const icon = ICONS[format.trim().toLowerCase()] ?? "file";
  return (
    <article data-tk="resource-download" {...rest}>
      <span data-tk="resource-download-tile" aria-hidden="true">
        <Icon name={icon} size="lg" />
        {short(format) ? <span data-tk="resource-download-format">{short(format)}</span> : null}
      </span>
      <div data-tk="resource-download-body">
        <H data-tk="resource-download-title">
          <a href={href} download={download ? "" : undefined}>
            {title}
          </a>
        </H>
        <ul data-tk="resource-download-meta">
          <li>{format}</li>
          {size ? <li>{size}</li> : null}
          {length ? <li>{length}</li> : null}
          {date ? (
            <li>
              <time dateTime={date}>{dateLabel ?? formatDate(date, locale)}</time>
            </li>
          ) : null}
        </ul>
        {description ? <p data-tk="resource-download-description">{description}</p> : null}
        {alternativeHref ? (
          <p data-tk="resource-download-alternative">
            <a href={alternativeHref}>{alternativeLabel}</a>
          </p>
        ) : null}
      </div>
    </article>
  );
}
