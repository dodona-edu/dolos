import test from "ava";
import { Readable } from "stream";
import { NoFilter } from "../lib/hashing/noFilter";
import { WinnowFilter } from "../lib/hashing/winnowFilter";
import { HashFilter } from "../lib/hashing/hashFilter";

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

test("locations and data match given string", async t => {
  const text = "This is a slightly longer text to test multiple hashing values.";
  const windowSize = 3;
  const winnowFilter = new WinnowFilter(5, windowSize);

  for await (const { start, stop, data } of winnowFilter.hashesFromString(text)) {
    t.is(text.slice(start, stop + 1), data);
  }
});

test("locations and data match given string 2", async t => {
  const text = " a b c d e f g";
  const windowSize = 2;
  const winnowFilter = new WinnowFilter(2, windowSize);

  for await (const { start, stop, data } of winnowFilter.hashesFromString(text)) {
    t.is(text.slice(start, stop + 1), data);
  }
});

test("all returned k-mers are different", async t => {
  const text = "This is a slightly longer text to test multiple hashing values.";
  const windowSize = 3;
  const k = 5;

  const winnowFilter = new WinnowFilter(k, windowSize);
  const set = new Set();
  for await (const { data } of winnowFilter.hashesFromString(text)) {
    t.is(set.has(data), false, `The data string "${data}" was output twice`);
    set.add(data);
  }
});

test("all returned k-mers are of size k tokens", async t => {
  const text = "This is a slightly longer text to test multiple hashing values.";
  const windowSize = 3;
  const k = 5;

  const winnowFilter = new WinnowFilter(k, windowSize);
  for await (const { data } of winnowFilter.hashesFromString(text)) {
    t.is(await countTokens(data), k);
  }
});

test("Winnow on comparable files", async t => {
  const textA = " a b c d e f g";
  const textB = " b c d a b c e f g";

  const filter = new WinnowFilter(2, 2);
  const hashes: Map<number, [number, number] > = new Map();
  // Build a Map from hashing to position
  for await (const { hash, start, stop, data } of filter.hashesFromString(textA)) {
    console.log({ data,
      slice: textA.slice(start, stop + 1),
      equal: data === textA.slice(start, stop + 1)
    });
    hashes.set(hash, [start, stop]);
  }

  let overlap = 0;
  for await (const { hash, start, stop } of filter.hashesFromString(textB)) {
    if (hashes.has(hash)) {
      ++overlap;
      const [startA, stopA] = hashes.get(hash) as [number, number];
      // This test assumes no hash collisions
      t.is(textA.slice(startA, stopA + 1), textB.slice(start, stop + 1));
    }
  }
  // For each equal triplet there has to be a common winnowed hashing
  t.true(overlap >= 3);
});

test("no hashes for text shorter than k tokens", async t => {
  const text = "a b "; // spaces are also counted as tokens
  const filter = new WinnowFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(0, hashes.length);
});

test("1 hashing for text length of k", async t => {
  const text = "a b c";
  const filter = new WinnowFilter(3, 1);
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
  const temp = [];

  for await (const { start, data } of winnowFilter.hashesFromString(text)) {
    temp.push(data);
    const tokenCount = await countTokens(text.slice(previousPos, start));
    t.true(tokenCount <= windowSize);
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
