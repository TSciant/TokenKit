import { ipsumPairs, ipsumList, ipsumHeadline, ipsumDeck, ipsumLabel } from "../../lib/token-ipsum";
import { Arrow } from "../primitives/Arrow";
import { Map } from "../primitives/MapLazy";

/* SegmentList, in a file of its own so a client cut can take it without the rest of marketing.tsx, which re-exports it. */

export type Segment = { label: string; body: string };

export const SEGMENTS: Segment[] = ipsumPairs(5, "segment-list-audiences");

export const REACH_FACTS = ipsumList(4, "segment-list-reach");

export type SegmentListProps = {
  heading?: string;
  deck?: string;
  audiences?: Segment[];
  reach?: string[];
  reachLabel?: string;
  /** Aria label for the map region. */
  mapLabel?: string;
  /** false drops the map and gives the copy the full width. */
  showMap?: boolean;
  /** A MapLibre style URL or JSON, passed to the map. Leave it out for the pack's basemap; set it for an offline or house basemap. */
  mapStyle?: string;
};

export const SEGMENT_HEADING = ipsumHeadline("segment-list-heading");

export const SEGMENT_DECK = ipsumDeck("segment-list-deck");

export const SEGMENT_REACH_LABEL = ipsumLabel("segment-list-reach-label");

/* Plain words on purpose. This one is the map region's accessible name, and a
   name is the one string a screen-reader user cannot skim past — filler there
   would be the only thing they are told about the region. */
export const SEGMENT_MAP_LABEL = "Coverage map";

/** 08 — segment routing, as a real list. */
export function SegmentList({
  heading = SEGMENT_HEADING,
  deck = SEGMENT_DECK,
  audiences = SEGMENTS,
  reach = REACH_FACTS,
  reachLabel = SEGMENT_REACH_LABEL,
  mapLabel = SEGMENT_MAP_LABEL,
  showMap = true,
  mapStyle,
}: SegmentListProps = {}) {
  return (
    <section
      data-tk="section"
      data-section="audience"
      data-shell="center"
      data-width="wide"
      data-gap="6"
    >
      <div data-shell="split" data-gap="7" data-align="start">
        <div data-shell="stack" data-gap="5" style={{ minInlineSize: 0 }}>
          <header data-shell="stack" data-gap="3">
            <h2 style={{ margin: 0, maxInlineSize: "22ch" }}>{heading}</h2>
            <p
              data-tk="card-body"
              style={{ margin: 0, fontSize: "var(--tk-size-md)", maxInlineSize: "var(--tk-measure)" }}
            >
              {deck}
            </p>
          </header>

          <ul data-shell="stack" data-gap="4">
            {audiences.map((a) => (
              <li key={a.label} data-shell="row" data-gap="3" style={{ flexWrap: "nowrap" }}>
                <Arrow />
                <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
                  <strong>{a.label}:</strong>{" "}
                  <span style={{ color: "var(--tk-text-secondary)" }}>{a.body}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        {showMap ? (
        <div data-shell="stack" data-gap="4" style={{ minInlineSize: 0 }}>
          <Map
            scheme="auto"
            label={mapLabel}
            center={[-96.8, 39.5]}
            zoom={3.2}
            navigation
            scale={false}
            marker={false}
            ratio="1 / 1"
            mapStyle={mapStyle}
          />
          <ul
            data-shell="stack"
            data-gap="2"
            style={{ margin: 0, padding: 0, listStyle: "none" }}
          >
            <li>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--tk-font-mono)",
                  fontSize: "var(--tk-size-xs)",
                  letterSpacing: "var(--tk-tracking-wide)",
                  textTransform: "uppercase",
                  color: "var(--tk-text-tertiary)",
                }}
              >
                {reachLabel}
              </p>
            </li>
            {reach.map((item) => (
              <li
                key={item}
                data-shell="row"
                data-gap="2"
                style={{ alignItems: "baseline", flexWrap: "nowrap" }}
              >
                <span aria-hidden="true" style={{ color: "var(--tk-text-tertiary)" }}>
                  ·
                </span>
                <span style={{ color: "var(--tk-text-secondary)", minInlineSize: 0 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        ) : null}
      </div>
    </section>
  );
}
