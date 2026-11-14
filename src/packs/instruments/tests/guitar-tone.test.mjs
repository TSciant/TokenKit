/* TokenKit instruments pack: the guitar's tone map. Every string and fret lands on its note in
   standard tuning, every note has a real recording within a semitone, and the neck's fret
   wires sit where a 25.5" scale puts them.
   Run: node --test src/packs/instruments/tests/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { STANDARD_TUNING, SAMPLE_ROOTS, DEFAULT_BINDING, noteAt, noteName, spokenName, frequency, fretDistance, nearestSample, posName, parsePos, frettedBy } from '../guitar-tone.mjs';

const SAMPLES = fileURLToPath(new URL('../guitar-samples/', import.meta.url));

test('open strings are E A D G B E, low to high', () => {
  assert.deepEqual([6, 5, 4, 3, 2, 1].map((s) => noteName(noteAt(s, 0))), ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
});

test('frets climb a semitone each; the 5th fret matches the next string (but G to B is the 4th)', () => {
  assert.equal(noteName(noteAt(6, 5)), 'A2');
  for (const s of [6, 5, 4, 2]) assert.equal(noteAt(s, 5), noteAt(s - 1, 0), `string ${s} fret 5`);
  assert.equal(noteAt(3, 4), noteAt(2, 0), 'G string fret 4 = open B');
  assert.equal(noteAt(1, 12), noteAt(1, 0) + 12, 'the 12th fret is the octave');
  assert.equal(noteAt(7, 0), null); assert.equal(noteAt(1, -1), null);
});

test('names, spoken names and pitch', () => {
  assert.equal(noteName(66), 'F#4'); assert.equal(spokenName(66), 'F sharp 4');
  assert.equal(frequency(69), 440);
  assert.ok(Math.abs(frequency(40) - 82.41) < 0.01, 'low E is 82.41 Hz');
});

test('fret wires: the 12th is half the scale, each one a twelfth root of two closer', () => {
  assert.equal(fretDistance(0), 0);
  assert.ok(Math.abs(fretDistance(12) - 324) < 1e-9);
  assert.ok(Math.abs(fretDistance(1) - 36.37) < 0.01, 'first fret about 36.4 mm from the nut');
  for (let n = 1; n < 22; n++) assert.ok(fretDistance(n + 1) - fretDistance(n) < fretDistance(n) - fretDistance(n - 1), 'spaces shrink up the neck');
});

test('every note on a 22-fret neck has a recording within a semitone, and the file is there', () => {
  for (let s = 1; s <= 6; s++) for (let f = 0; f <= 22; f++) {
    const m = noteAt(s, f), { file, root, rate } = nearestSample(m);
    assert.ok(Math.abs(m - root) <= 1, `${noteName(m)} is ${m - root} semitones from ${file}`);
    assert.ok(Math.abs(rate - 2 ** ((m - root) / 12)) < 1e-12);
  }
  for (const f of Object.values(SAMPLE_ROOTS)) {
    const p = SAMPLES + f + '.m4a';
    assert.ok(existsSync(p), `${f}.m4a shipped`); assert.ok(statSync(p).size < 80_000, `${f}.m4a stays small`);
  }
  assert.match(readFileSync(SAMPLES + 'LICENSE', 'utf8'), /CC0 1\.0 Universal/);
});

test('positions round-trip, and junk is refused', () => {
  assert.equal(posName(6, 5), 's6f5'); assert.deepEqual(parsePos('s6f5'), { string: 6, fret: 5 });
  for (const bad of ['s7f1', 's0f2', 'x', '', 's1f', 's1f123', null, undefined]) assert.equal(parsePos(bad), null, String(bad));
});

test('the controller binding frets an A minor pentatonic box; strum and unknown buttons fret nothing', () => {
  const notes = ['fret1', 'fret2', 'fret3', 'fret4', 'fret5'].map((b) => { const { string, fret } = parsePos(DEFAULT_BINDING[b]); return noteName(noteAt(string, fret)); });
  assert.deepEqual(notes, ['A2', 'C3', 'D3', 'E3', 'G3']);
  assert.deepEqual(frettedBy(['fret1', 'strum', 'south', 'fret1']), ['s6f5']);
  assert.deepEqual(frettedBy(['fret1'], { fret1: 'nope' }), []);
  assert.deepEqual(frettedBy(undefined), []);
});

test('the tuning table is players\' numbering', () => {
  assert.equal(STANDARD_TUNING.length, 7); assert.equal(STANDARD_TUNING[1], 64); assert.equal(STANDARD_TUNING[6], 40);
});
