import type { HTMLAttributes } from "react";
import { Arrow } from "./Arrow";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";

export interface CaseStudyProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "results"> {
  /** Who or what it is about: the client, the sector. Shown above the title. */
  client?: string;
  title: string;
  /** The story in a sentence or two. */
  summary?: string;
  /**
   * The story in parts, each a label and a short paragraph: usually the
   * challenge, the approach and the outcome, in that order. Two to four.
   */
  parts?: { label: string; body: string }[];
  /** What came of it, as figures: two to four, each a value and what it counts. */
  results?: { value: string; label: string }[];
  /** A link to the whole story. */
  link?: { label: string; href: string };
  /** The title's heading level: h2 for a page's one case study, h3 for one in a section (the default). */
  level?: 2 | 3;
}

/**
 * CaseStudy — one piece of work told as a story: who it was for, what was
 * wrong, what was done and what came of it.
 *
 * The parts are a description list (a label, then its paragraph), the
 * results a row of figures, and the whole an article, because it stands on
 * its own. A grid of case-study teasers is a card collection of these, each
 * with its summary and link only.
 */
export function CaseStudy({ client, title, summary, parts, results, link, level = 3, ...rest }: CaseStudyProps) {
  return (
    <article data-tk="case-study" {...rest}>
      <div data-tk="case-study-head">
        {client ? <Eyebrow>{client}</Eyebrow> : null}
        <Heading level={level} text={level === 2 ? "heading-l" : "heading-m"}>
          {title}
        </Heading>
        {summary ? <p data-tk="case-study-summary">{summary}</p> : null}
      </div>
      {parts?.length ? (
        <dl data-tk="case-study-parts">
          {parts.map((p) => (
            <div key={p.label} data-tk="case-study-part">
              <dt>{p.label}</dt>
              <dd>{p.body}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {results?.length ? (
        <ul data-tk="case-study-results">
          {results.map((r) => (
            <li key={r.label}>
              <span data-tk="case-study-value">{r.value}</span>
              <span data-tk="case-study-measure">{r.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {link ? (
        <a data-tk="case-study-link" href={link.href}>
          {link.label}
          <Arrow />
        </a>
      ) : null}
    </article>
  );
}
