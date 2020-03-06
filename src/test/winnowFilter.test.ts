import test from "ava";
import { Readable } from "stream";
import { NoFilter } from "../lib/noFilter";
import { WinnowFilter } from "../lib/winnowFilter";

test("Winnow on comparable files", async t => {
  const textA = "abcdefg";
  const textB = "bcdabcefg";
  const k = 2;

  const filter = new WinnowFilter(k, 2);
  const hashes: Map<number, number> = new Map();
  // Build a Map from hash to position
  for await (const { hash, location: posA } of filter.hashesFromString(textA)) {
    hashes.set(hash, posA);
  }

  let overlap = 0;
  for await (const { hash, location: posB } of filter.hashesFromString(textB)) {
    if (hashes.has(hash)) {
      ++overlap;
      const posA = hashes.get(hash) as number;
      // This test assumes no hashcollisions
      t.is(textA.slice(posA, posA + k), textB.slice(posB, posB + k));
    }
  }
  // For each equal triplet there has to be a common winnowed hash
  t.true(overlap >= 3);
});

test("no hashes for text shorter than k", async t => {
  const text = "abcd";
  const filter = new WinnowFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(0, hashes.length);
});

test("1 hash for text length of k", async t => {
  const text = "abcde";
  const filter = new WinnowFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(1, hashes.length);
});

test("maximum gap between hash positions is window size", async t => {
  const text = "This is a slightly longer text to test multiple hash values.";
  const windowSize = 3;
  const winnowFilter = new WinnowFilter(5, windowSize);
  let previousPos = 0;

  for await (const { location } of winnowFilter.hashesFromString(text)) {
    t.true(location - previousPos <= windowSize);
    previousPos = location;
  }
});

test("winnow 1 and noFilter create same result", async t => {
  const text = "This is a slightly longer text to test multiple hash values.";
  const noFilter = new NoFilter(5);
  const winnowFilter = new WinnowFilter(5, 1);
  const noHashes = [];
  const winnowHashes = [];

  for await (const hash of noFilter.hashesFromString(text)) {
    noHashes.push(hash);
  }
  for await (const hash of winnowFilter.hashesFromString(text)) {
    winnowHashes.push(hash);
  }
  t.deepEqual(noHashes, winnowHashes);
});

test("strings or buffers doesn't matter", async t => {
  const text = "This is a slightly longer text to compare strings with " +
    "buffers and test multiple hash values.";

  const winnowFilter = new WinnowFilter(5, 4);

  const stringHashes = [];
  for await (const hash of winnowFilter.hashesFromString(text)) {
    stringHashes.push(hash);
  }

  const bufferHashes = [];
  const buffer = Buffer.from(text);
  for await (const hash of winnowFilter.hashes(
    new (class extends Readable {
      public _read(): void {
        this.push(buffer);
        this.push(null);
      }
    })({ objectMode: false })
  )) {
    bufferHashes.push(hash);
  }

  t.deepEqual(bufferHashes, stringHashes);
});
