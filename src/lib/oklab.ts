/**
 * Typed surface over the OKLab maths.
 *
 * The implementation lives in ./oklab.mjs and is imported, not copied — the
 * same arrangement as ./contrast.ts and for the same reason. The pack
 * generator, the colour nudger and the stories all need these matrices, and
 * three copies of Ottosson's constants is three chances to mistype one. A
 * mistyped constant does not throw: it produces a colour that is slightly
 * wrong wherever that copy is used, and reads as a taste decision.
 */

import * as impl from "./oklab.mjs";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export interface LCh {
  L: number;
  C: number;
  h: number;
}

export const oklab = impl.oklab as (rgb: RGB) => Lab;
export const srgb = impl.srgb as (lab: Lab) => RGB;
export const oklch = impl.oklch as (rgb: RGB) => LCh;
export const fromOklch = impl.fromOklch as (lch: LCh) => RGB;
export const deltaE = impl.deltaE as (a: RGB, b: RGB) => number;
export const hex = impl.hex as (rgb: RGB) => string;
export const parseHex = impl.parseHex as (input: string) => RGB | null;

/** N colours from light to dark, inclusive of both ends. Hue travels short. */
export const ramp = impl.ramp as (
  light: string | RGB,
  dark: string | RGB,
  steps: number,
) => RGB[];

export const byLightness = impl.byLightness as <T>(
  entries: readonly T[],
  get?: (x: T) => string,
) => T[];
