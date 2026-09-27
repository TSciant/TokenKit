/**
 * Typed surface over the contrast math.
 *
 * The implementation lives in ./contrast.mjs and is imported, not copied.
 * A gate that reimplements its own maths drifts from the UI that shows the
 * same numbers; this file exists so that cannot happen.
 */

/* Plain ESM sibling, no hand-written types by design — allowJs infers them
   from the source, so there is nothing here to suppress. A suppression
   directive used to sit on this import; it went stale and became an error in
   its own right, which is the argument for not writing one speculatively.
   (Naming the directive in prose is enough to re-trigger it, so it is not
   named.) */
import * as impl from "./contrast.mjs";

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type ContrastKind =
  | "textNormal"
  | "textLarge"
  | "textNormalAAA"
  | "nonText"
  | "focus";

export interface Verdict {
  ratio: number | null;
  required: number;
  pass: boolean;
  kind: ContrastKind;
  reason: string | null;
}

export const THRESHOLD: Record<ContrastKind, number> = impl.THRESHOLD;

export const parseColor = impl.parseColor as (input: string | null) => RGBA | null;

export const flatten = impl.flatten as (fg: RGBA, bg: RGBA) => RGBA;

export const relativeLuminance = impl.relativeLuminance as (
  color: string | RGBA,
) => number | null;

export const contrastRatio = impl.contrastRatio as (
  fg: string | RGBA,
  bg: string | RGBA,
  backdrop?: string | RGBA,
) => number | null;

export const judge = impl.judge as (
  fg: string | RGBA,
  bg: string | RGBA,
  kind?: ContrastKind,
  backdrop?: string | RGBA,
) => Verdict;

export const pickInk = impl.pickInk as (
  bg: string,
  light?: string,
  dark?: string,
) => string;

export const format = impl.format as (ratio: number | null) => string;
