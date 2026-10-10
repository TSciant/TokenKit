import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "./Card";

export interface QuoteProps extends Omit<HTMLAttributes<HTMLElement>, "role"> {
  /** The words, without quotation marks: the marks are drawn by the CSS. A blank line starts a new paragraph. */
  text: string;
  /** Who said it. */
  name: string;
  /** What they do: "Head of operations". */
  role?: string;
  /** Where they do it: a company, a team, a school. Follows the role after a comma. */
  organisation?: string;
  /** A small round picture of them, beside the name: an Avatar, an image, a Plate. Decorative; the name says who. */
  portrait?: ReactNode;
  /** plain (the default) in running text; pull, large, for breaking up an article; testimonial, in a card with the portrait. */
  variant?: "plain" | "pull" | "testimonial";
}

/**
 * Quote — something someone said, and who said it.
 *
 * A figure holding the quotation (a blockquote) and its attribution (the
 * figcaption: a name, then a role and organisation), so the two are read as
 * one thing and the words are never separated from the person. The quotation
 * marks are drawn by the CSS in the reader's language, not typed into the
 * text, so the same words can be set as a plain quote, a pull quote or a
 * testimonial without editing them.
 *
 * Plain sits in running text. Pull is large and ruled above and below, for
 * breaking up a long article; it should repeat words already on the page, as
 * a pull quote does. Testimonial is the quote inside the kit's Card with a
 * small round portrait beside the name, for a row of customer quotes. The
 * portrait is decoration: the name beside it says who.
 */
export function Quote({ text, name, role, organisation, portrait, variant = "plain", ...rest }: QuoteProps) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const where = [role, organisation].filter(Boolean).join(", ");

  const figure = (
    <figure data-tk="quote" data-variant={variant === "plain" ? undefined : variant} {...(variant === "testimonial" ? {} : rest)}>
      <blockquote data-tk="quote-text">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </blockquote>
      <figcaption data-tk="quote-attribution">
        {portrait ? (
          <span data-tk="quote-portrait" aria-hidden="true">
            {portrait}
          </span>
        ) : null}
        <span data-tk="quote-source">
          <span data-tk="quote-name">{name}</span>
          {where ? <span data-tk="quote-role">{where}</span> : null}
        </span>
      </figcaption>
    </figure>
  );

  /* The card is the surface and the figure is the content, the way an office
     card is ContactDetails inside a Card. Anything passed through (an id, a
     class for the grid) goes on the outermost element either way. */
  return variant === "testimonial" ? <Card {...rest}>{figure}</Card> : figure;
}
