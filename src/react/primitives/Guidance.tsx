import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Do and Don't, as a component rather than as a convention.
 *
 * Every design system documents guidance and almost every one does it with a
 * green box and a red box, which is the one encoding that fails the people
 * most likely to need the guidance. Roughly one man in twelve cannot separate
 * those two hues reliably, and a green box and a red box with nothing else in
 * them are, to that reader, two boxes.
 *
 * So the meaning is carried three times over and colour is the least of them:
 *
 *   TEXT    Every panel says "Do" or "Don't" in words. That is the only
 *           channel that survives everything — greyscale, a screen reader, a
 *           printout, a pack with no colour in it at all.
 *   SHAPE   A check or a cross, and the border is solid for Do and dashed for
 *           Don't, so the two are separable at a glance with the colour
 *           removed.
 *   COLOUR  The status slots, last, and only as reinforcement.
 *
 * The test to apply to anything added here: render it in the wireframe pack,
 * which is entirely grey, and check that it still says which is which. If it
 * does not, the colour was carrying meaning rather than reinforcing it.
 *
 * Colour comes from --tk-status-success-* and --tk-status-danger-*, so a pack
 * owns it like everything else. A brand whose palette has no green and no red
 * gets its own answer to this and the guidance still reads.
 *
 * The `note` is not decoration either. "Don't do this" with no reason is a
 * rule people route around the first time it is inconvenient; the note is
 * where the reason goes, and it is required rather than optional for that
 * reason.
 */

export type GuidanceTone = "do" | "dont";

export type GuidanceProps = {
  /** Which half of the pair this is. Drives the word, the icon and the border. */
  tone: GuidanceTone;
  /**
   * Why. Required — a rule with no reason is a rule that gets routed around,
   * and the reason is the part a reader can apply to a case you did not write
   * down.
   */
  note: ReactNode;
  /** Overrides the word. Use for a more specific verb — "Prefer", "Avoid". */
  label?: string;
  /** The example itself: real components, not a picture of them. */
  children?: ReactNode;
};

const DEFAULTS: Record<GuidanceTone, { label: string; icon: "check" | "close" }> = {
  do: { label: "Do", icon: "check" },
  dont: { label: "Don't", icon: "close" },
};

export function Guidance({ tone, note, label, children }: GuidanceProps) {
  const preset = DEFAULTS[tone];
  const word = label ?? preset.label;

  return (
    <figure data-tk="guidance" data-tone={tone}>
      {/* The example first, and in the live components rather than a
          screenshot of them — guidance rendered as an image is guidance that
          stops being true the moment the component changes. */}
      {children ? <div data-tk="guidance-example">{children}</div> : null}

      <figcaption data-tk="guidance-caption">
        {/* aria-hidden on the icon: the word beside it says the same thing,
            and a screen reader announcing a check mark and then the word
            "Do" has said it twice. */}
        <span data-tk="guidance-flag">
          <Icon name={preset.icon} size="sm" aria-hidden="true" />
          <strong>{word}</strong>
        </span>
        <span data-tk="guidance-note">{note}</span>
      </figcaption>
    </figure>
  );
}

/**
 * The pair, side by side where there is room and stacked where there is not.
 *
 * A container query rather than a breakpoint, because guidance appears inside
 * docs columns, cards and full-bleed pages, and what matters is how wide the
 * slot is rather than how wide the window is.
 */
export function GuidancePair({ children }: { children: ReactNode }) {
  return <div data-tk="guidance-pair">{children}</div>;
}
