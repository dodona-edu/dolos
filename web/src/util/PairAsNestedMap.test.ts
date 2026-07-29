import { describe, it, expect } from "vitest";
import { pairsAsNestedMap } from "./PairAsNestedMap";
import { createFile, createPair } from "@/test/fixtures";

describe("pairsAsNestedMap", () => {
  it("indexes each pair under both files (symmetrically)", () => {
    const a = createFile(1);
    const b = createFile(2);
    const pair = createPair(10, a, b, 0.5);

    const map = pairsAsNestedMap([pair]);

    expect(map.get(1)?.get(2)).toBe(pair);
    expect(map.get(2)?.get(1)).toBe(pair);
  });

  it("groups multiple pairs sharing a file", () => {
    const a = createFile(1);
    const b = createFile(2);
    const c = createFile(3);
    const ab = createPair(10, a, b, 0.5);
    const ac = createPair(11, a, c, 0.7);

    const map = pairsAsNestedMap([ab, ac]);

    expect(map.get(1)?.size).toBe(2);
    expect(map.get(1)?.get(2)).toBe(ab);
    expect(map.get(1)?.get(3)).toBe(ac);
  });

  it("returns an empty map for no pairs", () => {
    expect(pairsAsNestedMap([]).size).toBe(0);
  });
});
