/* Types for sampler.mjs. */
export type SamplerVoice = { stop(at?: number, fade?: number): void };
export type Sampler = {
  readonly context: AudioContext | null;
  readonly loaded: number;
  readonly total: number;
  load(): Promise<boolean>;
  play(midi: number, opts?: { voice?: unknown; velocity?: number; when?: number }): Promise<SamplerVoice | null>;
  stop(voice?: unknown, fade?: number): void;
  volume: number;
};
export function noteName(midi: number): string;
export function spokenName(midi: number): string;
export function frequency(midi: number): number;
export function parseNote(name: string): number | null;
export function nearestRoot(roots: Record<number, string>, midi: number): { file: string; root: number; rate: number };
export function createSampler(opts: { roots: Record<number, string>; urls: Record<string, () => URL>; base?: URL | string | null; ext?: string; context?: AudioContext | null; volume?: number; release?: number }): Sampler;
