import { useId, type HTMLAttributes, type ReactNode } from "react";

export type DataTableColumn = {
  /** The key each row's cell is read from. */
  key: string;
  /** The column heading, as it should read. */
  label: string;
  /**
   * "end" for figures, so their places line up down the column; "start" (the
   * default) for words. The heading follows its column.
   */
  align?: "start" | "end";
  /**
   * A width for the column, as a CSS length ("12rem", "30%"). Leave it unset
   * and the column sizes to what is in it, which is right most of the time.
   */
  width?: string;
};

export interface DataTableProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * What the table is, in a line: "Opening hours by site". Required:
   * it names the table for a screen reader, and names the scrolling region
   * around it, so a keyboard user knows what they are scrolling.
   */
  caption: string;
  /**
   * Keep the caption for screen readers only, when a heading right above the
   * table already says the same thing to sight.
   */
  captionHidden?: boolean;
  /** The columns, in order: each a key, a heading, and how to align it. */
  columns: DataTableColumn[];
  /** One object per row, keyed by column key. A missing key is an empty cell. */
  rows: Record<string, ReactNode>[];
  /**
   * The key of the column that names each row (usually the first). Its cells
   * become row headers, so a screen reader announces "Northfield" before
   * "12" and a figure is never read without what it is a figure of.
   */
  rowHeader?: string;
  /** Shade every other row, for long rows that are hard to follow across. */
  striped?: boolean;
  /** Tighter cells, for a table that is mostly figures and needs to fit. */
  dense?: boolean;
}

/**
 * DataTable — data that is a table: rows of the same kind of thing, compared
 * across the same columns. A real <table>, with a caption that names it,
 * column headers, and optionally a column of row headers.
 *
 * For data only, never for layout. Figures line up (tabular numbers) and
 * end-align in a column set to "end". On a container too narrow for it, the
 * table scrolls sideways inside a region named by its caption, which takes
 * keyboard focus so it can be scrolled without a mouse; the page itself never
 * scrolls sideways. A list of key and value pairs is a description list
 * instead, and a grid of cards is a collection.
 */
export function DataTable({
  caption,
  captionHidden = false,
  columns,
  rows,
  rowHeader,
  striped = false,
  dense = false,
  ...rest
}: DataTableProps) {
  const id = useId();
  const captionId = `${id}-caption`;
  return (
    <div
      data-tk="data-table"
      data-striped={striped ? "" : undefined}
      data-dense={dense ? "" : undefined}
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      {...rest}
    >
      <table data-tk="data-table-table">
        <caption id={captionId} data-tk="data-table-caption" data-hidden={captionHidden ? "" : undefined}>
          {captionHidden ? <span data-tk="visually-hidden">{caption}</span> : caption}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                data-align={c.align === "end" ? "end" : undefined}
                style={c.width ? { inlineSize: c.width } : undefined}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => {
                const align = c.align === "end" ? "end" : undefined;
                return c.key === rowHeader ? (
                  <th key={c.key} scope="row" data-align={align}>
                    {row[c.key]}
                  </th>
                ) : (
                  <td key={c.key} data-align={align}>
                    {row[c.key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
