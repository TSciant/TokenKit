/* Types for guitar-tone.mjs (plain JS, so it runs untranspiled in the game). */
/** "s{string}f{fret}": string 1 (high e) .. 6 (low E), fret 0 = open. */
export type GuitarPosition = `s${1 | 2 | 3 | 4 | 5 | 6}f${number}`;
export type GuitarBinding = Partial<Record<"fret1" | "fret2" | "fret3" | "fret4" | "fret5", GuitarPosition>>;
export type GuitarNote = { string: number; fret: number; midi: number; name: string; frequency: number };
export type GuitarVoice = { stop(at?: number): void };
export type GuitarSampler = {
  readonly context: AudioContext | null;
  readonly loaded: number;
  load(): Promise<boolean>;
  play(midi: number, opts?: { string?: number; velocity?: number; when?: number }): Promise<GuitarVoice | null>;
  stop(string?: number): void;
  volume: number;
};
export const STANDARD_TUNING: (number | null)[];
export const SCALE_MM: number;
export const SAMPLE_ROOTS: Record<number, string>;
export const DEFAULT_BINDING: GuitarBinding;
export function noteAt(string: number, fret: number, tuning?: (number | null)[]): number | null;
export function noteName(midi: number): string;
export function spokenName(midi: number): string;
export function frequency(midi: number): number;
export function fretDistance(n: number, scale?: number): number;
export function nearestSample(midi: number): { file: string; root: number; rate: number };
export function posName(string: number, fret: number): GuitarPosition;
export function parsePos(name: string): { string: number; fret: number } | null;
export function frettedBy(pressed: string[] | undefined, binding?: GuitarBinding): GuitarPosition[];
export function createGuitarSampler(opts?: { base?: URL | string; context?: AudioContext | null; volume?: number }): GuitarSampler;
