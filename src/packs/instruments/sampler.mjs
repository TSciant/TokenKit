/* TokenKit instruments pack: a small Web Audio sampler over real recordings, shared by the
   instruments (guitar-tone.mjs, piano-tone.mjs). Each note plays the nearest recording,
   shifted in pitch by its playback rate. Nothing here is synthesized.

     const s = createSampler({ roots: { 60: 'c4' }, urls: { c4: () => new URL('./c4.m4a', import.meta.url) } });
     await s.load(); const v = await s.play(62, { voice: 'string-1' }); v.stop();

   `voice` names who is playing a note (a string, a key): a new note on the same voice
   stops the last one, as a real string or a re-struck key does. */

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SPOKEN = { 'C#': 'C sharp', 'D#': 'D sharp', 'F#': 'F sharp', 'G#': 'G sharp', 'A#': 'A sharp' };
const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "A2", "F#4" (MIDI 60 = C4). */
export function noteName(midi) { return NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1); }
/** "A 2", "F sharp 4": for screen readers, which read "F#" as "F number". */
export function spokenName(midi) { const n = NAMES[((midi % 12) + 12) % 12]; return `${SPOKEN[n] || n} ${Math.floor(midi / 12) - 1}`; }
/** Frequency in Hz (A4 = 440). */
export const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
/** "C4", "F#3", "Bb2", "c-1" -> MIDI number; anything else -> null. */
export function parseNote(name) {
  const m = /^([A-Ga-g])(#|b|♯|♭)?(-?\d)$/.exec(String(name ?? '').trim()); if (!m) return null;
  const midi = (+m[3] + 1) * 12 + STEP[m[1].toUpperCase()] + (m[2] === '#' || m[2] === '♯' ? 1 : m[2] ? -1 : 0);
  return midi >= 0 && midi <= 127 ? midi : null;
}

/** The recording to play for a note and the rate that tunes it: { file, root, rate }. */
export function nearestRoot(roots, midi) {
  let root = NaN;
  for (const r of Object.keys(roots).map(Number)) if (!(Math.abs(r - midi) >= Math.abs(root - midi))) root = r;
  return { file: roots[root], root, rate: 2 ** ((midi - root) / 12) };
}

/* One AudioContext, made on first use (browsers only allow sound after a user gesture).
   `base` (optional) serves the recordings from another folder, e.g. a CDN, by file name. */
export function createSampler({ roots, urls, base = null, ext = 'm4a', context = null, volume = 0.8, release = 0.03 }) {
  let ctx = context, out = null, loading = null;
  const buffers = new Map(), pending = new Map(), voices = new Map();
  const ensure = () => {
    if (!ctx) { const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
    if (!out) { out = ctx.createGain(); out.gain.value = volume; out.connect(ctx.destination); }
    return ctx;
  };
  function fetchOne(file) {
    if (buffers.has(file)) return Promise.resolve(buffers.get(file));
    if (!pending.has(file)) pending.set(file, (async () => {
      const res = await fetch(base ? new URL(`${file}.${ext}`, base) : urls[file]());
      if (!res.ok) throw new Error(`sample ${file}: HTTP ${res.status}`);
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      buffers.set(file, buf); return buf;
    })().finally(() => pending.delete(file)));
    return pending.get(file);
  }
  const files = () => [...new Set(Object.values(roots))];
  return {
    get context() { return ctx; },
    get loaded() { return buffers.size; },
    get total() { return files().length; },
    /** Fetch and decode every recording. Safe to call more than once. */
    load() {
      if (!ensure()) return Promise.resolve(false);
      return (loading ||= Promise.all(files().map(fetchOne)).then(() => true));
    },
    /** Play a note. Loads its recording on first use if load() was not awaited. */
    async play(midi, { voice = null, velocity = 0.8, when = 0 } = {}) {
      if (!ensure()) return null;
      if (ctx.state === 'suspended') await ctx.resume();
      const { file, rate } = nearestRoot(roots, midi);
      const buf = await fetchOne(file);
      const t = Math.max(ctx.currentTime, when || 0);
      if (voice != null) voices.get(voice)?.stop(t);
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
      const g = ctx.createGain(); g.gain.value = Math.max(0, Math.min(1, velocity));
      src.connect(g).connect(out); src.start(t);
      let stopped = false;
      const v = {
        /** Damp it; `fade` is the release's time constant in seconds. */
        stop(at = ctx.currentTime, fade = release) { if (stopped) return; stopped = true; g.gain.setTargetAtTime(0, at, fade); src.stop(at + fade * 7); },
      };
      if (voice != null) voices.set(voice, v);
      src.onended = () => { if (voices.get(voice) === v) voices.delete(voice); g.disconnect(); };
      return v;
    },
    /** Damp one voice, or all of them. */
    stop(voice, fade) {
      if (voice != null) { voices.get(voice)?.stop(undefined, fade); voices.delete(voice); }
      else { for (const v of voices.values()) v.stop(undefined, fade); voices.clear(); }
    },
    set volume(v) { volume = v; if (out) out.gain.value = v; },
    get volume() { return volume; },
  };
}
