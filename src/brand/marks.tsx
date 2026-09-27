/**
 * Specimen marks.
 *
 * Six original symbols, one per specimen pack. They exist so the logo ladder
 * has something real to reduce: the argument the ladder makes — that a mark
 * has to be redrawn, not scaled, to survive at 24px — is unreadable against a
 * placeholder, because a placeholder looks the same at every size by design.
 *
 * WHAT THESE ARE AND ARE NOT.
 *
 * They are original geometry drawn for this kit. Each one rhymes with a
 * category — a retail spark, a delivery arc, a breakfast ring, a burger
 * badge, a roadside critter — because a category is what a reader recognises,
 * and recognition is the thing being tested. None reproduces anyone's mark,
 * and none is presented as belonging to a real company: the names are
 * invented, the specimen sheet says specimen on it, and the shapes are the
 * most generic form of their idea rather than the distinctive form some
 * particular company made distinctive.
 *
 * DRAWING RULES, which are the same rules the ladder is arguing for.
 *
 * One 32x32 viewBox each, so every mark occupies the same box and the ladder's
 * `--_unit` sizing is the only thing that changes between stages. Everything
 * paints with `currentColor`, which the ladder resolves from
 * `--tk-logo-mark-ink` — so a mark is a shape and the pack owns its colour,
 * and a mark that hardcoded a hex would be the one thing in the kit a brand
 * swap could not reach.
 *
 * Stroke weights are set to survive the reduction: nothing thinner than 2.5
 * units at 32, because at the ICON stage the box is 12-14px of real estate and
 * a 1.5-unit stroke is a grey smudge on a phone. That is the whole craft
 * point of the exercise, so the marks had better obey it.
 *
 * `aria-hidden` on every one: the ladder puts a single accessible name on the
 * wrapper, and a mark that announced itself would make every logo read its
 * brand twice.
 */

const BOX = {
  viewBox: "0 0 32 32",
  fill: "none",
  "aria-hidden": true,
  focusable: "false",
} as const;

/**
 * TK — the house mark.
 *
 * A T and a K sharing one stem, which is the reason the base brand can put
 * MARK early on the ladder: the monogram is not an abbreviation of the
 * wordmark, it is the same two letters at a different size. ToeKnee resolves
 * to Token Kit and the mark is where the two names are already the same.
 */
export function TkMark() {
  return (
    <svg {...BOX}>
      {/* T: crossbar and stem. The stem is shared. */}
      <path
        d="M7 7h18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M13.5 7v18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* K: two diagonals off the shared stem. */}
      <path
        d="M25 12.5 13.5 19"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="m18 16 7 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Door Shop — a six-point spark.
 *
 * Radial and symmetrical, which is why this brand can drop to MARK without
 * losing anything: a shape with no top and no reading direction survives
 * rotation, small sizes and a square crop equally well. The tapering that a
 * drawn spark usually has is left out on purpose — it is the first thing to
 * disappear at 14px, so a mark that depends on it is a mark that fails there.
 */
export function DoorShopMark() {
  return (
    <svg {...BOX}>
      <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
        <path d="M16 4v24" />
        <path d="M5.6 10 26.4 22" />
        <path d="M5.6 22 26.4 10" />
      </g>
    </svg>
  );
}

/**
 * Mohave — the arc.
 *
 * A single open stroke with a lift at the right end. It is the one mark in the
 * set that cannot carry the brand alone, which is the point of including it:
 * an arc is not a symbol, it is punctuation for a wordmark, so this brand sets
 * `smStage="word"` and shows its name where the others show their mark. A
 * ladder that had no type-led brand in it would be arguing with itself.
 */
export function MohaveMark() {
  return (
    <svg {...BOX}>
      <path
        d="M5 13c2.8 6.2 7.2 9.3 13.2 9.3 3.5 0 6.4-.9 8.8-2.8"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* The lift. Drawn as its own cap rather than a curve on the main
          stroke, so it stays a distinct beat instead of melting into the
          arc when the whole thing is 14px wide. */}
      <path
        d="M22.6 23.4 27 19.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Bathing Bagels — the ring.
 *
 * The most reducible shape in the set, and the reason this brand prefers MARK
 * early: a ring is legible as a ring at any size a browser can draw, provided
 * the hole survives. It is drawn as a thick stroke rather than two filled
 * circles so the hole is geometry and not a second colour — a knocked-out
 * centre goes solid the moment a mark lands on a ground the pack does not own.
 */
export function BagelMark() {
  return (
    <svg {...BOX}>
      <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeWidth="5" />
      {/* Seeds. The first thing the ICON stage is allowed to lose — they sit
          at 1.4 units and simply stop resolving, which is the correct
          behaviour for detail that was never load-bearing. */}
      <g fill="currentColor" opacity="0.55">
        <circle cx="16" cy="4.6" r="1.4" />
        <circle cx="24.1" cy="8" r="1.4" />
        <circle cx="27.4" cy="16" r="1.4" />
      </g>
    </svg>
  );
}

/**
 * Wanda's — the W.
 *
 * A letterform, which makes it the only mark in the set that is also type.
 * That is why this brand prefers WORD at the shared 80px band despite having
 * a perfectly good symbol: when the mark and the wordmark are the same letter,
 * showing the mark alone at small sizes throws away the rest of the name for
 * nothing. The ICON stage is where the badge earns its place, on the tile.
 */
export function WandasMark() {
  return (
    <svg {...BOX}>
      <path
        d="M5 8.5 10.2 24 16 13.4 21.8 24 27 8.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Muncheese — the critter.
 *
 * The hard case, and the one that justifies the whole ladder. A face is built
 * from five or six shapes and every one of them is a detail; scaled to 14px it
 * is a dark blob with two lighter dents. This version is drawn at the size it
 * has to survive — two ears, one head, a muzzle, two eyes, nothing else — so
 * the reduction is a decision made once here rather than a surprise in a
 * favicon.
 */
export function MuncheeseMark() {
  return (
    <svg {...BOX}>
      <circle cx="9.2" cy="9.2" r="4.2" fill="currentColor" />
      <circle cx="22.8" cy="9.2" r="4.2" fill="currentColor" />
      <circle cx="16" cy="18" r="10" fill="currentColor" />
      {/* Muzzle and eyes are knocked out of the head in the GROUND colour,
          not painted in a second ink — so the face keeps working in a pack
          that gives the mark one colour, which is most of them.

          `--_mark-ground` rather than --tk-surface-default, because the
          ground is not the same in every stage: at ICON the mark sits on
          --tk-logo-tile, and a knockout painted in the surface colour there
          is a white hole in a coloured badge. logo-ladder.css sets it per
          stage, which is the only place that knows. */}
      <ellipse cx="16" cy="21.6" rx="4.6" ry="3.4" fill="var(--_mark-ground, #fff)" />
      <circle cx="12.2" cy="15.2" r="1.7" fill="var(--_mark-ground, #fff)" />
      <circle cx="19.8" cy="15.2" r="1.7" fill="var(--_mark-ground, #fff)" />
      <circle cx="16" cy="19.4" r="1.5" fill="currentColor" />
    </svg>
  );
}
