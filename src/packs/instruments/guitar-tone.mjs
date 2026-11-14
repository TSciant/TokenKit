/* TokenKit instruments pack: the guitar's tone map and its sampler.
   Pure numbers first (tuning, fret positions, note names, which recording to play), then a
   small Web Audio sampler over real recordings: 17 notes of an Epiphone electric, a minor
   third apart, so any note is a recording shifted by at most a semitone. Nothing here is
   synthesized; the recordings are CC0 (guitar-samples/LICENSE, Karoryfer "Emily" guitar,
   played by D. Smolken).

     noteAt(6, 5)            // 45: low E string, 5th fret = A2
     noteName(45)            // "A2"
     const s = createGuitarSampler(); await s.load(); s.play(45, { string: 6 });

   Strings are numbered as players number them: 1 is the high e, 6 the low E. */

import { createSampler, nearestRoot, noteName, spokenName, frequency } from './sampler.mjs';

export { noteName, spokenName, frequency };

/** Standard tuning as MIDI notes, index = string number (1 high e .. 6 low E). */
export const STANDARD_TUNING = [null, 64, 59, 55, 50, 45, 40];
/** A Fender-length scale in millimetres (25.5"). */
export const SCALE_MM = 648;
/** The recordings shipped in guitar-samples/, by MIDI note. */
export const SAMPLE_ROOTS = { 40: 'e2', 42: 'gb2', 45: 'a2', 48: 'c3', 51: 'eb3', 54: 'gb3', 57: 'a3', 60: 'c4', 63: 'eb4', 66: 'gb4', 69: 'a4', 72: 'c5', 75: 'eb5', 78: 'gb5', 81: 'a5', 84: 'c6', 86: 'd6' };
/* One literal URL per recording, so bundlers (Vite, esbuild, webpack) find and ship each
   file, and a plain browser resolves it beside this module. */
const SAMPLE_URLS = {
  e2: () => new URL('./guitar-samples/e2.m4a', import.meta.url),
  gb2: () => new URL('./guitar-samples/gb2.m4a', import.meta.url),
  a2: () => new URL('./guitar-samples/a2.m4a', import.meta.url),
  c3: () => new URL('./guitar-samples/c3.m4a', import.meta.url),
  eb3: () => new URL('./guitar-samples/eb3.m4a', import.meta.url),
  gb3: () => new URL('./guitar-samples/gb3.m4a', import.meta.url),
  a3: () => new URL('./guitar-samples/a3.m4a', import.meta.url),
  c4: () => new URL('./guitar-samples/c4.m4a', import.meta.url),
  eb4: () => new URL('./guitar-samples/eb4.m4a', import.meta.url),
  gb4: () => new URL('./guitar-samples/gb4.m4a', import.meta.url),
  a4: () => new URL('./guitar-samples/a4.m4a', import.meta.url),
  c5: () => new URL('./guitar-samples/c5.m4a', import.meta.url),
  eb5: () => new URL('./guitar-samples/eb5.m4a', import.meta.url),
  gb5: () => new URL('./guitar-samples/gb5.m4a', import.meta.url),
  a5: () => new URL('./guitar-samples/a5.m4a', import.meta.url),
  c6: () => new URL('./guitar-samples/c6.m4a', import.meta.url),
  d6: () => new URL('./guitar-samples/d6.m4a', import.meta.url),
};

/** The note a string sounds at a fret (0 = open). */
export function noteAt(string, fret, tuning = STANDARD_TUNING) {
  const open = tuning[string];
  if (open == null || !(fret >= 0)) return null;
  return open + Math.round(fret);
}

/** Distance of fret n's wire from the nut, by the rule of 18 done exactly: s - s / 2^(n/12). */
export const fretDistance = (n, scale = SCALE_MM) => scale - scale / 2 ** (n / 12);

/** The recording to play for a note and the playback rate that tunes it: { file, root, rate }. */
export const nearestSample = (midi) => nearestRoot(SAMPLE_ROOTS, midi);

/** "s6f5" <-> { string: 6, fret: 5 }: a position on the neck, as highlight and state name them. */
export const posName = (string, fret) => `s${string}f${fret}`;
export function parsePos(name) { const m = /^s([1-6])f(\d{1,2})$/.exec(String(name)); return m ? { string: +m[1], fret: +m[2] } : null; }

/** The 5-fret controller's default binding: an A minor pentatonic box at the 5th fret,
    low to high, so fret1..fret5 play A C D E G. Strum plays what is held. */
export const DEFAULT_BINDING = { fret1: 's6f5', fret2: 's6f8', fret3: 's5f5', fret4: 's5f7', fret5: 's4f5' };

/** Which positions a controller state frets, given a binding. */
export function frettedBy(pressed, binding = DEFAULT_BINDING) {
  return [...new Set((pressed || []).map((b) => binding[b]).filter((p) => parsePos(p)))];
}

/* The sampler (sampler.mjs): a new note on a string stops the last one on it, as a real string does. */
/* `base` (optional) serves the recordings from another folder, e.g. a CDN, by file name. */
export function createGuitarSampler({ base = null, context = null, volume = 0.8 } = {}) {
  const s = createSampler({ roots: SAMPLE_ROOTS, urls: SAMPLE_URLS, base, context, volume });
  return {
    get context() { return s.context; },
    get loaded() { return s.loaded; },
    /** Fetch and decode every recording (about 0.6 MB). Safe to call more than once. */
    load: () => s.load(),
    /** Play a note. Loads its recording on first use if load() was not awaited. */
    play: (midi, { string = 0, velocity = 0.8, when = 0 } = {}) => s.play(midi, { voice: string || null, velocity, when }),
    /** Damp one string, or all of them. */
    stop: (string) => s.stop(string || undefined),
    set volume(v) { s.volume = v; },
    get volume() { return s.volume; },
  };
}
