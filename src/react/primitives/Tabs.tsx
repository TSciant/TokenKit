"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";

export type TabsItem = {
  /** Stable key for the tab; also what `selected`, `defaultSelected` and `onSelect` speak in. */
  id: string;
  label: string;
  /** What the panel holds. Only the selected panel is shown; the others stay in the markup, hidden. */
  content: ReactNode;
};

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onSelect"> {
  /** What the set of tabs is about ("Event details"). Names the tab list for assistive technology. */
  label: string;
  items: TabsItem[];
  /** The selected tab, when the caller keeps it. Leave unset and the component keeps its own. */
  selected?: string;
  /** The tab selected at first, when the component keeps its own. Defaults to the first. */
  defaultSelected?: string;
  /** Called with the id of the tab chosen, by click or by arrow key. */
  onSelect?: (id: string) => void;
}

/**
 * Tabs — views of one thing, one at a time, chosen from a row of labels.
 *
 * Use for: parts of one subject that a reader looks at one by one and that are
 * all worth a look (an event's agenda, speakers and recordings). Don't use for:
 * going to another page (use section nav, which is links), the steps of a form
 * (a reader must see them in order), or content a reader needs to compare side
 * by side (put it on the page). If people need all of it, it is not tabs.
 *
 * The ARIA tabs pattern, with automatic activation: one tab is in the tab order
 * (the selected one); the arrow keys move along the row and select as they go,
 * Home and End go to the ends, and Tab moves on into the panel. The panel is
 * focusable so a keyboard reader lands in it even when it starts with text. The
 * row looks like section nav (a line of labels under a hairline, the chosen one
 * marked on the line) because it sits in the same places; the difference is
 * that these are buttons and change the view, not the page.
 */
export function Tabs({ label, items, selected, defaultSelected, onSelect, ...rest }: TabsProps) {
  const base = useId();
  const [own, setOwn] = useState(defaultSelected ?? items[0]?.id);
  const current = items.some((t) => t.id === (selected ?? own)) ? (selected ?? own) : items[0]?.id;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = (id: string) => {
    if (selected === undefined) setOwn(id);
    onSelect?.(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = items.length - 1;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    const to = step !== undefined ? (i + step + items.length) % items.length : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to < 0) return;
    e.preventDefault();
    choose(items[to].id);
    refs.current[to]?.focus();
  };

  return (
    <div data-tk="tabs" {...rest}>
      <div data-tk="tabs-list" role="tablist" aria-label={label}>
        {items.map((t, i) => {
          const on = t.id === current;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-tk="tabs-tab"
              type="button"
              role="tab"
              id={`${base}-tab-${i}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${i}`}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {items.map((t, i) => (
        <div
          key={t.id}
          data-tk="tabs-panel"
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-tab-${i}`}
          tabIndex={0}
          hidden={t.id !== current}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
