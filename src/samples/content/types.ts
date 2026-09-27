import type {
  ArticleFeedProps,
  EventPromoProps,
  FeatureGridProps,
  HeroCarouselProps,
  ProofStripProps,
  SegmentListProps,
} from "../../react/patterns/marketing";
import type { ProtoRoute } from "../nav";

/**
 * Content packs — the third layer, and the one the kit was missing.
 *
 * A brand has been three things here: a token pack, a posture, and a set of
 * marks. Switch the toolbar and six unrelated identities appear on the same
 * components — and say exactly the same words, because every page draws its
 * copy from one deterministic ipsum generator. The argument the kit makes is
 * "one system, many brands", and it was making it with one brand's content
 * six times.
 *
 * This is the Zen Garden move, with the axis rotated. Zen Garden froze the
 * markup and varied the stylesheet. Here the COMPONENTS are frozen — same
 * patterns, same order, same props — and a brand varies its tokens and its
 * words together. The page composition does not know which brand it is
 * rendering, which is the whole claim, and now it holds for the copy too.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS TYPESCRIPT AND NOT A TEMPLATE LANGUAGE.
 *
 * The obvious reach is Handlebars: a template per page, a data file per brand.
 * It would work and it would reintroduce, deliberately, the exact bug this
 * repo has spent three gates killing. A template is a string. `{{brand.taglin}}`
 * renders as nothing, the page looks slightly emptier than it should, and
 * nothing anywhere says so — the same silence as a `data-tk` nobody answers
 * and a union narrower than its CSS.
 *
 * Typed content cannot do that. A misspelled key is a compile error; a string
 * where a list belongs is a compile error; a brand that fills a page fills all
 * of it or does not typecheck.
 *
 * ---------------------------------------------------------------------------
 * THE SHAPE, WHICH IS THE PART WORTH COPYING.
 *
 * There is no content schema in this file. Every slot below is the PATTERN'S
 * OWN PROPS TYPE, imported. A content pack is a bag of props waiting to be
 * spread.
 *
 * That buys three things at once. It cannot drift from the components, because
 * it is not a description of them. Everything is optional already, since every
 * pattern prop is optional and defaults to ipsum — so a partial pack is not a
 * special case, it is just a smaller bag, and a brand can be filled in one
 * page at a time without a single `undefined` check. And the fallback needs no
 * code at all: `<ProofStrip {...(c.proof ?? {})} />` with an empty bag is
 * `<ProofStrip />`, which is today's wireframe exactly.
 *
 * Which means the delivered grayscale prototype is untouched by all of this.
 * It has no content pack, so it gets the ipsum, so it is byte-identical.
 */

/** The six patterns the home page composes, keyed by their place on it. */
export interface HomeContent {
  hero?: HeroCarouselProps;
  proof?: ProofStripProps;
  segments?: SegmentListProps;
  features?: FeatureGridProps;
  articles?: ArticleFeedProps;
  event?: EventPromoProps;
}

export interface ServicesContent {
  /** Page title. The breadcrumb and hero read it. */
  title?: string;
  deck?: string;
  intro?: string;
  modalBody?: string;
  feature?: { eyebrow?: string; title?: string; body?: string };
  tileHeading?: string;
  faq?: { q: string; a: string }[];
}

export interface AboutContent {
  title?: string;
  deck?: string;
  proof?: ProofStripProps;
  segments?: SegmentListProps;
  promo?: { title?: string; body?: string; modalBody?: string };
}

/**
 * A page a brand has not written yet is simply absent, and the ipsum shows
 * through. Optional per PAGE rather than per field: within a page the types
 * are the patterns' own, so whatever a brand does supply is fully checked.
 */
export type Pages = {
  home?: HomeContent;
  services?: ServicesContent;
  about?: AboutContent;
};

export interface BrandContent {
  /** Matches the pack slug in the toolbar and in `data-brand`. */
  slug: string;
  /** The name in running text — not the wordmark, which the pack owns. */
  label: string;
  /**
   * What the site's own navigation calls its sections. A hardware brand and a
   * bakery do not have the same six pages, and pretending they do is the
   * tell that the content is placeholder.
   */
  nav?: { label: string; route: ProtoRoute }[];
  /** The line the prototype rail prints. */
  spine?: { engagement: string; client: string; outcome: string };
  pages: Pages;
}
