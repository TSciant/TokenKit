"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useState } from "react";
import { Arrow } from "../primitives/Arrow";
import { Plate } from "../primitives/Plate";
import { ArrowCta } from "./ArrowCta";
import type { Cols } from "./types";
import { Icon, type IconName } from "../primitives/Icon";
import { Chip } from "../primitives/Chip";
/* Token Ipsum: seeded placeholder prose that is about the kit's own argument,
   so a reviewer who stops to read the filler learns something instead of
   skipping it. Every call is seeded from the component and the slot, so the
   same words come back on every run and two screenshots stay comparable.
   See src/lib/token-ipsum.ts. */
import { ipsumHeadline, ipsumLabels, ipsumList, ipsumTitles } from "../../lib/token-ipsum";
/* Patterns now in files of their own, so a client cut can take one alone; re-exported here so no import moves. */
export { PEOPLE_DIRECTORY_HEADING, STAFF, PEOPLE_PLACES, PEOPLE_TEAMS, PeopleDirectory } from "./PeopleDirectory";
export type { Person, PeopleDirectoryProps } from "./PeopleDirectory";

export { TILE_GRID_HEADING, TILES, TileGrid } from "./TileGrid";
export type { TileGridProps } from "./TileGrid";

/* ---------------------------------------------------------------------------
   15-20, 24 — the catalogue, directory and listing patterns.

   Content and shape come in as props and default to the exported constants
   below, which hold seeded Token Ipsum placeholder content, on the
   conventions marketing.tsx sets out.
--------------------------------------------------------------------------- */

export type HubCard = { title: string; body: string };

export const HUB_CARDS_HEADING = ipsumHeadline("hub-cards-heading");

/* Titles and bodies are drawn one list at a time rather than one card at a
   time, because a list is picked without repeats: four cards, four different
   sentences, and a title that is unique enough to be the React key. */
const HUB_BODIES = ipsumList(4, "hub-cards-bodies");

export const HUB_CARDS: HubCard[] = ipsumTitles(4, "hub-cards-titles").map(
  (title, i) => ({ title, body: HUB_BODIES[i] }),
);

export type HubCardsProps = {
  heading?: string;
  items?: HubCard[];
  columns?: Cols;
  /** Link text on each card. The card title follows it, visually hidden. */
  readMoreLabel?: string;
};

/** 16 — the alternate taxonomy: title, summary, read-more. */
export function HubCards({
  heading = HUB_CARDS_HEADING,
  items = HUB_CARDS,
  columns = 2,
  readMoreLabel = "Read more",
}: HubCardsProps = {}) {
  return (
    <section data-shell="center" data-width="wide" data-gap="5" style={{ paddingBlock: "var(--tk-space-7)" }}>
      <h2 style={{ margin: 0 }}>{heading}</h2>
      <ul data-shell="grid" data-cols={String(columns)} data-gap="5">
        {items.map((it) => (
          <li key={it.title}>
            <article data-tk="card">
              <h3 data-tk="card-title">{it.title}</h3>
              <p data-tk="card-body">{it.body}</p>
              <div data-tk="card-footer">
                <a href="#main" data-shell="inline" data-gap="2">
                  {readMoreLabel} <Arrow />
                  <span data-tk="visually-hidden">about {it.title}</span>
                </a>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export type CtaBlock = { title: string; body: string; cta: string };

const CTA_BODIES = ipsumList(2, "cta-blocks-bodies");
const CTA_LABELS = ipsumLabels(2, "cta-blocks-ctas");

export const CTA_BLOCKS: CtaBlock[] = ipsumTitles(2, "cta-blocks-titles").map(
  (title, i) => ({ title, body: CTA_BODIES[i], cta: CTA_LABELS[i] }),
);

export type CtaBlocksProps = {
  blocks?: CtaBlock[];
  columns?: Cols;
};

/** 17 — paired mid-funnel banners. */
export function CtaBlocks({
  blocks = CTA_BLOCKS,
  columns = 2,
}: CtaBlocksProps = {}) {
  return (
    <section
      data-shell="grid"
      data-cols={String(columns)}
      data-gap="4"
      style={{ paddingBlock: "var(--tk-space-7)", paddingInline: "var(--tk-gutter)" }}
    >
      {blocks.map((b, i) => (
        <div
          key={b.title}
          data-cta-block=""
          data-shell="stack"
          data-gap="3"
          data-on={i === 0 ? "inverse" : undefined}
          style={{
            padding: "var(--tk-space-6)",
            /* Three-layer chain: this plate is a surface root.
               Outer = pad + desired leaf (lg), so the button still has an arc.
               lg - space-6 used to publish 0 — layer three went straight-edge. */
            ["--_radius-gap" as string]: "var(--tk-space-6)",
            ["--_radius" as string]:
              "calc(var(--_radius-gap) + var(--tk-radius-lg))",
            borderRadius: "var(--_radius)",
            ["--tk-radius-nested" as string]:
              "max(0px, calc(var(--_radius) - var(--_radius-gap)))",
            background: i === 0 ? undefined : "var(--tk-surface-sunken)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "var(--tk-size-xl)" }}>{b.title}</h2>
          <p data-tk="card-body">{b.body}</p>
          <div>
            <ArrowCta size="md" variant={i === 0 ? "outline" : "solid"}>
              {b.cta}
            </ArrowCta>
          </div>
        </div>
      ))}
    </section>
  );
}

/* "All" is the unfiltered state rather than a content type, so it stays a
   real word; the six after it are placeholder labels. Keep FILTER_ICONS in
   step — its keys are these labels, and a missing one falls back to the tag
   icon rather than breaking. */
export const FILTER_TYPES = ["All", ...ipsumLabels(6, "filter-bar-types")];

export const FILTER_ICONS: Record<string, IconName> = {
  All: "sliders",
  Surfaces: "layers",
  Tokens: "tag",
  Typography: "fileText",
  Density: "layoutGrid",
  Scales: "hash",
  Motion: "play",
};

export type FilterBarProps = {
  types?: string[];
  /** Leading icon per type. A type with no entry gets the tag icon. */
  icons?: Record<string, IconName>;
  /** Which chip is pressed on first render. Falls back to the first type. */
  initialType?: string;
  /** Aria label for the filter group. */
  label?: string;
};

/**
 * 18 — content-type filters.
 *
 * A toggle-button group rather than styled links, so the active state is
 * programmatic (aria-pressed) instead of a colour a screen reader cannot see.
 */
export function FilterBar({
  types = FILTER_TYPES,
  icons = FILTER_ICONS,
  initialType = "All",
  label = "Filter by type",
}: FilterBarProps = {}) {
  const list = types.length ? types : FILTER_TYPES;
  const [active, setActive] = useState(() =>
    list.includes(initialType) ? initialType : list[0],
  );
  return (
    <div
      data-tk="search-results-types"
      data-shell="inline"
      data-gap="2"
      role="group"
      aria-label={label}
      style={{ paddingBlock: "var(--tk-space-5)", paddingInline: "var(--tk-space-5)", flexWrap: "wrap" }}
    >
      {list.map((t) => (
        <Chip
          key={t}
          interactive
          pressed={active === t}
          leading={<Icon name={icons[t] ?? "tag"} size="sm" />}
          onClick={() => setActive(t)}
        >
          {t}
        </Chip>
      ))}
    </div>
  );
}

export type MediaItem = { kind: string; title: string; meta: string };

export const MEDIA_CARDS_HEADING = ipsumHeadline("media-cards-heading");

/* The kinds stay as they are: they are the badge vocabulary the icons are
   keyed on, not content. Only the titles are placeholder prose. */
const MEDIA_TITLES = ipsumTitles(3, "media-cards-titles");

export const MEDIA_ITEMS: MediaItem[] = [
  { kind: "Webinar", title: MEDIA_TITLES[0], meta: "58 min" },
  { kind: "Podcast", title: MEDIA_TITLES[1], meta: "32 min" },
  { kind: "Video", title: MEDIA_TITLES[2], meta: "6 min" },
];

/** Badge icon per kind. A kind with no entry gets the image icon. */
export const MEDIA_ICONS: Record<string, IconName> = {
  Webinar: "play",
  Podcast: "mic",
  Video: "image",
};

export type MediaCardsProps = {
  heading?: string;
  items?: MediaItem[];
  icons?: Record<string, IconName>;
  columns?: Cols;
  /** Aspect ratio of each card's stand-in photograph. */
  ratio?: string;
};

/** 19 — media promos with a type badge and a duration. */
export function MediaCards({
  heading = MEDIA_CARDS_HEADING,
  items = MEDIA_ITEMS,
  icons = MEDIA_ICONS,
  columns = 3,
  ratio = "16 / 9",
}: MediaCardsProps = {}) {
  return (
    <section data-shell="center" data-width="wide" data-gap="5" style={{ paddingBlock: "var(--tk-space-7)" }}>
      <h2 style={{ margin: 0 }}>{heading}</h2>
      <ul data-shell="grid" data-cols={String(columns)} data-gap="5">
        {items.map((it, i) => (
          <li key={it.title}>
            <article data-tk="card">
              <Plate fx={true} stock ratio={ratio} seed={(i % 6) + 1} />
              <div data-shell="inline" data-gap="2">
                <Chip leading={<Icon name={icons[it.kind] ?? "image"} size="sm" />}>{it.kind}</Chip>
                <span style={{ fontSize: "var(--tk-size-sm)", color: "var(--tk-text-tertiary)" }}>
                  {it.meta}
                </span>
              </div>
              <h3 data-tk="card-title" style={{ fontSize: "var(--tk-size-base)" }}>
                <a href="#main">{it.title}</a>
              </h3>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* 24 — the event list is its own file, so a client cut can take it alone;
   re-exported here so nothing that imported it from here moves. */
export { EventList, EVENT_LIST_HEADING, EVENT_ROWS } from "./EventList";
export type { EventRow, EventListProps } from "./EventList";
