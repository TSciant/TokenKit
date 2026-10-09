import { ArrowCta } from "./ArrowCta";
/* Token Ipsum: seeded placeholder prose. Every call is seeded from the
   component and the slot, so the same words come back on every run.
   See src/lib/token-ipsum.ts. */
import { ipsumHeadline, ipsumTitles, ipsumWhen } from "../../lib/token-ipsum";

/* ---------------------------------------------------------------------------
   24 — the event list, on its own so a client cut can take it without the
   rest of the catalogue patterns. catalog.tsx re-exports it.
--------------------------------------------------------------------------- */

export type EventRow = { date: string; title: string; place: string };

export const EVENT_LIST_HEADING = ipsumHeadline("event-list-heading");

/* ipsumWhen returns one "date · place" line; the row renders the two halves
   in separate slots, so it is split back apart here. */
export const EVENT_ROWS: EventRow[] = ipsumTitles(3, "event-list-titles").map(
  (title, i) => {
    const [date, place] = ipsumWhen(`event-list-when-${i}`).split(" · ");
    return { date, title, place };
  },
);

export type EventListProps = {
  heading?: string;
  events?: EventRow[];
  ctaLabel?: string;
};

/** 24 — event rows: date, title, location, action. */
export function EventList({
  heading = EVENT_LIST_HEADING,
  events = EVENT_ROWS,
  ctaLabel = "Register",
}: EventListProps = {}) {
  return (
    <section data-shell="center" data-width="wide" data-gap="4" style={{ paddingBlock: "var(--tk-space-7)" }}>
      <h2 style={{ margin: 0 }}>{heading}</h2>
      <ul data-shell="stack" data-gap="0">
        {events.map((e) => (
          <li
            key={e.title}
            data-shell="split"
            data-gap="4"
            style={{
              paddingBlock: "var(--tk-space-4)",
              borderBlockEnd: "1px solid var(--tk-line-default)",
            }}
          >
            <div data-shell="stack" data-gap="1">
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--tk-font-mono)",
                  fontSize: "var(--tk-size-xs)",
                  color: "var(--tk-text-tertiary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {e.date} · {e.place}
              </p>
              <h3 style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>
                <a href="#main">{e.title}</a>
              </h3>
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <ArrowCta size="sm" variant="outline">
                {ctaLabel}
                <span data-tk="visually-hidden"> for {e.title}</span>
              </ArrowCta>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
