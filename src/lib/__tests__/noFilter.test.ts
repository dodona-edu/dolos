import { HashFilter } from "../hashFilter";
import { NoFilter } from "../noFilter";

test("no hashes for text shorter than k", async () => {
  const text = "abcd";
  const filter = new NoFilter(5);
  const hashes = [];

  for await (const hash of filter.hashes(HashFilter.streamFromString(text))) {
    hashes.push(hash);
  }
  expect(hashes.length).toBe(0);
});

test("1 hash for text length of k", async () => {
  const text = "abcde";
  const filter = new NoFilter(5);
  const hashes = [];

  for await (const hash of filter.hashes(HashFilter.streamFromString(text))) {
    hashes.push(hash);
  }
  expect(hashes.length).toBe(1);
});

test("number of hashes equals text size minus k plus 1", async () => {
  const text = "This is a slightly longer text to test multiple hash values.";
  const k = 5;
  const filter = new NoFilter(k);
  const hashes = [];

  for await (const hash of filter.hashes(HashFilter.streamFromString(text))) {
    hashes.push(hash);
  }
  expect(hashes.length).toBe(text.length - k + 1);
});
