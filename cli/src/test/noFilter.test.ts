import test from "ava";
import { NoFilter } from "../lib/hashing/noFilter";

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
  const tokens = 21;
  const k = 5;
  const filter = new NoFilter(k);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(tokens - k + 1, hashes.length);
});
