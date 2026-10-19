"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, type ReactNode } from "react";
import { Icon } from "./Icon";
import { useOpenSet } from "./disclosure-state";

export type FaqEntry = {
  id?: string;
  question: string;
  answer: ReactNode;
  /** Open on first paint. Ignored when the group is singleExpand and another item wins. */
  defaultOpen?: boolean;
};

export type FaqProps = {
  /** Section heading. Defaults by tone. Pass false to hide. */
  title?: string | false;
  eyebrow?: string;
  /** FAQ copy vs additional-information voice. */
  tone?: "faq" | "info";
  items: FaqEntry[];
  /** Only one panel open at a time. */
  singleExpand?: boolean;
  /** The level of each question's heading: one below the section's title (an h2), so 3 by default. */
  headingLevel?: 3 | 4 | 5;
  className?: string;
};

function defaultEyebrow(tone: "faq" | "info") {
  return tone === "info" ? "Good to know" : "FAQ";
}

function defaultTitle(tone: "faq" | "info") {
  return tone === "info"
    ? "Additional information"
    : "Frequently asked questions";
}

/**
 * Strong disclosure stack for FAQ or additional information.
 * Numbered triggers, plus/minus mark, measure-bound answers.
 *
 * Each question is a heading holding its button, as in Accordion (whose
 * engine it shares), so a screen-reader user can list the questions and
 * jump; a closed answer stays in the page, hidden, so the button always
 * names a region that exists.
 */
export function Faq({
  title,
  eyebrow,
  tone = "faq",
  items,
  singleExpand = false,
  headingLevel = 3,
  className,
}: FaqProps) {
  const baseId = useId();
  const [open, toggle] = useOpenSet(items, singleExpand);
  const H = `h${headingLevel}` as "h3" | "h4" | "h5";

  const showTitle = title !== false;
  const heading = title === false ? null : title ?? defaultTitle(tone);
  const eye = eyebrow ?? defaultEyebrow(tone);

  return (
    <section
      data-tk="faq"
      data-tone={tone === "faq" ? undefined : tone}
      className={className}
      aria-labelledby={showTitle ? `${baseId}-title` : undefined}
    >
      {(eye || showTitle) && (
        <header data-tk="faq-head" data-shell="stack" data-gap="2">
          {eye ? (
            <span data-tk="eyebrow">
              <Icon name="sparkles" size="sm" />
              {eye}
            </span>
          ) : null}
          {showTitle && heading ? (
            <h2 id={`${baseId}-title`} style={{ margin: 0 }}>
              {heading}
            </h2>
          ) : null}
        </header>
      )}

      {/* Deliberately unnamed. It groups the items and nothing styles it;
          giving it a data-tk would advertise a hook the CSS does not honour.
          If a pack ever needs the group, name it then and write the rule in
          the same commit. */}
      <div>
        {items.map((item, index) => {
          const itemId = item.id ?? `${baseId}-${index}`;
          const isOpen = open.has(index);
          const panelId = `${itemId}-panel`;
          const triggerId = `${itemId}-trigger`;
          const n = String(index + 1).padStart(2, "0");

          return (
            <div
              key={itemId}
              data-tk="faq-item"
              data-open={isOpen ? "" : undefined}
            >
              <H data-tk="faq-heading">
              <button
                type="button"
                id={triggerId}
                data-tk="faq-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span data-tk="faq-index" aria-hidden="true">
                  {n}
                </span>
                <span data-tk="faq-question">{item.question}</span>
                <span data-tk="faq-mark" aria-hidden="true">
                  <Icon name={isOpen ? "minus" : "plus"} size="sm" />
                </span>
              </button>
              </H>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                data-tk="disclosure"
                data-faq-panel=""
                hidden={!isOpen}
              >
                {typeof item.answer === "string" ? (
                  <p style={{ margin: 0 }}>{item.answer}</p>
                ) : (
                  item.answer
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
