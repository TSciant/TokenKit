"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { type CSSProperties } from "react";
import { useMotionFx } from "../motion/useMotionFx";
import { useInView } from "../motion/useInView";
import type { FxProp } from "../motion/types";
import { plateFxContext } from "../motion/types";

/**
 * A plate standing in for photography.
 *
 * All of the work is in src/css/components/plate.css — this maps props to
 * attributes and adds nothing, which is the rule for every React wrapper in
 * the kit. `seed` varies the composition so a grid of plates reads as four
 * photographs rather than one asset repeated.
 */
/**
 * Stand-in photographs, by seed.
 *
 * Empty in the boilerplate, and that is the default state of the kit: a plate
 * with no photograph draws its own — a light source, a horizon, a subject and
 * a texture, all from surface tokens, depicting nothing. That is a better
 * placeholder than someone else's stock library, and it carries no licence.
 *
 * To use real photographs on an engagement, put them in the app's public
 * directory and map them here, or pass `src` per plate. Nothing else changes:
 * `stock` already switches the plate from drawing to displaying.
 */
export const STOCK_BY_SEED: Record<number, string> = {};

/**
 * Stand-in photographs by SUBJECT, which is the one a brand can talk about.
 *
 * A seed picks a composition; a category picks a thing. "Plate 4" is a fact
 * about this repo and "a storefront at dusk" is a fact about the brand, and
 * only the second is something a content pack can meaningfully ask for. A
 * hardware retailer's feature grid wants tools and aisles; a bakery's wants
 * dough and steam. Both are the same component asking for a different noun.
 *
 * Empty here for the same reason STOCK_BY_SEED is: the kit ships no
 * photography and the delivered prototype is a grayscale wireframe, so every
 * category resolves to nothing and every plate draws itself. The category is
 * still worth carrying with no images behind it — it is what the plate's own
 * label can say it is standing in for, which turns "grey box" into "grey box
 * where a storefront goes", and it is the join a manifest fills in later
 * without a component changing.
 */
export const STOCK_BY_CATEGORY: Record<string, string[]> = {};

/**
 * Fill both maps from a manifest an application supplies.
 *
 * Mutation rather than an import, and deliberately: src/react/ may not depend
 * on src/client/, which tools/boundary-gate.mjs enforces on every run. The kit
 * cannot reach a client's images; a client hands them over.
 */
export function registerStock(manifest: {
  bySeed?: Record<number, string>;
  byCategory?: Record<string, string[]>;
}) {
  Object.assign(STOCK_BY_SEED, manifest.bySeed ?? {});
  Object.assign(STOCK_BY_CATEGORY, manifest.byCategory ?? {});
}

/**
 * How far ahead of the viewport a deferred plate starts loading. One screen is
 * enough that the photograph is there before the reader is, on any connection
 * where it was going to arrive at all.
 */
const PLATE_LEAD = "100% 0px";

export function Plate({
  ratio = "16 / 9",
  label,
  texture,
  crop,
  bleed,
  seed,
  category,
  /** Use a stand-in photograph from STOCK_BY_SEED — empty here, so the plate
      draws its own; honesty chip defaults to quiet. */
  stock = false,
  src,
  /** false hides the chip; "quiet" (default on stock) is a whisper mark. */
  placement = "quiet",
  /** This plate is above the fold — load its photograph first, not last. */
  priority = false,
  fx,
  style,
}: {
  ratio?: string;
  label?: string;
  /* The full texture vocabulary, not a hand-picked four.
 
     This was `"hatch" | "dots" | "rule" | "none"` while the CSS named
     sixteen, so every material texture and both brand-owned ones were
     unreachable from the component that most wants them — and nothing said
     so, because a union is only wrong against another union. Held in step by
     tools/vocabulary-gate.mjs now. */
  texture?:
    | "hatch"
    | "dots"
    | "rule"
    | "grid"
    | "noise"
    | "weave"
    | "chevron"
    | "grain"
    | "paper"
    | "stone"
    | "mist"
    | "grit"
    | "halftone"
    | "brand"
    | "signature"
    | "none";
  crop?: "portrait";
  /** Flush to the parent's edge; the parent supplies the corners and clips. */
  bleed?: boolean | "full";
  /** 1-6. Deterministic, so two screenshots of the same slot match. */
  seed?: number;
  /** When true, fill with a stand-in photograph (by seed) instead of drawing one. */
  stock?: boolean;
  /** Explicit image URL/path; overrides seed and category. */
  src?: string;
  /**
   * What this plate stands in for — "storefront", "dunes", "prep bench".
   *
   * Resolves through STOCK_BY_CATEGORY when an application has registered a
   * manifest, and names the subject on the plate's own label when it has not,
   * which is most of the time and is the point: a wireframe that says where a
   * storefront goes is a better wireframe than one with a grey box in the
   * same place.
   */
  category?: string;
  /** Stock honesty: quiet whisper (default), loud legacy, or hidden. */
  placement?: boolean | "quiet" | "loud";
  /**
   * Mark the one plate that is visible before any scrolling.
   *
   * A plate's photograph is usually the largest thing on the screen, which
   * makes it the Largest Contentful Paint. Everything here defers by default —
   * loading="lazy", so a page of twelve plates fetches the two you can see —
   * and `priority` opts the first one out, with fetchPriority="high" so it is
   * requested ahead of the rest of the page's subresources instead of behind
   * them. Setting it on more than one plate per page defeats it: the whole
   * value of a high priority is that most things do not have one.
   */
  priority?: boolean;
  /** Motion FX. `true` infers plate / plate-stock / plate-hero from stock+bleed. */
  fx?: FxProp;
  style?: CSSProperties;
}) {
  /* Category first, then seed. A brand that asked for a storefront and a slot
     that asked for composition four are two different requests, and the
     specific one wins. Within a category the seed picks which of them, so a
     grid of four "aisle" plates is four aisles rather than one repeated. */
  const byCategory = category ? STOCK_BY_CATEGORY[category] : undefined;
  const stockSrc =
    src ??
    (byCategory?.length
      ? byCategory[((seed ?? 1) - 1) % byCategory.length]
      : stock
        ? (STOCK_BY_SEED[seed ?? 1] ?? STOCK_BY_SEED[1])
        : undefined);
  const motion = useMotionFx(fx, plateFxContext({ stock, src, bleed }));

  /* A deferred plate has no `src` until it is nearly on screen.
 
     `loading="lazy"` is a request, not an instruction: on a slow connection
     Chrome widens its threshold and fetches a long way past the fold. On the
     case studies grid that meant the three cards below the fold pulled 65 KB
     while the 21 KB photograph at the top — the Largest Contentful Paint —
     was still queued behind them, and the measured LCP sat at 3.0s against a
     1.3s first paint.
 
     Withholding the attribute is the only way to actually not fetch. It is
     safe here and nowhere near safe in general: a plate is a stand-in for a
     photograph in a grayscale wireframe, is aria-hidden, and carries no
     information — so a reader whose JavaScript never runs loses nothing but
     the texture. Real content must never be gated this way. `priority` opts
     out, and the one plate above the fold should always set it. */
  const [viewRef, near] = useInView<HTMLDivElement>({
    once: true,
    rootMargin: PLATE_LEAD,
    threshold: 0,
    enabled: Boolean(stockSrc) && !priority,
  });
  const showMedia = Boolean(stockSrc) && (priority || near);
  const showPlacement = showMedia && placement !== false;
  const placementTone =
    placement === true || placement === "loud" ? "loud" : "quiet";

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        (motion.ref as (n: HTMLElement | null) => void)(node);
        (viewRef as { current: HTMLDivElement | null }).current = node;
      }}
      aria-hidden="true"
      data-tk="plate"
      /* Keyed on showMedia, not on stockSrc: until the photograph is actually
         being loaded, the plate draws its own synthetic composition — light
         source, horizon, texture — which is a better placeholder than the flat
         sunken box `data-stock` switches it to. The box is the same size
         either way, so nothing shifts when the photograph replaces it. */
      data-stock={showMedia ? "" : undefined}
      data-texture={showMedia ? "none" : texture}
      data-crop={crop}
      data-seed={seed}
      data-bleed={bleed === "full" ? "full" : bleed ? "" : undefined}
      {...motion.props}
      style={{ ["--_ratio" as string]: ratio, ...motion.props.style, ...style }}
    >
      {showMedia ? (
        <>
          <img
            data-tk="plate-media"
            src={stockSrc}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding={priority ? "sync" : "async"}
          />
          {showPlacement ? (
            <span data-tk="plate-placement" data-tone={placementTone}>
              For placement only
            </span>
          ) : null}
        </>
      ) : null}
      {/* The label says the subject when nothing else has. With a photograph
          in place the picture speaks for itself and the honesty chip covers
          the rest; without one, naming the subject is the difference between
          a placeholder and a grey rectangle. */}
      {label ?? (!showMedia && category) ? (
        <span data-tk="plate-label">{label ?? category}</span>
      ) : null}
    </div>
  );
}
