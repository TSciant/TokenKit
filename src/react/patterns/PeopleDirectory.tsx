"use client";
/* Client component: it uses React state, effects or DOM APIs. See the note at the top of chrome.tsx. */

import { ipsumHeadline, ipsumPeople } from "../../lib/token-ipsum";
import type { Cols } from "./types";
import { useId } from "react";
import { ArrowCta } from "./ArrowCta";
import { Plate } from "../primitives/Plate";

/* PeopleDirectory, in a file of its own so a client cut can take it without the rest of catalog.tsx, which re-exports it. */

export type Person = { name: string; role: string };

export const PEOPLE_DIRECTORY_HEADING = ipsumHeadline(
  "people-directory-heading",
);

/* The names are invented on purpose — Alex Example, or Avery Cascade in the
   kit's own voice — so a placeholder card can never be mistaken for a real
   person. */
export const STAFF: Person[] = ipsumPeople(4, "people-directory").map(
  ({ name, role }) => ({ name, role }),
);

/* Both selects render one <option> per entry keyed on its own text, so each
   list has to stay free of duplicates. */
export const PEOPLE_PLACES = ["Remote", "Studio", "Workshop"];

export const PEOPLE_TEAMS = [
  "Cascade & Co.",
  "Gutter Partners",
  "Baseline Group",
];

export type PeopleDirectoryProps = {
  heading?: string;
  people?: Person[];
  columns?: Cols;
  locations?: string[];
  companies?: string[];
  /** Selected on first render; "" leaves the any-value option showing. */
  initialLocation?: string;
  initialCompany?: string;
  ctaLabel?: string;
  /** Aria label for the filter form. */
  filterLabel?: string;
};

/** 20 — filter bar over a four-up person grid. */
export function PeopleDirectory({
  heading = PEOPLE_DIRECTORY_HEADING,
  people = STAFF,
  columns = 4,
  locations = PEOPLE_PLACES,
  companies = PEOPLE_TEAMS,
  initialLocation = "",
  initialCompany = "",
  ctaLabel = "View all people",
  filterLabel = "Filter the directory",
}: PeopleDirectoryProps = {}) {
  const nameId = useId();
  const locId = useId();
  const coId = useId();

  return (
    <section>
      <div
        style={{
          background: "var(--tk-surface-inverse)",
          padding: "var(--tk-space-3) var(--tk-gutter)",
        }}
      >
        <div data-on="inverse" style={{ background: "transparent", padding: 0 }}>
          <h2 style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>{heading}</h2>
        </div>
      </div>

      <form
        data-on="inverse"
        data-shell="inline"
        data-gap="3"
        onSubmit={(e) => e.preventDefault()}
        style={{ padding: "var(--tk-space-5) var(--tk-gutter)", alignItems: "flex-end" }}
        aria-label={filterLabel}
      >
        <div data-tk="field" style={{ flex: "1 1 12rem" }}>
          <label data-tk="field-label" htmlFor={nameId}>
            Name
          </label>
          <input data-tk="input" id={nameId} type="search" />
        </div>
        <div data-tk="field" style={{ flex: "1 1 10rem" }}>
          <label data-tk="field-label" htmlFor={locId}>
            Location
          </label>
          <select data-tk="select" id={locId} defaultValue={initialLocation}>
            <option value="">Any location</option>
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div data-tk="field" style={{ flex: "1 1 10rem" }}>
          <label data-tk="field-label" htmlFor={coId}>
            Company
          </label>
          <select data-tk="select" id={coId} defaultValue={initialCompany}>
            <option value="">Any company</option>
            {companies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <ArrowCta size="md" variant="outline">
          {ctaLabel}
        </ArrowCta>
      </form>

      <div data-shell="center" data-width="wide" data-gap="5" style={{ paddingBlock: "var(--tk-space-6)" }}>
        <ul data-shell="grid" data-cols={String(columns)} data-gap="4" style={{ ["--_min" as string]: "12rem" }}>
          {people.map((p, i) => (
            <li key={p.name}>
              <article data-tk="card">
                <Plate fx={true} stock ratio="1 / 1" crop="portrait" seed={(i % 6) + 1} />
                <h3 data-tk="card-title" style={{ fontSize: "var(--tk-size-base)" }}>
                  <a href="#main">{p.name}</a>
                </h3>
                <p
                  data-tk="card-body"
                  style={{ fontStyle: "italic", fontSize: "var(--tk-size-sm)" }}
                >
                  {p.role}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
