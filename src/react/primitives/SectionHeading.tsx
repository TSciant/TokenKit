import type { HTMLAttributes, ReactNode } from "react";
import { Arrow } from "./Arrow";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";

export interface SectionHeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** A word or two above the heading: the section's kind, or what it belongs to. Optional. */
  eyebrow?: string;
  /** The heading. */
  title: ReactNode;
  /** h2 for a section of the page (the default), h3 for one inside a section. */
  level?: 2 | 3;
  /**
   * A sentence or two introducing what follows. Optional; an introduction
   * that needs a third sentence is a section of its own.
   */
  children?: ReactNode;
  /** A link to everything of this kind ("All insights"), at the end of the heading. */
  action?: { label: string; href: string };
  /** Start (the default), or centred above a section that is centred too. */
  align?: "start" | "center";
}

/**
 * SectionHeading — the heading of one section of a page, with an optional
 * eyebrow, a short introduction and a link to everything of its kind.
 *
 * It introduces the content set below it and owns none of it, so a page of
 * sections reads as an outline: the page title once, then one of these per
 * section. Not a page title (that is the page header's h1) and not a band of
 * colour: the section it heads carries the surface.
 */
export function SectionHeading({ eyebrow, title, level = 2, children, action, align = "start", ...rest }: SectionHeadingProps) {
  return (
    <div data-tk="section-heading" data-align={align === "center" ? "center" : undefined} {...rest}>
      <div data-tk="section-heading-text">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading level={level} text={level === 2 ? "heading-l" : "heading-m"}>
          {title}
        </Heading>
        {children ? <p data-tk="section-heading-intro">{children}</p> : null}
      </div>
      {action ? (
        <a data-tk="section-heading-action" href={action.href}>
          {action.label}
          <Arrow />
        </a>
      ) : null}
    </div>
  );
}
