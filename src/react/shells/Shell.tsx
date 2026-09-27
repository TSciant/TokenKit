import type { ElementType, ReactNode } from "react";

/**
 * Shell — props become attributes, attributes are matched by CSS.
 *
 * There is no className mapping and no variant lookup table. A prop is a
 * coordinate; CSS reads the coordinate. Adding a gap step means adding one
 * CSS rule, not a new branch here.
 */

export type ShellKind =
  | "stack"
  | "row"
  | "inline"
  | "grid"
  | "split"
  | "sidebar"
  | "center";

export type GapStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface ShellProps {
  as?: ElementType;
  kind: ShellKind;
  gap?: GapStep;
  /** grid only — the column target. Layout still collapses by available width. */
  cols?: 1 | 2 | 3 | 4;
  /** grid only — hold the column count instead of collapsing. */
  fixed?: boolean;
  /** sidebar only — which edge the rail sits on. */
  side?: "start" | "end";
  /** center only */
  width?: "narrow" | "default" | "wide";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  /** Become a query container so descendants can size against this box. */
  container?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Shell({
  as: Tag = "div",
  kind,
  gap,
  cols,
  fixed,
  side,
  width,
  align,
  justify,
  container,
  className,
  children,
  ...rest
}: ShellProps & Record<string, unknown>) {
  /* cols and fixed belong to the grid and to nothing else — the CSS has no
     [data-shell="stack"][data-cols] rule and never will. Rendering them
     anyway produced `<div data-shell="stack" data-cols="3">`, which reads in
     devtools as a three-column stack and behaves as a stack; the attribute
     gate found it, because an attribute that no selector answers is exactly
     what that gate looks for.

     Storybook is how it got there: the meta args set `cols: 3` for the grid
     story and every other story inherits the meta's args. That is Storybook
     behaving correctly. The component is the right place to hold the line,
     because the same mistake is available to anyone passing props. */
  const isGrid = kind === "grid";

  return (
    <Tag
      data-shell={kind}
      data-gap={gap}
      data-cols={isGrid ? cols : undefined}
      data-fixed={isGrid && fixed ? "" : undefined}
      data-side={side}
      /* The base value of each of these renders no attribute, which is the
         kit's idiom everywhere else and was not being followed here.
         `data-width="default"` and `data-justify="start"` both rendered and
         both did nothing: the CSS names narrow and wide, and center, end and
         between, because default width and start justification are what the
         shell already does. An attribute that no selector answers reads in
         devtools as a setting and behaves as decoration. */
      data-width={width === "default" ? undefined : width}
      data-align={align}
      data-justify={justify === "start" ? undefined : justify}
      data-container={container ? "" : undefined}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* Named shorthands. Same component, fixed first coordinate. */
export const Stack = (p: Omit<ShellProps, "kind">) => <Shell kind="stack" {...p} />;
export const Row = (p: Omit<ShellProps, "kind">) => <Shell kind="row" {...p} />;
export const Inline = (p: Omit<ShellProps, "kind">) => <Shell kind="inline" {...p} />;
export const Grid = (p: Omit<ShellProps, "kind">) => <Shell kind="grid" {...p} />;
export const Split = (p: Omit<ShellProps, "kind">) => <Shell kind="split" {...p} />;
export const Sidebar = (p: Omit<ShellProps, "kind">) => <Shell kind="sidebar" {...p} />;
export const Center = (p: Omit<ShellProps, "kind">) => <Shell kind="center" {...p} />;
