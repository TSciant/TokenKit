/* Memorable passwords from a word list you choose (Tony, 2026-11-02: "a generator of XU basketball player names and
   numbers easy for him to remember, but hard to fake. like for elderly i think custom password generators could be super
   helpful"). Words from something the person knows (a team's players, a street's houses, a family's pets) are easy to
   remember; picking them at random, with a number, makes them hard to guess. The randomness is the browser's or Node's
   crypto, never Math.random, and each pick is unbiased.

     passphrase({ words: ["Larkin", "West", "Grant", ...] })  → { phrase: "West-Larkin-Grant-4718", bits: 29.1 }

   `bits` is the strength against someone who knows the list and the pattern (assume they do): log2 of the number of
   phrases the pattern can make. With 40 words, three of them and a 4-digit number is about 29 bits; four words, about
   34. That's fine behind a sign-in that limits tries, not for encrypting files. Show `bits` honestly; don't oversell. */

const cryptoObj = () => globalThis.crypto;

/* A uniform whole number in [0, n), by rejection, so no value is likelier than another. */
export function randomBelow(n, rand = cryptoObj()) {
  if (!Number.isInteger(n) || n < 1 || n > 2 ** 32) throw new RangeError("n must be a whole number from 1 to 2^32");
  const limit = Math.floor(2 ** 32 / n) * n, buf = new Uint32Array(1);
  for (;;) { rand.getRandomValues(buf); if (buf[0] < limit) return buf[0] % n; }
}

export function passphrase({ words, count = 3, digits = 4, separator = "-", unique = true, rand = cryptoObj() } = {}) {
  const list = [...new Set((words ?? []).map((w) => String(w).trim()).filter(Boolean))];
  if (list.length < 2) throw new Error("passphrase needs a list of at least two words");
  if (unique && count > list.length) throw new Error("more words asked for than the list has");
  const picked = [], pool = [...list];
  for (let i = 0; i < count; i++) { const k = randomBelow(pool.length, rand); picked.push(pool[k]); if (unique) pool.splice(k, 1); }
  const lo = digits > 0 ? 10 ** (digits - 1) : 0, span = digits > 0 ? 9 * lo : 0;
  const number = digits > 0 ? String(lo + randomBelow(span, rand)) : "";
  let combos = 1;
  for (let i = 0; i < count; i++) combos *= unique ? list.length - i : list.length;
  if (span) combos *= span;
  return { phrase: [...picked, ...(number ? [number] : [])].join(separator), words: picked, number, bits: Math.round(Math.log2(combos) * 10) / 10 };
}
