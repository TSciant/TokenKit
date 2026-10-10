"use client";
/* Client component: it uses React state, effects or DOM APIs. See the note at the top of chrome.tsx. */

import { ipsumLabels, ipsumHeadline, ipsumDeck } from "../../lib/token-ipsum";
import { useState, useId } from "react";
import { Plate } from "../primitives/Plate";
import { Icon } from "../primitives/Icon";
import { ArrowCta } from "./ArrowCta";

/* HeroCarousel, in a file of its own so a client cut can take it without the rest of marketing.tsx, which re-exports it. */

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

              {/* A deck of one is a hero, not a carousel: no pager for it. */}
              {deck.length > 1 ? (
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
