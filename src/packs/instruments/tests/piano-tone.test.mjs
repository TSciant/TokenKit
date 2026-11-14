/* TokenKit instruments pack: the piano's key map. Every key sits where a real keyboard puts it,
   every key from A0 to C8 has a real recording within a semitone, and the binding holds the
   notes and pedal it says. Run: npm run test:instruments */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WHITE_W, BLACK_W, KEYBOARDS, SAMPLE_ROOTS, DEFAULT_BINDING, isBlack, keyX, parseRange, heldBy, noteName, spokenName, parseNote, nearestSample } from '../piano-tone.mjs';
import { nearestSample as guitarSample } from '../guitar-tone.mjs';

const SAMPLES = fileURLToPath(new URL('../piano-samples/', import.meta.url));

test('note names: middle C is C4 = 60, flats read as their sharps, junk refused', () => {
  assert.equal(parseNote('C4'), 60); assert.equal(parseNote('A4'), 69); assert.equal(parseNote('A0'), 21); assert.equal(parseNote('C8'), 108);
  assert.equal(parseNote('Db4'), parseNote('C#4')); assert.equal(parseNote('c#4'), 61); assert.equal(parseNote('B#3'), 60);
  for (const bad of ['H4', 'C', '4', 'C44', '', null, undefined, 'C#b4']) assert.equal(parseNote(bad), null, String(bad));
  assert.equal(noteName(61), 'C#4'); assert.equal(spokenName(70), 'A sharp 4');
});

test('an 88-key piano has 52 white keys and 36 black, and is 1222 mm of keys', () => {
  const [lo, hi] = KEYBOARDS[88]; let w = 0, b = 0;
  for (let m = lo; m <= hi; m++) isBlack(m) ? b++ : w++;
  assert.equal(w, 52); assert.equal(b, 36);
  assert.ok(Math.abs(keyX(hi) + WHITE_W / 2 - (keyX(lo) - WHITE_W / 2) - 52 * WHITE_W) < 1e-9);
});

test('white keys sit 23.5 mm apart; an octave is 164.5 mm', () => {
  for (let m = 21; m < 108; m++) if (!isBlack(m)) { let n = m + 1; while (isBlack(n)) n++; assert.ok(Math.abs(keyX(n) - keyX(m) - WHITE_W) < 1e-9, noteName(m)); }
  assert.ok(Math.abs(keyX(72) - keyX(60) - 164.5) < 1e-9);
});

test('black keys sit between their whites, off-centre as a real keyboard has them, and never overlap', () => {
  for (let m = 22; m < 108; m++) if (isBlack(m)) {
    const l = keyX(m - 1), r = keyX(m + 1);
    assert.ok(keyX(m) - BLACK_W / 2 > l - WHITE_W / 2 && keyX(m) + BLACK_W / 2 < r + WHITE_W / 2, noteName(m));
    assert.ok(Math.abs(keyX(m) - (l + r) / 2) < 5, `${noteName(m)} near its gap`);
  }
  // C# leans left of the C-D gap, D# right of D-E; G# is dead centre
  assert.ok(keyX(61) < (keyX(60) + keyX(62)) / 2); assert.ok(keyX(63) > (keyX(62) + keyX(64)) / 2);
  assert.ok(Math.abs(keyX(68) - (keyX(67) + keyX(69)) / 2) < 1e-9);
  const gaps = []; for (let m = 61; m < 73; m++) if (isBlack(m)) { let n = m + 1; while (!isBlack(n)) n++; gaps.push(keyX(n) - keyX(m) - BLACK_W); }
  assert.ok(Math.min(...gaps) > 0, 'room between black keys');
});

test('keyboard sizes and ranges', () => {
  for (const [n, [lo, hi]] of Object.entries(KEYBOARDS)) assert.equal(hi - lo + 1, +n, `${n} keys`);
  assert.deepEqual(parseRange('25'), [48, 72]); assert.deepEqual(parseRange(88), [21, 108]); assert.deepEqual(parseRange('13'), [48, 72]);
  assert.deepEqual(parseRange(25, 'F3-F5'), [53, 77]);
  assert.deepEqual(parseRange(25, 'F#3-F5'), [48, 72], 'a range must start on a white key');
  assert.deepEqual(parseRange(25, 'C-1-C9'), [48, 72], 'junk falls back to keys');
  assert.deepEqual(parseRange(25, 'G0-C9'), [21, 108], 'clamped to a piano');
});

test('every key A0..C8 has a recording within a semitone, and the file is there', () => {
  for (let m = 21; m <= 108; m++) { const { file, root, rate } = nearestSample(m); assert.ok(Math.abs(m - root) <= 1, `${noteName(m)} from ${file}`); assert.ok(Math.abs(rate - 2 ** ((m - root) / 12)) < 1e-12); }
  let total = 0;
  for (const f of Object.values(SAMPLE_ROOTS)) { const p = SAMPLES + f + '.m4a'; assert.ok(existsSync(p), `${f}.m4a shipped`); const sz = statSync(p).size; assert.ok(sz < 80_000, `${f}.m4a stays small`); total += sz; }
  assert.ok(total < 1_500_000, 'the whole piano under 1.5 MB');
  assert.match(readFileSync(SAMPLES + 'LICENSE', 'utf8'), /CC0 1\.0 Universal/);
});

test('the shared sampler still finds the guitar\'s recordings', () => {
  assert.deepEqual(guitarSample(45), { file: 'a2', root: 45, rate: 1 });
  assert.equal(guitarSample(46).file, 'a2'); assert.equal(guitarSample(41).file, 'e2');
});

test('the gamepad binding holds a C major pentatonic and the pedal; note names pass straight through', () => {
  const { notes, sustain } = heldBy(['west', 'south', 'east', 'north', 'lb', 'rb', 'rt']);
  assert.deepEqual([...notes].map(noteName), ['C4', 'D4', 'E4', 'G4', 'A4', 'C5']); assert.equal(sustain, true);
  assert.deepEqual([...heldBy(['C4', 'Eb4', 'nope']).notes], [60, 63]);
  assert.equal(heldBy(undefined).notes.size, 0); assert.equal(heldBy(['rt'], { rt: 'C4' }).sustain, false);
  assert.equal(DEFAULT_BINDING.rt, 'sustain');
});
