import { Readable } from "stream";
import { WinnowFilter } from "../winnowFilter";

test("Winnow on comparable files", async () => {
  const textA = "abcdefg";
  const textB = "bcdabcefg";
  const k = 2;

  const filter = new WinnowFilter(k, 2);
  const hashes: Map<number, number> = new Map();
  // Build a Map from hash to position
  for await (const [hash, posA] of filter.hashes((Readable as any).from(textA))) {
    hashes.set(hash, posA);
  }

  let overlap = 0;
  for await (const [hash, posB] of filter.hashes((Readable as any).from(textB))) {
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
