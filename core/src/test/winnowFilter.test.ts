import test from "ava";
import { WinnowFilter } from "../hashing/winnowFilter.js";

test("Winnow on comparable files", t => {
  const textA = "abcdefg".split("");
  const textB = "bcdabcefg".split("");
  const k = 2;

  const filter = new WinnowFilter(k, 2);
  const hashes: Map<number, number> = new Map();
  // Build a Map from hashing to position
  for (const { hash, start: posA } of filter.fingerprints(textA)) {
    hashes.set(hash, posA);
  }

  let overlap = 0;
  for (const { hash, start: posB } of filter.fingerprints(textB)) {
    if (hashes.has(hash)) {
      ++overlap;
      const posA = hashes.get(hash) as number;
      // This test assumes no hashcollisions
      t.deepEqual(textA.slice(posA, posA + k), textB.slice(posB, posB + k));
    }
  }
  // For each equal triplet there has to be a common winnowed hashing
  t.true(overlap >= 3);
});

test("no hashes for text shorter than k", t => {
  const text = "abcd".split("");
  const filter = new WinnowFilter(5, 1);
  const hashes = [];

  for (const hash of filter.fingerprints(text)) {
    hashes.push(hash);
  }
  t.is(0, hashes.length);
});

test("1 hashing for text length of k", t => {
  const text = "abcde".split("");
  const filter = new WinnowFilter(5, 1);
  const hashes = [];

  for (const hash of filter.fingerprints(text)) {
    hashes.push(hash);
  }
  t.is(1, hashes.length);
});

test("maximum gap between hashing positions is window size", t => {
  const text = "This is a slightly longer text to test multiple hashing values.".split("");
  const windowSize = 3;
  const winnowFilter = new WinnowFilter(5, windowSize);
  let previousPos = 0;

  for (const { start } of winnowFilter.fingerprints(text)) {
    t.true(start - previousPos <= windowSize);
    previousPos = start;
  }
});
