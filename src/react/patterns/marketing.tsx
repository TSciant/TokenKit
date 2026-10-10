"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

/* ArrowCta is its own file so a client cut can take it without the rest of
   this module; re-exported here so nothing that imported it from here moves. */
import { ArrowCta } from "./ArrowCta";
export { ArrowCta, ARROW_CTA_LABEL } from "./ArrowCta";
import { Plate } from "../primitives/Plate";
import { InlineForm } from "../primitives/InlineForm";

import type { Cols } from "./types";
/* MapLazy: SegmentList puts a map on the homepage, and a static import of
   maplibre-gl there costs every route ~800 KB. See MapLazy.tsx. */

/* Token Ipsum: seeded placeholder prose that is about the kit's own argument,
   so a reviewer who stops to read the filler learns something instead of
   skipping it. Every call is seeded from the component and the slot, so the
   same words come back on every run and two screenshots stay comparable.
   See src/lib/token-ipsum.ts. */
import { ipsumBody, ipsumDeck, ipsumEyebrow, ipsumHeadline, ipsumLabel, ipsumStats, ipsumTitles, ipsumWhen } from "../../lib/token-ipsum";
/* Patterns now in files of their own, so a client cut can take one alone; re-exported here so no import moves. */
export { HERO_SLIDES, HeroCarousel } from "./HeroCarousel";
export type { HeroSlide, HeroCarouselProps } from "./HeroCarousel";

export { SEGMENTS, REACH_FACTS, SEGMENT_HEADING, SEGMENT_DECK, SEGMENT_REACH_LABEL, SEGMENT_MAP_LABEL, SegmentList } from "./SegmentList";
export type { Segment, SegmentListProps } from "./SegmentList";
export { ARTICLE_KINDS, ARTICLES, ARTICLE_FEED_HEADING, ARTICLE_FEED_DECK, ArticleFeed } from "./ArticleFeed";
export type { ArticleFeedProps } from "./ArticleFeed";

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

export type HeroProps = {
  /** A short line above the title. Leave empty for none. */
  eyebrow?: string;
  title?: string;
  /** One or two sentences under the title. Leave empty for none. */
  lede?: string;
  /** The primary action's label. Leave empty for no primary action. */
  cta?: string;
  /** A second, quieter action beside the first. Leave empty for none. */
  secondary?: string;
  /** buttons: the CTA and the secondary. capture: an inline form (one field, `cta` as its submit) in their place. */
  actions?: "buttons" | "capture";
  /** The capture field's label (capture only). */
  captureLabel?: string;
  /** A line under the capture field: what they are signing up for, how often (capture only). */
  captureHint?: string;
  /** stacked: the visual under the copy. split: copy and visual side by side, stacking when the box cannot hold two. */
  layout?: "stacked" | "split";
  /** plate draws the stand-in photograph; none leaves the hero as copy only. */
  media?: "plate" | "none";
  /** Aspect ratio of the visual. */
  ratio?: string;
  /** 1-6. Picks the stand-in photograph; deterministic so screenshots match. */
  seed?: number;
  /** What the photograph is of, named on the plate while no stock is registered. */
  category?: string;
};

export const HERO_EYEBROW = ipsumEyebrow("hero-eyebrow");
export const HERO_TITLE = ipsumHeadline("hero-title");
export const HERO_LEDE = ipsumDeck("hero-lede");
export const HERO_CTA = ipsumLabel("hero-cta");
export const HERO_SECONDARY = ipsumLabel("hero-secondary");
/* Plain words, like the map label: a field's name is the one string a
   screen-reader user cannot skim past. */
export const HERO_CAPTURE_LABEL = "Email address";
export const HERO_CAPTURE_HINT = "One email a month. Unsubscribe from any of them.";

/**
 * 26 — the static hero: the top of a page that is not a carousel.
 *
 * Eyebrow, title, lede, actions and a visual, every one optional but the
 * title, so the minimal hero is this component with less in it. `layout` is
 * the one coordinate: stacked puts the visual under the copy, split puts it
 * beside. The copy comes first in the DOM either way, so reading order is
 * title, lede, actions, visual on both sides of the wrap. The visual is the
 * page's largest paint, so the plate loads eagerly at high priority and holds
 * its ratio so nothing shifts. Nothing animates in.
 */
export function Hero({
  eyebrow = HERO_EYEBROW,
  title = HERO_TITLE,
  lede = HERO_LEDE,
  cta = HERO_CTA,
  secondary = HERO_SECONDARY,
  actions = "buttons",
  captureLabel = HERO_CAPTURE_LABEL,
  captureHint = HERO_CAPTURE_HINT,
  layout = "stacked",
  media = "plate",
  ratio = "16 / 9",
  seed = 2,
  category,
}: HeroProps = {}) {
  const split = layout === "split";
  return (
    <section
      data-tk="hero"
      data-layout={split ? "split" : undefined}
      data-shell="center"
      data-width="wide"
    >
      <div data-tk="hero-body">
        <div data-tk="hero-text" data-shell="stack" data-gap="4">
          {eyebrow ? <span data-tk="eyebrow">{eyebrow}</span> : null}
          <h1 data-tk="hero-title">{title}</h1>
          {lede ? <p data-tk="hero-lede">{lede}</p> : null}
          {actions === "capture" ? (
            <div data-tk="hero-actions">
              <InlineForm
                label={captureLabel}
                submitLabel={cta || HERO_CTA}
                hint={captureHint || undefined}
                onSubmit={(e) => e.preventDefault()}
              />
            </div>
          ) : cta || secondary ? (
            <div data-tk="hero-actions" data-shell="inline" data-gap="3">
              {cta ? <ArrowCta variant="solid">{cta}</ArrowCta> : null}
              {secondary ? (
                <button data-tk="button" data-variant="quiet" data-size="lg" type="button">
                  {secondary}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {media === "plate" ? (
          <div data-tk="hero-visual">
            <Plate fx={false} stock ratio={ratio} seed={seed} category={category} priority />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export type Stat = { value: string; label: string };

export const PROOF_STATS: Stat[] = ipsumStats(3, "proof-strip-stats");

export type ProofStripProps = {
  /** Leave empty (with deck) for the facts alone, as a strip under a hero. */
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
      data-strip={heading || deck ? undefined : ""}
      data-shell="center"
      data-width="wide"
      data-gap="6"
    >
      {/* Heading and deck are optional: without them the strip is just the
          facts, which is the post-hero utility strip (a hero above already
          said what the page is). */}
      {heading || deck ? (
        <header
          data-shell="stack"
          data-gap="3"
          style={{
            maxInlineSize: "var(--tk-measure)",
            textAlign: "center",
            marginInline: "auto",
          }}
        >
          {heading ? <h2 style={{ margin: 0 }}>{heading}</h2> : null}
          {deck ? (
            <p data-tk="card-body" style={{ margin: 0 }}>
              {deck}
            </p>
          ) : null}
        </header>
      ) : null}

      <dl
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
            <dd data-text="metric" style={{ order: 1, margin: 0 }}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
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
      <div data-shell="grid" data-cols={String(columns)} data-gap="5">
        {items.map((t, idx) => (
          <div
            key={t}
            data-tk="card"
            data-interactive
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
            <h3 data-tk="card-title">
              <a data-tk="card-link" href="#main">{t}</a>
            </h3>
          </div>
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
      style={{ paddingInline: "var(--tk-gutter)" }}
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
