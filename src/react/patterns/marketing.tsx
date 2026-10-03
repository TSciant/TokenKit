"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, useState } from "react";
import { Arrow } from "../primitives/Arrow";
import { Plate } from "../primitives/Plate";
import { Icon } from "../primitives/Icon";
import type { Cols } from "./types";
/* MapLazy: SegmentList puts a map on the homepage, and a static import of
   maplibre-gl there costs every route ~800 KB. See MapLazy.tsx. */
import { Map } from "../primitives/MapLazy";
/* Token Ipsum: seeded placeholder prose that is about the kit's own argument,
   so a reviewer who stops to read the filler learns something instead of
   skipping it. Every call is seeded from the component and the slot, so the
   same words come back on every run and two screenshots stay comparable.
   See src/lib/token-ipsum.ts. */
import {
  ipsumBody,
  ipsumDeck,
  ipsumEyebrow,
  ipsumHeadline,
  ipsumLabel,
  ipsumLabels,
  ipsumList,
  ipsumPairs,
  ipsumStats,
  ipsumTitles,
  ipsumWhen,
} from "../../lib/token-ipsum";

/* ---------------------------------------------------------------------------
   05-11 — the homepage modules.

   Every component in this file takes its content and its shape as props, and
   defaults them to seeded Token Ipsum placeholder content. That is the
   difference between a component library and a set of screenshots: a reviewer
   opens the Controls panel, retypes the heading, drops the grid to two columns
   and sees the answer, instead of writing a revision request and waiting a day
   for it.

   Two conventions hold throughout:

     • Defaults are exported constants, not inline literals. A caller can
       spread and amend rather than retype, and the Storybook args and the
       component cannot drift apart, because they are the same object.

     • Props are content and shape, never styling. There is no `color` and no
       `padding` prop anywhere here; those come from the token contract and
       the context the component is placed in. A prop that lets a caller paint
       outside the pack is how a design system stops being one.
--------------------------------------------------------------------------- */


export const ARROW_CTA_LABEL = ipsumLabel("arrow-cta-label");

/** 06 — the repeated conversion pattern. Uppercase label, trailing arrow. */
export function ArrowCta({
  children = ARROW_CTA_LABEL,
  variant,
  size = "lg",
}: {
  children?: React.ReactNode;
  variant?: "solid" | "outline" | "quiet";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      data-tk="button"
      data-arrow-cta=""
      data-variant={variant}
      data-size={size}
      type="button"
      style={{
        textTransform: "uppercase",
        letterSpacing: "var(--tk-tracking-wide)",
        fontWeight: "var(--tk-weight-semibold)",
      }}
    >
      {children}
      <Arrow />
    </button>
  );
}

export type HeroSlide = {
  eyebrow: string;
  title: string;
  lede: string;
  cta: string;
  /** 1-6. Picks the stand-in photograph; deterministic so screenshots match. */
  seed: number;
  /**
   * What the photograph is OF — "storefront", "dunes at dawn".
   *
   * A seed picks a composition and a category picks a subject, and only the
   * second is something a brand can ask for. With no stock manifest
   * registered, which is the kit's shipped state, the plate draws itself and
   * names the subject on its label: a wireframe that says where a storefront
   * goes rather than a grey box in the same place.
   */
  category?: string;
};

/* Drawn in one call each so the three are distinct: the eyebrow is the React
   key for both the plate stack and the dots, and two slides sharing one would
   collapse into a single child. */
const HERO_EYEBROWS = ipsumLabels(3, "hero-carousel-eyebrows");
const HERO_CTAS = ipsumLabels(3, "hero-carousel-ctas");

export const HERO_SLIDES: HeroSlide[] = [
  {
    eyebrow: HERO_EYEBROWS[0],
    title: ipsumHeadline("hero-carousel-slide-1-headline"),
    lede: ipsumDeck("hero-carousel-slide-1-deck"),
    cta: HERO_CTAS[0],
    seed: 3,
  },
  {
    eyebrow: HERO_EYEBROWS[1],
    title: ipsumHeadline("hero-carousel-slide-2-headline"),
    lede: ipsumDeck("hero-carousel-slide-2-deck"),
    cta: HERO_CTAS[1],
    seed: 1,
  },
  {
    eyebrow: HERO_EYEBROWS[2],
    title: ipsumHeadline("hero-carousel-slide-3-headline"),
    lede: ipsumDeck("hero-carousel-slide-3-deck"),
    cta: HERO_CTAS[2],
    seed: 5,
  },
];

export type HeroCarouselProps = {
  slides?: HeroSlide[];
  /** Which slide is showing on first render. Clamped to the deck. */
  initialSlide?: number;
  /** Aria label for the carousel region. */
  label?: string;
};

/**
 * 05 — hero slider.
 *
 * Does not auto-advance. 2.2.2 requires a pause control for anything that
 * moves by itself, and a wireframe has nothing to prove by moving. The dots
 * are real buttons with names rather than decorative spans.
 */
export function HeroCarousel({
  slides = HERO_SLIDES,
  initialSlide = 0,
  label = "Featured",
}: HeroCarouselProps = {}) {
  const deck = slides.length ? slides : HERO_SLIDES;
  const [i, setI] = useState(() =>
    Math.min(Math.max(initialSlide, 0), deck.length - 1),
  );
  const slide = deck[i] ?? deck[0];
  const regionId = useId();

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      {/* The hero is the one place on the site where text sits over a
          full-bleed photograph, so it is where a scrim matters most.

          Default AA (0.54) — not data-strength="large". The headline could
          clear 3:1 on a lighter wash, but the CTA and pager are normal text
          and need 4.5:1. Frost stays off the wash: it is middle-ground craft
          on the outline controls (see hero.css), layered on top of the dark
          scrim so contrast is additive rather than a soft grey mush.

          Everything is in flow inside the scrim. The first version kept the
          slide controls as absolutely positioned siblings, which put them on
          top of the centred copy — they landed across the CTA — and left them
          outside the scrim context, so they were page-dark on a dark wash.
          One stacking context, one flow, no overlap possible. */}
      <div
        data-tk="scrim"
        data-tk-hero=""
        data-from="bottom"
        data-cover="70"
        style={{
          borderRadius: 0,
          minBlockSize: "clamp(26rem, 68vh, 38rem)",
        }}
      >
        {deck.map((s, n) => (
          <div
            key={s.eyebrow}
            data-tk="hero-plate"
            data-active={n === i ? "" : undefined}
            aria-hidden={n === i ? undefined : true}
          >
            <Plate
              fx={false}
              stock
              ratio="21 / 9"
              seed={s.seed}
              category={s.category}
              bleed
              placement={false}
              /* Slide one is the top of the homepage and therefore its Largest
                 Contentful Paint; the others are behind it and can wait. */
              priority={n === 0}
              style={{ blockSize: "100%" }}
            />
          </div>
        ))}

        <div
          data-tk="scrim-content"
          data-shell="stack"
          data-gap="6"
          style={{
            justifyContent: "center",
            paddingBlock: "var(--tk-space-8)",
            paddingInline: "var(--tk-space-6)",
            maxInlineSize: "min(100%, 40rem)",
            marginBlockEnd: "var(--tk-space-6)",
          }}
        >
          <div
            id={regionId}
            key={i}
            data-tk="hero-copy"
            aria-live="polite"
            data-shell="stack"
            data-gap="3"
          >
            <span data-tk="eyebrow">
              <Icon name="sparkles" size="sm" />
              {slide.eyebrow}
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--tk-size-3xl)",
                lineHeight: "var(--tk-leading-tight)",
                maxInlineSize: "22ch",
                textWrap: "balance",
              }}
            >
              {slide.title}
            </h1>
            <p
              data-tk="card-body"
              style={{
                margin: 0,
                maxInlineSize: "var(--tk-measure-narrow)",
                color: "var(--tk-text-primary)",
              }}
            >
              {slide.lede}
            </p>
            <div data-tk="hero-actions" data-shell="stack" data-gap="4">
              <div data-tk="hero-cta">
                <ArrowCta variant="solid">{slide.cta}</ArrowCta>
              </div>

              <div
                data-tk="hero-pager"
                role="group"
                aria-label="Slides"
              >
                <button
                  type="button"
                  data-tk="hero-pager-btn"
                  aria-controls={regionId}
                  onClick={() => setI((n) => (n - 1 + deck.length) % deck.length)}
                >
                  <Icon name="arrowLeft" size="sm" />
                  <span data-tk="visually-hidden">Previous slide</span>
                </button>

                <div data-tk="hero-dots" aria-label="Choose slide">
                  {deck.map((s, n) => (
                    <button
                      key={s.eyebrow}
                      type="button"
                      data-tk="hero-dot"
                      aria-current={n === i ? "true" : undefined}
                      aria-controls={regionId}
                      onClick={() => setI(n)}
                    >
                      <span data-tk="visually-hidden">
                        Slide {n + 1}: {s.eyebrow}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  data-tk="hero-pager-btn"
                  aria-controls={regionId}
                  onClick={() => setI((n) => (n + 1) % deck.length)}
                >
                  <Icon name="arrowRight" size="sm" />
                  <span data-tk="visually-hidden">Next slide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type Stat = { value: string; label: string };

export const PROOF_STATS: Stat[] = ipsumStats(3, "proof-strip-stats");

export type ProofStripProps = {
  heading?: string;
  deck?: string;
  stats?: Stat[];
  columns?: Cols;
};

export const PROOF_HEADING = ipsumHeadline("proof-strip-heading");
export const PROOF_DECK = ipsumDeck("proof-strip-deck");

/**
 * 07 — the proof strip.
 *
 * Three claims run together as one pipe-delimited line read as a single
 * run-on sentence to a screen reader. Three labelled figures say the same
 * thing and can be navigated.
 */
export function ProofStrip({
  heading = PROOF_HEADING,
  deck = PROOF_DECK,
  stats = PROOF_STATS,
  columns = 3,
}: ProofStripProps = {}) {
  return (
    <section
      data-tk="section"
      data-section="proof"
      data-shell="center"
      data-width="wide"
      data-gap="6"
    >
      <header
        data-shell="stack"
        data-gap="3"
        style={{
          maxInlineSize: "var(--tk-measure)",
          textAlign: "center",
          marginInline: "auto",
        }}
      >
        <h2 style={{ margin: 0 }}>{heading}</h2>
        <p data-tk="card-body" style={{ margin: 0 }}>
          {deck}
        </p>
      </header>

      <dl
        data-tk="stagger"
        data-shell="grid"
        data-cols={String(columns)}
        data-gap="6"
        style={{ margin: 0, textAlign: "center" }}
      >
        {stats.map((s) => (
          <div key={s.label} data-shell="stack" data-gap="2">
            <dt
              style={{
                order: 2,
                fontSize: "var(--tk-size-sm)",
                color: "var(--tk-text-secondary)",
              }}
            >
              {s.label}
            </dt>
            <dd
              style={{
                order: 1,
                margin: 0,
                fontSize: "var(--tk-size-3xl)",
                fontWeight: "var(--tk-weight-bold)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: "var(--tk-leading-tight)",
              }}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}


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

          <ul data-tk="stagger" data-shell="stack" data-gap="4">
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

export const FEATURES = ipsumTitles(3, "feature-grid-items");

export type FeatureGridProps = {
  heading?: string;
  deck?: string;
  items?: string[];
  /** Subject per card, positionally. Short lists cycle, like `kinds` does. */
  categories?: string[];
  columns?: Cols;
  /** Aspect ratio of each card's stand-in photograph. */
  ratio?: string;
};

export const FEATURE_HEADING = ipsumHeadline("feature-grid-section-heading");
export const FEATURE_DECK = ipsumDeck("feature-grid-deck-text");

/**
 * 09 — the capability grid.
 *
 * A plain list of equal claims, each with a stand-in plate. The column count
 * is a prop rather than a breakpoint: the grid is placed in a container and
 * asked how many it should be, which is a question the page can answer and
 * the viewport cannot.
 */
export function FeatureGrid({
  /* No default. `[]` would be one, and tools/gen-component-stories.mjs
     requires a default to be a literal or an exported constant so it can put
     it in the story's args — an inline empty array is neither, and an
     exported EMPTY_CATEGORIES would be a name for nothing. Undefined is the
     honest absence and the call site reads it that way. */
  categories,
  heading = FEATURE_HEADING,
  deck = FEATURE_DECK,
  items = FEATURES,
  columns = 3,
  ratio = "4 / 3",
}: FeatureGridProps = {}) {
  return (
    <section
      data-tk="section"
      data-section="feature"
      data-shell="center"
      data-width="wide"
      data-gap="6"
    >
      <header data-shell="stack" data-gap="2" style={{ maxInlineSize: "var(--tk-measure)" }}>
        <h2 style={{ margin: 0 }}>{heading}</h2>
        <p data-tk="card-body" style={{ margin: 0 }}>
          {deck}
        </p>
      </header>
      <div data-tk="stagger" data-shell="grid" data-cols={String(columns)} data-gap="5">
        {items.map((t, idx) => (
          <a
            key={t}
            href="#main"
            data-tk="card"
            data-interactive
            style={{ textDecoration: "none" }}
          >
            <Plate
              fx={true}
              stock
              ratio={ratio}
              bleed
              seed={(idx % 6) + 1}
              category={categories?.length ? categories[idx % categories.length] : undefined}
              placement={false}
            />
            <h3 data-tk="card-title">{t}</h3>
          </a>
        ))}
      </div>
    </section>
  );
}

export const ARTICLE_KINDS = ipsumLabels(4, "article-feed-kinds");

export const ARTICLES = ipsumTitles(4, "article-feed-cards");

export type ArticleFeedProps = {
  heading?: string;
  deck?: string;
  cards?: string[];
  /** Eyebrow labels, cycled across the cards. */
  kinds?: string[];
  /** Subject per card, positionally. Cycled, like `kinds`. */
  categories?: string[];
  columns?: Cols;
};

export const ARTICLE_FEED_HEADING = ipsumHeadline("article-feed-heading-line");
export const ARTICLE_FEED_DECK = ipsumDeck("article-feed-deck-text");

/**
 * 10 — the insights feed.
 *
 * The title sits over the photograph, which is only defensible because the
 * scrim bounds the worst case: text on bare photography cannot be
 * contrast-checked and 1.4.3 still applies to it.
 */
export function ArticleFeed({
  categories,
  heading = ARTICLE_FEED_HEADING,
  deck = ARTICLE_FEED_DECK,
  cards = ARTICLES,
  kinds = ARTICLE_KINDS,
  columns = 4,
}: ArticleFeedProps = {}) {
  return (
    <section
      data-tk="section"
      data-section="feed"
      data-shell="center"
      data-width="wide"
      data-gap="6"
    >
      <header
        data-shell="stack"
        data-gap="2"
        style={{ textAlign: "center", marginInline: "auto", maxInlineSize: "var(--tk-measure)" }}
      >
        <h2 style={{ margin: 0 }}>{heading}</h2>
        <p data-tk="card-body" style={{ margin: 0 }}>
          {deck}
        </p>
      </header>
      <div
        data-tk="stagger"
        data-shell="grid"
        data-cols={String(columns)}
        data-gap="5"
        style={{ ["--_min" as string]: "14rem" }}
      >
        {cards.map((c, i) => (
          <a
            key={c}
            href="#main"
            data-tk="card"
            data-variant="bare"
            data-interactive
            style={{ textDecoration: "none" }}
          >
            {/* The title sits over the photograph. An earlier pass moved it
                below the plate, because text on an unknown image cannot be
                contrast-checked. It can be now: the scrim bounds the worst
                case, so the composition comes back and the ratio is still
                provable. See src/css/components/scrim.css. */}
            <div
              data-tk="scrim"
              /* The cap lives on the scrim because the scrim is what owns the
                 ratio here. Without it a four-up row of 3:4 tiles becomes a
                 four-deep stack of 500px tiles the moment the grid folds —
                 measured at +1785px in one 10px step of viewport width. */
              style={{
                borderRadius: "var(--tk-radius-nested)",
                aspectRatio: "3 / 4",
                maxBlockSize: "var(--tk-plate-max)",
              }}
            >
              <Plate
                fx={true}
                stock
                ratio="3 / 4"
                crop="portrait"
                seed={(i % 6) + 1}
                category={categories?.length ? categories[i % categories.length] : undefined}
                bleed
                placement={false}
                style={{ blockSize: "100%", maxBlockSize: "none" }}
              />
              <div data-tk="scrim-content">
                {/* An eyebrow, not a chip. A chip paints its own ground from
                    pack tokens chosen against the page surface, and on a
                    scrim that ground is neither guaranteed nor needed —
                    the scrim already owns both sides of the pair. */}
                <span data-tk="eyebrow">
                  {kinds.length ? kinds[i % kinds.length] : ARTICLE_KINDS[0]}
                </span>
                <h3 data-tk="card-title" style={{ fontSize: "var(--tk-size-base)" }}>
                  {c}
                </h3>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export type EventPromoProps = {
  eyebrow?: string;
  heading?: string;
  body?: string;
  meta?: string;
  ctaLabel?: string;
  /** 1-6. Picks the stand-in photograph. */
  seed?: number;
  /** What the photograph is of. */
  category?: string;
  ratio?: string;
};

export const EVENT_EYEBROW = ipsumEyebrow("event-promo-eyebrow");
export const EVENT_HEADING = ipsumHeadline("event-promo-heading");
export const EVENT_BODY = ipsumBody(2, "event-promo-body");
export const EVENT_META = ipsumWhen("event-promo-meta");
export const EVENT_CTA_LABEL = ipsumLabel("event-promo-cta-label");

/** 11 — split media and copy with one action. */
export function EventPromo({
  category,
  eyebrow = EVENT_EYEBROW,
  heading = EVENT_HEADING,
  body = EVENT_BODY,
  meta = EVENT_META,
  ctaLabel = EVENT_CTA_LABEL,
  seed = 5,
  ratio = "16 / 10",
}: EventPromoProps = {}) {
  return (
    <section
      data-tk="section"
      data-section="promo"
      data-shell="split"
      data-gap="7"
      data-align="center"
      style={{ paddingInline: "var(--tk-space-6)" }}
    >
      <Plate fx={true} stock ratio={ratio} seed={seed} category={category} placement="quiet" />
      <div data-shell="stack" data-gap="4" style={{ maxInlineSize: "var(--tk-measure-narrow)" }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--tk-font-mono)",
            fontSize: "var(--tk-size-xs)",
            textTransform: "uppercase",
            letterSpacing: "var(--tk-tracking-wide)",
            color: "var(--tk-text-tertiary)",
          }}
        >
          {eyebrow}
        </p>
        <h2 style={{ margin: 0 }}>{heading}</h2>
        <p data-tk="card-body">{body}</p>
        <p style={{ margin: 0, fontWeight: "var(--tk-weight-semibold)" }}>
          {meta}
        </p>
        <div>
          <ArrowCta size="md">{ctaLabel}</ArrowCta>
        </div>
      </div>
    </section>
  );
}
