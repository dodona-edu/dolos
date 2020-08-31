import test from "ava";
import { Readable } from "stream";
import { NoFilter } from "../lib/hashing/noFilter";
import { WinnowFilter } from "../lib/hashing/winnowFilter";
import { HashFilter } from "../lib/hashing/hashFilter";

test("Winnow on comparable files", async t => {
  const textA = "a b c d e f g";
  const textB = "b c d a b c e f g";
  const k = 2;

  const filter = new WinnowFilter(k, 2);
  const hashes: Map<number, number> = new Map();
  // Build a Map from hashing to position
  for await (const { hash, start: posA } of filter.hashesFromString(textA)) {
    hashes.set(hash, posA);
  }

  let overlap = 0;
  for await (const { hash, start: posB } of filter.hashesFromString(textB)) {
    if (hashes.has(hash)) {
      ++overlap;
      const posA = hashes.get(hash) as number;
      // This test assumes no hashcollisions
      t.is(textA.slice(posA, posA + k), textB.slice(posB, posB + k));
    }
  }
  // For each equal triplet there has to be a common winnowed hashing
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

test("1 hashing for text length of k", async t => {
  const text = "abcde";
  const filter = new WinnowFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(1, hashes.length);
});

test("maximum gap size in amount of tokens between hashing positions is window size", async t => {
  const text = "This is a slightly longer text to test multiple hashing values.";
  const windowSize = 3;
  const winnowFilter = new WinnowFilter(5, windowSize);
  let previousPos = 0;
  async function countTokens(str: string): Promise<number> {
    const stream = new Readable();
    stream.push(str);
    stream.push(null);
    let count = 0;
    // eslint-disable-next-line no-empty-pattern
    for await (const {} of HashFilter.readTokens(stream)) {
      count += 1;
    }
    return count;
  }

  for await (const { start } of winnowFilter.hashesFromString(text)) {
    t.true(await countTokens(text.slice(previousPos, start)) <= windowSize);
    previousPos = start;
  }
});

test("winnow 1 and noFilter create same result", async t => {
  const text = "This is a slightly longer text to test multiple hashing values.";
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
    "buffers and test multiple hashing values.";

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
