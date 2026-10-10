import { ipsumLabels, ipsumTitles, ipsumHeadline, ipsumDeck } from "../../lib/token-ipsum";
import type { Cols } from "./types";
import { Plate } from "../primitives/Plate";

/* ArticleFeed, in a file of its own so a client cut can take it without the rest of marketing.tsx, which re-exports it. */

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
        data-shell="grid"
        data-cols={String(columns)}
        data-gap="5"
        style={{ ["--_min" as string]: "14rem" }}
      >
        {cards.map((c, i) => (
          <div
            key={c}
            data-tk="card"
            data-variant="bare"
            data-interactive
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
                  <a data-tk="card-link" href="#main">{c}</a>
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
