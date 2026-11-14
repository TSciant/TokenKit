/* Types for piano-tone.mjs (plain JS, so it runs untranspiled in the game). */
/** A note name with a sharp or flat and an octave: "C4" (middle C), "F#3", "Bb2". */
export type PianoNote = string;
/** Gamepad button -> note name, or "sustain" for the pedal. */
export type PianoBinding = Partial<Record<string, PianoNote | "sustain">>;
export type PianoKey = { midi: number; name: string; frequency: number; velocity?: number };
export type PianoVoice = { stop(at?: number, fade?: number): void };
export type PianoSampler = {
  readonly context: AudioContext | null;
  readonly loaded: number;
  load(): Promise<boolean>;
  play(midi: number, opts?: { velocity?: number; when?: number }): Promise<PianoVoice | null>;
  stop(midi?: number): void;
  volume: number;
};
export const WHITE_W: number;
export const WHITE_L: number;
export const BLACK_W: number;
export const BLACK_L: number;
export const BLACK_H: number;
export const DAMPER: number;
export const KEYBOARDS: Record<25 | 37 | 49 | 61 | 76 | 88, [number, number]>;
export const SAMPLE_ROOTS: Record<number, string>;
export const DEFAULT_BINDING: PianoBinding;
export function isBlack(midi: number): boolean;
export function keyX(midi: number): number;
export function parseRange(keys?: string | number | null, range?: string | null): [number, number];
export function heldBy(pressed: string[] | undefined, binding?: PianoBinding): { notes: Set<number>; sustain: boolean };
export function noteName(midi: number): string;
export function spokenName(midi: number): string;
export function frequency(midi: number): number;
export function parseNote(name: string): number | null;
export function nearestSample(midi: number): { file: string; root: number; rate: number };
export function createPianoSampler(opts?: { base?: URL | string; context?: AudioContext | null; volume?: number }): PianoSampler;
