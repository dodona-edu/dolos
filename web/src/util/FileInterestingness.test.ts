import { describe, it, expect } from "vitest";
import {
  FileInterestingnessCalculator,
  getLargestFieldOfScore,
  getLargestPairOfScore,
} from "./FileInterestingness";
import { createFile, createPair } from "@/test/fixtures";

describe("FileInterestingnessCalculator", () => {
  it("returns null scores for a file that has no pairs", () => {
    const lonely = createFile(99, { amountOfKgrams: 100 });
    const calc = new FileInterestingnessCalculator([]);

    const scoring = calc.calculateFileScoring(lonely);

    expect(scoring.similarityScore).toBeNull();
    expect(scoring.totalOverlapScore).toBeNull();
    expect(scoring.longestFragmentScore).toBeNull();
    expect(scoring.finalScore).toBe(0);
  });

  it("picks the highest-similarity pair for the similarity score", () => {
    const a = createFile(1, { amountOfKgrams: 100 });
    const b = createFile(2, { amountOfKgrams: 100 });
    const c = createFile(3, { amountOfKgrams: 100 });
    const weak = createPair(1, a, b, 0.3);
    const strong = createPair(2, a, c, 0.9);
    const calc = new FileInterestingnessCalculator([weak, strong]);

    const score = calc.calculateSimilarityScore(a);

    expect(score?.pair).toBe(strong);
    expect(score?.similarity).toBe(0.9);
    // weightedScore = steepSquareScaling(0.9) * (3/12) = 3*0.81*0.25
    expect(score?.weightedScore).toBeCloseTo(3 * 0.81 * 0.25, 6);
  });

  it("scales down the final score for very small files", () => {
    const small = createFile(1, { amountOfKgrams: 6 }); // < 15 => weight 6/15
    const other = createFile(2, { amountOfKgrams: 100 });
    const calc = new FileInterestingnessCalculator([
      createPair(1, small, other, 0.9),
    ]);

    const scoring = calc.calculateFileScoring(small);

    // finalScore must be strictly smaller than the unscaled sum of weights.
    const unscaled =
      (scoring.similarityScore?.weightedScore ?? 0) +
      (scoring.totalOverlapScore?.weightedScore ?? 0) +
      (scoring.longestFragmentScore?.weightedScore ?? 0);
    expect(scoring.finalScore).toBeCloseTo(unscaled * (6 / 15), 6);
  });
});

describe("score field helpers", () => {
  it("getLargestFieldOfScore reports which dimension dominates", () => {
    const scoring = {
      file: createFile(1),
      similarityScore: { similarity: 0, weightedScore: 0.9, pair: {} as never },
      totalOverlapScore: null,
      longestFragmentScore: { longestFragmentTokens: 0, longestFragmentWrtSize: 0, weightedScore: 0.1, pair: {} as never },
      finalScore: 1,
    };
    expect(getLargestFieldOfScore(scoring as never)).toBe("similarity");
  });

  it("getLargestPairOfScore returns the pair behind the dominant score", () => {
    const winner = createPair(7, createFile(1), createFile(2), 0.9);
    const scoring = {
      file: createFile(1),
      similarityScore: { similarity: 0.9, weightedScore: 0.9, pair: winner },
      totalOverlapScore: null,
      longestFragmentScore: null,
      finalScore: 0.9,
    };
    expect(getLargestPairOfScore(scoring as never)).toBe(winner);
  });
});
