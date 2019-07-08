import { Readable } from "stream";
import { HashFilter } from "../hashFilter";
import { NoFilter } from "../noFilter";
import { WinnowFilter } from "../winnowFilter";

test("Winnow on comparable files", async () => {
  const textA = "abcdefg";
  const textB = "bcdabcefg";
  const k = 2;

  const filter = new WinnowFilter(k, 2);
  const hashes: Map<number, number> = new Map();
  // Build a Map from hash to position
  for await (const [hash, posA] of filter.hashes(HashFilter.streamFromString(textA))) {
    hashes.set(hash, posA);
  }

  let overlap = 0;
  for await (const [hash, posB] of filter.hashes(HashFilter.streamFromString(textB))) {
    if (hashes.has(hash)) {
      ++overlap;
      const posA = hashes.get(hash) as number;
      // This test assumes no hashcollisions
      expect(textB.slice(posB, posB + k)).toBe(textA.slice(posA, posA + k));
    }
  }
  // For each equal triplet there has to be a common winnowed hash
  expect(overlap).toBeGreaterThanOrEqual(3);
});

test("no hashes for text shorter than k", async () => {
  const text = "abcd";
  const filter = new WinnowFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashes(HashFilter.streamFromString(text))) {
    hashes.push(hash);
  }
  expect(hashes.length).toBe(0);
});

test("1 hash for text length of k", async () => {
  const text = "abcde";
  const filter = new WinnowFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashes(HashFilter.streamFromString(text))) {
    hashes.push(hash);
  }
  expect(hashes.length).toBe(1);
});

test("maximum gap between hash positions is window size", async () => {
  const text = "This is a slightly longer text to test multiple hash values.";
  const windowSize = 3;
  const winnowFilter = new WinnowFilter(5, windowSize);
  let previousPos = 0;

  for await (const [, position] of winnowFilter.hashes(HashFilter.streamFromString(text))) {
    expect(position - previousPos).toBeLessThanOrEqual(windowSize);
    previousPos = position;
  }
});

test("winnow 1 and noFilter create same result", async () => {
  const text = "This is a slightly longer text to test multiple hash values.";
  const noFilter = new NoFilter(5);
  const winnowFilter = new WinnowFilter(5, 1);
  const noHashes = [];
  const winnowHashes = [];

  for await (const hash of noFilter.hashes(HashFilter.streamFromString(text))) {
    noHashes.push(hash);
  }
  for await (const hash of winnowFilter.hashes(HashFilter.streamFromString(text))) {
    winnowHashes.push(hash);
  }
  expect(winnowHashes).toEqual(noHashes);
});

test("strings or buffers doesn't matter", async () => {
  const text = "This is a slightly longer text to compare strings with buffers and test multiple hash values.";

  const winnowFilter = new WinnowFilter(5, 4);

  const stringHashes = [];
  for await (const hash of winnowFilter.hashes(HashFilter.streamFromString(text))) {
    stringHashes.push(hash);
  }

  const bufferHashes = [];
  const buffer = Buffer.from(text);
  for await (const hash of winnowFilter.hashes(new class extends Readable {
    public _read() {
      this.push(buffer);
      this.push(null);
    }
  }({ objectMode: false }))) {
    bufferHashes.push(hash);
  }

  expect(stringHashes).toEqual(bufferHashes);
});
