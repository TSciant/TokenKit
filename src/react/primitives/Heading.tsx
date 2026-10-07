import type { HTMLAttributes, ReactNode } from "react";

/**
 * The kit's text styles: size, leading, tracking and weight together. Set on
 * any element as `data-text`; h1 to h6 default to title, heading-l,
 * heading-m, heading-s, heading-xs and eyebrow. See src/css/04-elements.css.
 */
export type TextStyle =
  | "display"
  | "title"
  | "heading-l"
  | "heading-m"
  | "heading-s"
  | "heading-xs"
  | "eyebrow"
  | "lead"
  | "body"
  | "small"
  | "caption"
  | "metric";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /**
   * The level in the page's outline: what a screen reader lists and jumps
   * between. One h1 per page, and no skipped levels. Choose it for the
   * structure, never for the size.
   */
  level: HeadingLevel;
  /**
   * How it looks, when that is not the level's own look: an h2 that needs to
   * be small (`heading-s`), or an h1 that is a landing page's `display`.
   * Leave it unset and the level's style applies.
   */
  text?: TextStyle;
  children?: ReactNode;
};

/**
 * A heading whose level and look are chosen separately. The level is
 * structure; `text` is appearance. Writing the level to get a size (an h4
 * because it is small) breaks the outline every assistive technology reads.
 */
export function Heading({ level, text, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag data-text={text} {...rest}>
      {children}
    </Tag>
  );
}
