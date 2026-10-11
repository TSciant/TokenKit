"use client";
/* Client component: it keeps which sections are open in React state. */

import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";

export type AccordionItem = {
  id?: string;
  /** The section's heading: what is inside, in a few words ("2025", "Eligibility"). */
  heading: string;
  /** What the section holds. */
  content: ReactNode;
  /** Open on first paint. */
  defaultOpen?: boolean;
};

export interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  items: AccordionItem[];
  /** The level of each section's heading, to fit the outline of the page it is on. */
  level?: 2 | 3 | 4;
}

/**
 * Accordion — sections of one page that a reader opens one at a time, each
 * behind its heading.
 *
 * Use for: a page of several sections where most readers want one or two (past
 * years of an event, the parts of a long policy). Don't use for: questions and
 * answers (use FAQ, which numbers them), content everyone needs (put it on the
 * page; hiding it makes it harder to find), or switching between views of one
 * thing (tabs).
 *
 * Each heading holds a button that says whether its section is open
 * (aria-expanded) and which section it controls. The headings stay headings,
 * so a screen-reader user can list them and jump. A closed section is not in
 * the page, so find-in-page will not reach it: another reason to keep what
 * matters out of an accordion. Several can be open at once.
 */
export function Accordion({ items, level = 3, ...rest }: AccordionProps) {
  const base = useId();
  const [open, setOpen] = useState<Set<number>>(() => new Set(items.flatMap((it, i) => (it.defaultOpen ? [i] : []))));
  const H = `h${level}` as "h2" | "h3" | "h4";

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div data-tk="accordion" {...rest}>
      {items.map((item, i) => {
        const id = item.id ?? `${base}-${i}`;
        const isOpen = open.has(i);
        return (
          <div key={id} data-tk="accordion-item">
            <H data-tk="accordion-heading">
              <button type="button" data-tk="accordion-trigger" id={`${id}-trigger`} aria-expanded={isOpen} aria-controls={`${id}-panel`} onClick={() => toggle(i)}>
                <span>{item.heading}</span>
                <span data-tk="accordion-mark" aria-hidden="true">
                  <Icon name="chevronDown" size="sm" />
                </span>
              </button>
            </H>
            <div data-tk="accordion-panel" id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} hidden={!isOpen}>
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
