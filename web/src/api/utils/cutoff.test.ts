import { describe, it, expect } from "vitest";
import { weightedDistributionIndex, getLocalMinima, guessSimilarityThreshold } from "./cutoff";
import { createFile, createPair } from "@/test/fixtures";

describe("weightedDistributionIndex", () => {
  it("returns the baseline 0.1 at the default peak (0.8)", () => {
    expect(weightedDistributionIndex(0.8)).toBeCloseTo(0.1, 3);
  });

  it("is symmetric around the configurable peak", () => {
    const peak = 0.5;
    expect(weightedDistributionIndex(0.4, peak)).toBeCloseTo(
      weightedDistributionIndex(0.6, peak),
      3
    );
  });
});

describe("getLocalMinima", () => {
  it("returns no minima for a monotonic increasing array", () => {
    expect(getLocalMinima([1, 2, 3, 4])).toEqual([]);
  });

  it("finds the index of a single valley", () => {
    expect(getLocalMinima([3, 1, 2])).toEqual([1]);
  });

  it("finds multiple valleys", () => {
    expect(getLocalMinima([5, 1, 4, 2, 6])).toEqual([1, 3]);
  });
});

describe("guessSimilarityThreshold", () => {
  it("never returns less than the mean similarity", () => {
    const files = [createFile(1), createFile(2)];
    const pairs = [0.1, 0.2, 0.85, 0.9, 0.95].map((s, i) =>
      createPair(i, files[0], files[1], s)
    );
    const mean = pairs.reduce((acc, p) => acc + p.similarity, 0) / pairs.length;

    const threshold = guessSimilarityThreshold(pairs);

    expect(threshold).toBeGreaterThanOrEqual(mean);
    expect(threshold).toBeLessThanOrEqual(1);
    expect(Number.isFinite(threshold)).toBe(true);
  });

  it("locks a deterministic value for a bimodal distribution", () => {
    const files = [createFile(1), createFile(2)];
    // Two clusters of similarities separated by a gap around 0.5.
    const values = [
      0.1, 0.12, 0.15, 0.18, 0.2, 0.22,
      0.8, 0.82, 0.85, 0.88, 0.9, 0.92,
    ];
    const pairs = values.map((s, i) => createPair(i, files[0], files[1], s));

    expect(guessSimilarityThreshold(pairs)).toMatchInlineSnapshot(`0.765`);
  });
});
