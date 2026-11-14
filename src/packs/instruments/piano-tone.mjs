/* TokenKit instruments pack: the piano's key map and its sampler.
   Pure numbers first (where every key sits on a real keyboard, which keys are black, the
   standard keyboard sizes), then a sampler over real recordings: 30 notes of a Kawai
   upright, a minor third apart from A0 to C8, so any key is a recording shifted by at most
   a semitone. Nothing here is synthesized; the recordings are CC0 (piano-samples/LICENSE, FreePats
   "Upright Piano KW", recorded by Gonzalo and Roberto).

     parseNote('C4')          // 60
     keyX(61)                 // where C#4's centre sits, in mm from A0's left edge
     const s = createPianoSampler(); await s.load(); const v = await s.play(60); v.stop();

   Notes are named with sharps ("C#4"); flats ("Db4") are read too. MIDI 60 = C4 = middle C. */
import { createSampler, nearestRoot, noteName, spokenName, frequency, parseNote } from './sampler.mjs';

export { noteName, spokenName, frequency, parseNote };

/* A modern keyboard, in millimetres: an octave spans 164.5 (seven 23.5 mm white keys);
   black keys are 13.7 wide and 95 long, standing 12.7 above the whites. The black keys
   split their groups evenly: C# and D# sit in fifths of C..E, F# G# A# in sevenths of F..B. */
export const WHITE_W = 23.5, WHITE_L = 150, BLACK_W = 13.7, BLACK_L = 95, BLACK_H = 12.7;
const OCTAVE = 7 * WHITE_W;
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
const BLACK_CENTRE = { 1: (1.5 / 5) * 3 * WHITE_W, 3: (3.5 / 5) * 3 * WHITE_W, 6: 3 * WHITE_W + (1.5 / 7) * 4 * WHITE_W, 8: 3 * WHITE_W + (3.5 / 7) * 4 * WHITE_W, 10: 3 * WHITE_W + (5.5 / 7) * 4 * WHITE_W };
const A0 = 21;

/** Is this key black? */
export const isBlack = (midi) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
/** A key's centre, in mm from the left edge of A0 (an 88-key piano's lowest key). */
export function keyX(midi) {
  const pc = ((midi % 12) + 12) % 12, oct = Math.floor(midi / 12);
  const local = isBlack(midi) ? BLACK_CENTRE[pc] : WHITE_PC.indexOf(pc) * WHITE_W + WHITE_W / 2;
  return oct * OCTAVE + local - (Math.floor(A0 / 12) * OCTAVE + 5 * WHITE_W);
}
/** The usual keyboard sizes, lowest and highest key. */
export const KEYBOARDS = { 25: [48, 72], 37: [48, 84], 49: [36, 84], 61: [36, 96], 76: [28, 103], 88: [21, 108] };
/** "C3-C5", "25" or "88" -> [low, high] MIDI; a range must start and end on white keys. */
export function parseRange(keys, range) {
  const m = /^\s*([^\s-]+)\s*-\s*([^\s-]+)\s*$/.exec(String(range ?? ''));
  if (m) {
    const lo = parseNote(m[1]), hi = parseNote(m[2]);
    if (lo != null && hi != null && hi - lo >= 4 && !isBlack(lo) && !isBlack(hi)) return [Math.max(A0, lo), Math.min(108, hi)];
  }
  return KEYBOARDS[parseInt(keys, 10)] || KEYBOARDS[25];
}

/** The gamepad's default binding: a C major pentatonic around middle C, and a sustain pedal. */
export const DEFAULT_BINDING = { west: 'C4', south: 'D4', east: 'E4', north: 'G4', lb: 'A4', rb: 'C5', rt: 'sustain' };
/** Which notes a controller state (or a list of note names) holds down, given a binding. */
export function heldBy(pressed, binding = DEFAULT_BINDING) {
  const notes = new Set(); let sustain = false;
  for (const p of pressed || []) {
    const v = binding[p] ?? p;
    if (v === 'sustain') sustain = true; else { const m = parseNote(v); if (m != null) notes.add(m); }
  }
  return { notes, sustain };
}

/** The recordings shipped in piano-samples/, by MIDI note. */
export const SAMPLE_ROOTS = { 21: 'a0', 24: 'c1', 27: 'eb1', 30: 'gb1', 33: 'a1', 36: 'c2', 39: 'eb2', 42: 'gb2', 45: 'a2', 48: 'c3', 51: 'eb3', 54: 'gb3', 57: 'a3', 60: 'c4', 63: 'eb4', 66: 'gb4', 69: 'a4', 72: 'c5', 75: 'eb5', 78: 'gb5', 81: 'a5', 84: 'c6', 87: 'eb6', 90: 'gb6', 93: 'a6', 96: 'c7', 99: 'eb7', 102: 'gb7', 105: 'a7', 108: 'c8' };
/* One literal URL per recording, so bundlers (Vite, esbuild, webpack) find and ship each
   file, and a plain browser resolves it beside this module. */
const SAMPLE_URLS = {
  a0: () => new URL('./piano-samples/a0.m4a', import.meta.url),
  c1: () => new URL('./piano-samples/c1.m4a', import.meta.url),
  eb1: () => new URL('./piano-samples/eb1.m4a', import.meta.url),
  gb1: () => new URL('./piano-samples/gb1.m4a', import.meta.url),
  a1: () => new URL('./piano-samples/a1.m4a', import.meta.url),
  c2: () => new URL('./piano-samples/c2.m4a', import.meta.url),
  eb2: () => new URL('./piano-samples/eb2.m4a', import.meta.url),
  gb2: () => new URL('./piano-samples/gb2.m4a', import.meta.url),
  a2: () => new URL('./piano-samples/a2.m4a', import.meta.url),
  c3: () => new URL('./piano-samples/c3.m4a', import.meta.url),
  eb3: () => new URL('./piano-samples/eb3.m4a', import.meta.url),
  gb3: () => new URL('./piano-samples/gb3.m4a', import.meta.url),
  a3: () => new URL('./piano-samples/a3.m4a', import.meta.url),
  c4: () => new URL('./piano-samples/c4.m4a', import.meta.url),
  eb4: () => new URL('./piano-samples/eb4.m4a', import.meta.url),
  gb4: () => new URL('./piano-samples/gb4.m4a', import.meta.url),
  a4: () => new URL('./piano-samples/a4.m4a', import.meta.url),
  c5: () => new URL('./piano-samples/c5.m4a', import.meta.url),
  eb5: () => new URL('./piano-samples/eb5.m4a', import.meta.url),
  gb5: () => new URL('./piano-samples/gb5.m4a', import.meta.url),
  a5: () => new URL('./piano-samples/a5.m4a', import.meta.url),
  c6: () => new URL('./piano-samples/c6.m4a', import.meta.url),
  eb6: () => new URL('./piano-samples/eb6.m4a', import.meta.url),
  gb6: () => new URL('./piano-samples/gb6.m4a', import.meta.url),
  a6: () => new URL('./piano-samples/a6.m4a', import.meta.url),
  c7: () => new URL('./piano-samples/c7.m4a', import.meta.url),
  eb7: () => new URL('./piano-samples/eb7.m4a', import.meta.url),
  gb7: () => new URL('./piano-samples/gb7.m4a', import.meta.url),
  a7: () => new URL('./piano-samples/a7.m4a', import.meta.url),
  c8: () => new URL('./piano-samples/c8.m4a', import.meta.url),
};
/** The recording to play for a key and the rate that tunes it: { file, root, rate }. */
export const nearestSample = (midi) => nearestRoot(SAMPLE_ROOTS, midi);

/* The sampler (sampler.mjs): each key is its own voice, so re-striking a key stops its last
   note, and letting go damps it as a piano's damper does. `base` (optional) serves the
   recordings from another folder, e.g. a CDN, by file name. */
export const DAMPER = 0.09;
export function createPianoSampler({ base = null, context = null, volume = 0.8 } = {}) {
  const s = createSampler({ roots: SAMPLE_ROOTS, urls: SAMPLE_URLS, base, context, volume, release: DAMPER });
  return {
    get context() { return s.context; },
    get loaded() { return s.loaded; },
    /** Fetch and decode every recording (about 1.3 MB). Safe to call more than once. */
    load: () => s.load(),
    /** Strike a key. Resolves to its voice: voice.stop() lets the key go. */
    play: (midi, { velocity = 0.8, when = 0 } = {}) => s.play(midi, { voice: midi, velocity, when }),
    /** Damp one key, or all of them. */
    stop: (midi) => s.stop(midi ?? undefined),
    set volume(v) { s.volume = v; },
    get volume() { return s.volume; },
  };
}
