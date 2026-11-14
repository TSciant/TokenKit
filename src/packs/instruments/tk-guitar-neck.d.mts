/* Types for tk-guitar-neck.mjs. */
import type { GuitarBinding, GuitarNote, GuitarPosition } from "./guitar-tone.mjs";
export type { GuitarBinding, GuitarNote, GuitarPosition } from "./guitar-tone.mjs";
export interface TkGuitarNeckElement extends HTMLElement {
  /** Fretted positions ("s6f5") and/or 5-fret controller buttons (fret1..5, strum) read through `binding`. */
  state: { pressed?: string[] };
  binding: GuitarBinding;
  /** Play one position: sounds it with `sound`, vibrates the string, fires tk-guitar-note. */
  pluck(string: number, fret?: number, opts?: { velocity?: number; when?: number }): GuitarNote | null;
  /** Play what is held, low string to high, one note per string. */
  strum(positions?: string[], opts?: { gap?: number }): GuitarNote[];
  loadSound(): Promise<boolean>;
  readonly scene: unknown;
}
export class TkGuitarNeck extends HTMLElement {}
export function defineGuitarNeck(reg?: CustomElementRegistry): boolean;
export const STANDARD_TUNING: (number | null)[];
export const DEFAULT_BINDING: GuitarBinding;
export function noteAt(string: number, fret: number): number | null;
export function noteName(midi: number): string;
export function posName(string: number, fret: number): GuitarPosition;
export function parsePos(name: string): { string: number; fret: number } | null;
declare global {
  interface HTMLElementEventMap { "tk-guitar-note": CustomEvent<GuitarNote> }
}
