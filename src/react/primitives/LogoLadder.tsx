import type { CSSProperties, ReactNode } from "react";

/**
 * LogoLadder — a logo that picks its own stage from the box it is given.
 *
 * Six stages, from a hero down to a favicon: FULL, LOCKUP, STACK, WORD, MARK,
 * ICON. Which one renders is a container query, not a breakpoint and not a
 * prop — so the same element is a full lockup in a hero and a bare mark in a
 * 48px sidebar, without the page knowing anything about either.
 *
 * The parts are slots and the behaviour is the kit's. A brand supplies a mark,
 * a wordmark and a tagline; everything about when each appears, how they
 * arrange and how they scale lives in logo-ladder.css. That is the whole
 * argument: a brand arriving should be content and tokens arriving, not a
 * component being rewritten.
 *
 * See logo-ladder.css for why there is one DOM tree rather than six, why the
 * bands are `min-width` rather than the ranges they are usually drawn as, and
 * why `smStage` is a prop instead of a seventh query.
 */

export type LogoStage = "icon" | "mark" | "word" | "stack" | "lockup" | "full";

export type LogoLadderProps = {
  /** The symbol. An inline `<svg>` is ideal; anything that renders works. */
  mark?: ReactNode;
  /** The name, as it is set. Also the accessible name unless `label` says otherwise. */
  word?: string;
  /** Shown at FULL only — the one stage with room for it. */
  tagline?: string;
  /**
   * Which of the two same-size stages this brand uses at >= 80px.
   *
   * Not a size question, which is why it cannot be a query: it asks whether
   * the brand survives as a symbol or as type. A monogram in a square reads
   * at 80px and a wordmark-led brand with a flourish does not.
   */
  smStage?: "mark" | "word";
  /**
   * Pin a stage and ignore the container.
   *
   * For specimen sheets, where six stages have to appear in six boxes of the
   * same width — the one case where the container is the wrong thing to ask.
   * Leave it unset in production; a pinned logo is a logo that has stopped
   * responding.
   */
  stage?: LogoStage;
  /** Wrap in a link. A logo in a header is nearly always the way home. */
  href?: string;
  /** Accessible name. Defaults to the wordmark, then to "Logo". */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * The stand-in mark.
 *
 * The kit ships no brand, so it ships no symbol — the same position Plate
 * takes on photography. This is a neutral geometric placeholder that is
 * legible at 16px and obviously not anybody's logo, so a ladder with no mark
 * supplied still demonstrates the ladder.
 */
function PlaceholderMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10 22V10h5a4 4 0 0 1 0 8h-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 18l6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function LogoLadder({
  mark,
  word = "Brand",
  tagline,
  smStage = "mark",
  stage,
  href,
  label,
  className,
  style,
}: LogoLadderProps = {}) {
  /* One accessible name for the whole thing, on the wrapper, with the visual
     parts hidden from assistive tech.

     Both halves matter. Without the label, the ICON stage is an unlabelled
     graphic — the smallest stage is the one most likely to be the only link
     to the homepage, and "link, graphic" is not a destination. Without hiding
     the parts, FULL announces the name twice and then reads a tagline that is
     set in caps, which some screen readers spell out. */
  const name = label ?? word ?? "Logo";

  /* aria-hidden on the parts themselves rather than on a wrapper. A wrapper
     would need `display: contents` to stay out of the flex layout, and
     `display: contents` has a history of dropping elements from the
     accessibility tree in ways that differ by browser — not something to put
     on the path between a logo and its accessible name. */
  /* `logo-body` is the box the stages rearrange. The wrapper is the container,
     and a container query cannot style the container it asks, so the layout
     lives one level in. */
  const inner = (
    <span data-tk="logo-body">
      <span data-tk="logo-mark" aria-hidden="true">
        {mark ?? <PlaceholderMark />}
      </span>
      <span data-tk="logo-text" aria-hidden="true">
        <span data-tk="logo-word">{word}</span>
        {tagline ? <span data-tk="logo-tagline">{tagline}</span> : null}
      </span>
    </span>
  );

  const shared = {
    "data-tk": "logo",
    "data-sm": smStage,
    "data-stage": stage,
    className,
    style,
  } as const;

  if (href) {
    return (
      <a {...shared} href={href} aria-label={name}>
        {inner}
      </a>
    );
  }

  return (
    <span {...shared} role="img" aria-label={name}>
      {inner}
    </span>
  );
}
