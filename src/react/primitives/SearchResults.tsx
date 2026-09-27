"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useMemo, useState, type ReactNode } from "react";
import { Field } from "./Field";
import { Chip } from "./Chip";
import { Icon, type IconName } from "./Icon";
import { Media } from "./Media";

export type SearchResultType = string;

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  type: SearchResultType;
  href?: string;
  meta?: string;
  /** Optional leading mark (initials, tone plate). */
  mark?: ReactNode;
}

export interface SearchResultsProps {
  items: SearchResultItem[];
  /** Type filter chips. Defaults to unique types from items, plus All. */
  types?: SearchResultType[];
  placeholder?: string;
  empty?: ReactNode;
  /** Initial query */
  defaultQuery?: string;
}

const TYPE_ICONS: Record<string, IconName> = {
  all: "sliders",
  insight: "newspaper",
  service: "briefcase",
  client: "building",
  event: "calendar",
  page: "fileText",
  webinar: "play",
  podcast: "mic",
  video: "image",
};

export function typeIcon(type: string): IconName {
  return TYPE_ICONS[type.trim().toLowerCase()] ?? "tag";
}

function matches(item: SearchResultItem, query: string, type: string | "all") {
  if (type !== "all" && item.type !== type) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [item.title, item.description ?? "", item.meta ?? "", item.type]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark data-tk="search-mark">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/**
 * Search results surface: query field + typed icon chips + filtered list.
 * Filter is plain case-insensitive includes — no fuzzy library.
 */
export function SearchResults({
  items,
  types,
  placeholder = "Filter results",
  empty,
  defaultQuery = "",
}: SearchResultsProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [type, setType] = useState<string | "all">("all");

  const typeOptions = useMemo(() => {
    if (types?.length) return types;
    return Array.from(new Set(items.map((i) => i.type))).sort();
  }, [items, types]);

  const filtered = useMemo(
    () => items.filter((i) => matches(i, query, type)),
    [items, query, type],
  );

  return (
    <div data-tk="search-results">
      <div data-tk="search-results-toolbar">
        <Field
          label="Search"
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
          autoComplete="off"
        />
        <div data-tk="search-results-types" role="group" aria-label="Result type">
          <Chip
            interactive
            pressed={type === "all"}
            leading={<Icon name="sliders" size="sm" />}
            onClick={() => setType("all")}
          >
            All
          </Chip>
          {typeOptions.map((t) => (
            <Chip
              key={t}
              interactive
              pressed={type === t}
              leading={<Icon name={typeIcon(t)} size="sm" />}
              onClick={() => setType(t)}
            >
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <p data-tk="search-results-count" aria-live="polite">
        {filtered.length} result{filtered.length === 1 ? "" : "s"}
        {query.trim() ? ` for “${query.trim()}”` : ""}
        {type !== "all" ? ` · ${type}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div data-tk="search-results-empty">
          {empty ?? (
            <>
              <Icon name="search" size="lg" />
              <p>No matches. Try another term or clear the type filter.</p>
            </>
          )}
        </div>
      ) : (
        <ul data-tk="search-results-list">
          {filtered.map((item) => {
            const icon = typeIcon(item.type);
            const body = (
              <Media
                size="sm"
                figure={
                  item.mark ?? (
                    <span data-tk="search-results-mark" aria-hidden="true">
                      <Icon name={icon} size="md" />
                    </span>
                  )
                }
              >
                <div data-tk="search-results-row-text">
                  <span data-tk="eyebrow-tag">
                    <Icon name={icon} size="sm" />
                    <span data-tk="search-results-type">{item.type}</span>
                  </span>
                  <strong data-tk="search-results-title">
                    {highlight(item.title, query)}
                  </strong>
                  {item.description ? (
                    <p data-tk="search-results-desc">
                      {highlight(item.description, query)}
                    </p>
                  ) : null}
                  {item.meta ? (
                    <span data-tk="search-results-meta">{item.meta}</span>
                  ) : null}
                </div>
              </Media>
            );

            return (
              <li key={item.id} data-tk="search-results-item">
                {item.href ? (
                  <a data-tk="search-results-link" href={item.href}>
                    {body}
                    <span data-tk="search-results-chevron"><Icon name="chevronRight" size="sm" /></span>
                  </a>
                ) : (
                  <div data-tk="search-results-link">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
