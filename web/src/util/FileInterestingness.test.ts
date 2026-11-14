import { describe, it, expect } from "vitest";
import { FileInterestingnessCalculator } from "./FileInterestingness";
import { createFile, createPair } from "@/test/fixtures";

describe("FileInterestingnessCalculator", () => {
  it("returns null scores for a file that has no pairs", () => {
    const lonely = createFile(99);
    const calc = new FileInterestingnessCalculator([]);

    const scoring = calc.calculateFileScoring(lonely);

    expect(scoring.similarityScore).toBeNull();
    expect(scoring.longestFragmentScore).toBeNull();
  });

  it("takes the highest similarity of the pairs of a file", () => {
    const a = createFile(1);
    const b = createFile(2);
    const c = createFile(3);
    const weak = createPair(1, a, b, 0.3);
    const strong = createPair(2, a, c, 0.9);
    const calc = new FileInterestingnessCalculator([weak, strong]);

    const score = calc.calculateSimilarityScore(a);

    expect(score?.similarity).toBe(0.9);
  });

  it("divides the longest fragment by the total of the file's side of the pair", () => {
    const left = createFile(1);
    const right = createFile(2);
    const pair = createPair(1, left, right, 0.5, { longestFragment: 10, leftTotal: 40, rightTotal: 20 });
    const calc = new FileInterestingnessCalculator([pair]);

    expect(calc.longestFragmentScore(left)?.longestFragmentWrtSize).toBe(0.25);
    expect(calc.longestFragmentScore(right)?.longestFragmentWrtSize).toBe(0.5);
  });

  it("scores the longest fragment as 0 when the total of the file is 0", () => {
    const left = createFile(1);
    const right = createFile(2);
    const pair = createPair(1, left, right, 0, { longestFragment: 0, leftTotal: 0, rightTotal: 0 });
    const calc = new FileInterestingnessCalculator([pair]);

    expect(calc.longestFragmentScore(left)?.longestFragmentWrtSize).toBe(0);
  });
});
