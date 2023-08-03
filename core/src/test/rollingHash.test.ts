import test from "ava";
import { RollingHash } from "../hashing/rollingHash.js";

test("repeating sequence should have the same hashes", t => {
  const k = 3;
  const sequence = "abcabcabc";
  const hasher =  new RollingHash(k);
  const hashes = sequence.split("").map(c => hasher.nextHash(c.charCodeAt(0)));

  t.deepEqual(hashes.slice(k, 2 * k), hashes.slice(2 * k, 3 * k));
});

test("prefix should not matter", t => {
  const k = 3;
  const hasher1 = new RollingHash(k);
  const hasher2 = new RollingHash(k);

  const postfix = "The Quick Brown Fox Jumps Over The Lazy Dog";
  const prefix1 = "Jived fox nymph grabs quick waltz.";
  const prefix2 = "Pack my box with five dozen liquor jugs.";

  for (let i = 0; i < prefix1.length; i++) {
    const h1 = hasher1.nextHash(prefix1.charCodeAt(i));
    const h2 = hasher2.nextHash(prefix2.charCodeAt(i));
    t.not(h1, h2, "first hashes should not be the same");
  }
  const diff = prefix2.length - prefix1.length;
  for (let i = prefix1.length; i < diff; i++) {
    hasher2.nextHash(prefix2.charCodeAt(i + prefix1.length));
  }

  const hashes1 = postfix.split("").map(c => hasher1.nextHash(c.charCodeAt(0)));
  const hashes2 = postfix.split("").map(c => hasher2.nextHash(c.charCodeAt(0)));

  t.notDeepEqual(
    hashes1.slice(0, k),
    hashes2.slice(0, k),
    "first k hashes should not be equal"
  );
  t.deepEqual(
    hashes1.slice(k),
    hashes2.slice(k),
    "all but first k hashes should be equal"
  );
});

test("hashes should be stable", t => {
  const data = "Alright, but apart from the sanitation, the medicine, " +
    "education, wine, public order, irrigation, roads, the fresh-water " +
    "system, and public health, what have the Romans ever done for us?";

  const hasher = new RollingHash(3);
  const hashes = data.split("").map(c => hasher.nextHash(c.charCodeAt(0)));
  t.snapshot(hashes);
});
