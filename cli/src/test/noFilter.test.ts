import test from "ava";
import { NoFilter } from "../lib/hashing/noFilter";
import { Readable } from "stream";
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
  const text = "This is  a slightly longer text to test multiple hashing values.";
  const winnowFilter = new NoFilter(5);

  for await (const { start, stop, data } of winnowFilter.hashesFromString(text)) {
    t.is(text.slice(start, stop + 1), data);
  }
});

test("all returned k-mers are different", async t => {
  const text = "This is a slightly longer text to test multiple hashing values.";
  const winnowFilter = new NoFilter(5);

  const set = new Set();
  for await (const { data } of winnowFilter.hashesFromString(text)) {
    t.is(set.has(data), false, `The data string "${data}" was output twice`);
    set.add(data);
  }
});

test("all returned k-mers are of size k tokens", async t => {
  const text = "This is a slightly longer text to test multiple hashing values.";
  const k = 5;
  const winnowFilter = new NoFilter(k);

  for await (const { data } of winnowFilter.hashesFromString(text)) {
    t.is(await countTokens(data), k);
  }
});

test("no hashes for text shorter than k", async t => {
  const text = "abcd";
  const filter = new NoFilter(5);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(0, hashes.length);
});

test("1 hashing for 1 token", async t => {
  const text = "abcde";
  const filter = new NoFilter(1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(1, hashes.length);
});

test("number of hashes equals amount of tokens in text minus k plus 1", async t => {
  const text = "This is a slightly longer text to test multiple hashing values.";
  const tokens = 11;
  const k = 5;
  const filter = new NoFilter(k);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(tokens - k + 1, hashes.length);
});
