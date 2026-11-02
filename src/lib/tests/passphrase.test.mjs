import { test } from "node:test";
import assert from "node:assert/strict";
import { passphrase, randomBelow } from "../passphrase.mjs";

const WORDS = Array.from({ length: 40 }, (_, i) => `Word${i}`);

test("three different words and a 4-digit number, joined", () => {
  const p = passphrase({ words: WORDS });
  const parts = p.phrase.split("-");
  assert.equal(parts.length, 4);
  assert.equal(new Set(parts.slice(0, 3)).size, 3);
  assert.match(parts[3], /^[1-9]\d{3}$/);
});
test("strength is reported from the list and the pattern", () => {
  assert.equal(passphrase({ words: WORDS }).bits, Math.round(Math.log2(40 * 39 * 38 * 9000) * 10) / 10);
  assert.ok(passphrase({ words: WORDS, count: 4 }).bits > 33);
});
test("unbiased picks: every value shows up", () => {
  const seen = new Set(); for (let i = 0; i < 2000; i++) seen.add(randomBelow(7));
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4, 5, 6]);
});
test("refuses lists too short to be safe to pick from", () => {
  assert.throws(() => passphrase({ words: ["one"] }));
  assert.throws(() => passphrase({ words: ["a", "b"], count: 3 }));
});
