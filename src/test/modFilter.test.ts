import test from "ava";
import { ModFilter } from "../lib/filters/modFilter";
import { NoFilter } from "../lib/filters/noFilter";

test("no hashes for text shorter than k", async t => {
  const text = "abcd";
  const filter = new ModFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(0, hashes.length);
});

test("1 hash for text length of k", async t => {
  const text = "abcde";
  const filter = new ModFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  t.is(1, hashes.length);
});

test("all hashes are mod m", async t => {
  const text = "This is a slightly longer text to test multiple hash values.";
  const mod = 2;
  const filter = new ModFilter(5, mod);

  for await (const { hash } of filter.hashesFromString(text)) {
    t.is(0, hash % mod);
  }
});

test("mod 1 and noFilter create same result", async t => {
  const text = "This is a slightly longer text to test multiple hash values.";
  const noFilter = new NoFilter(5);
  const modFilter = new ModFilter(5, 1);
  const noHashes = [];
  const modHashes = [];

  for await (const hash of noFilter.hashesFromString(text)) {
    noHashes.push(hash);
  }
  for await (const hash of modFilter.hashesFromString(text)) {
    modHashes.push(hash);
  }
  t.deepEqual(modHashes, noHashes);
});
