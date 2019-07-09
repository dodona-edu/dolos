import { ModFilter } from "../modFilter";
import { NoFilter } from "../noFilter";

test("no hashes for text shorter than k", async () => {
  const text = "abcd";
  const filter = new ModFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  expect(hashes.length).toBe(0);
});

test("1 hash for text length of k", async () => {
  const text = "abcde";
  const filter = new ModFilter(5, 1);
  const hashes = [];

  for await (const hash of filter.hashesFromString(text)) {
    hashes.push(hash);
  }
  expect(hashes.length).toBe(1);
});

test("all hashes are mod m", async () => {
  const text = "This is a slightly longer text to test multiple hash values.";
  const mod = 2;
  const filter = new ModFilter(5, mod);

  for await (const [hash] of filter.hashesFromString(text)) {
    expect(hash % mod).toBe(0);
  }
});

test("mod 1 and noFilter create same result", async () => {
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
  expect(modHashes).toEqual(noHashes);
});
