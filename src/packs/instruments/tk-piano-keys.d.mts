/* Types for tk-piano-keys.mjs. */
import type { PianoBinding, PianoKey, PianoNote } from "./piano-tone.mjs";
export type { PianoBinding, PianoKey, PianoNote } from "./piano-tone.mjs";
export interface TkPianoKeysElement extends HTMLElement {
  /** Keys held down ("C4") and/or gamepad buttons read through `binding`; keys sound on the way down. */
  state: { pressed?: string[] };
  binding: PianoBinding;
  /** The sustain pedal: while down, keys let go keep ringing. */
  sustain: boolean;
  /** Keys held down right now, as note names. */
  readonly down: string[];
  /** Hold a key down; returns its detail, or null if it is off this keyboard (or already down). */
  press(note: PianoNote | number, opts?: { velocity?: number }): PianoKey | null;
  release(note: PianoNote | number): void;
  /** Press and let go: one note or a chord, for `duration` seconds. */
  play(notes: PianoNote | number | (PianoNote | number)[], opts?: { duration?: number; velocity?: number }): PianoKey[];
  loadSound(): Promise<boolean>;
  readonly scene: unknown;
}
export class TkPianoKeys extends HTMLElement {}
export function definePianoKeys(reg?: CustomElementRegistry): boolean;
export const DEFAULT_BINDING: PianoBinding;
export function noteName(midi: number): string;
export function parseNote(name: string): number | null;
export function isBlack(midi: number): boolean;
export function keyX(midi: number): number;
declare global {
  interface HTMLElementEventMap { "tk-piano-note": CustomEvent<PianoKey>; "tk-piano-release": CustomEvent<PianoKey> }
}
