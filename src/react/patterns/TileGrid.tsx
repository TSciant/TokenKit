import { ipsumHeadline, ipsumLabels } from "../../lib/token-ipsum";
import type { Cols } from "./types";
import { Plate } from "../primitives/Plate";

/* TileGrid, in a file of its own so a client cut can take it without the rest of catalog.tsx, which re-exports it. */

export const TILE_GRID_HEADING = ipsumHeadline("tile-grid-heading");

/* Drawn in one call so the nine are distinct: the tile label is the React key
   for the row, and two tiles sharing one would collapse into a single child. */
export const TILES = ipsumLabels(9, "tile-grid-tiles");

export type TileGridProps = {
  /** false drops the heading, for a page that already names the section. */
  heading?: string | false;
  /** Tighter padding when nested in a sample page that already has a hero. */
  compact?: boolean;
  tiles?: string[];
  columns?: Cols;
  /** Aspect ratio of each tile's stand-in photograph. */
  ratio?: string;
};

/** 15 — dense catalogue grid, a short label over a plate. */
export function TileGrid({
  heading = TILE_GRID_HEADING,
  compact = false,
  tiles = TILES,
  columns = 3,
  ratio = "16 / 9",
}: TileGridProps = {}) {
  return (
    <section
      data-tk="section"
      data-section="feature"
      data-shell="center"
      data-width="wide"
      data-gap="5"
      style={
        compact
          ? { paddingBlock: "var(--tk-space-5)" }
          : { paddingBlock: "var(--tk-space-7)" }
      }
    >
      {heading ? <h2 style={{ margin: 0 }}>{heading}</h2> : null}
      <ul data-shell="grid" data-cols={String(columns)} data-gap="5">
        {tiles.map((s, idx) => (
          <li key={s}>
            <div
              data-tk="card"
              data-interactive
            >
              <Plate
                fx={true}
                stock
                ratio={ratio}
                seed={(idx % 6) + 1}
                placement={false}
              />
              <h3
                data-tk="card-title"
                style={{
                  fontSize: "var(--tk-size-base)",
                  paddingInline: "var(--tk-space-4)",
                  paddingBlockEnd: "var(--tk-space-4)",
                }}
              >
                <a data-tk="card-link" href="#main">{s}</a>
              </h3>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
