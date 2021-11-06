import { Pair, File } from "@/api/api";
import { pairsAsNestedMap } from "./PairAsNestedMap";

type SimilarityScore = {
  score: number;
  pair: Pair;
};

type TotalOverlapScore = {
  totalOverlapTokens: number;
  totalOverlapWrtSize: number;
  pair: Pair;
};

type LongestFragmentScore = {
  longestFragmentTokens: number;
  longestFragmentWrtSize: number;
  pair: Pair;
};

export type FileScoring = {
  file: File;
  similarityScore: SimilarityScore | null;
  totalOverlapScore: TotalOverlapScore | null;
  longestFragmentScore: LongestFragmentScore | null;
  finalScore: number;
};

export class FileInterestingnessCalculator {
  private pairMap: Map<number, Map<number, Pair>>;

  constructor(private pairs: Pair[]) {
    this.pairMap = pairsAsNestedMap(pairs);
  }

  public calculateFileScoring(file: File): FileScoring {
    const similarityScore = this.calculateSimilarityScore(file);
    const totalOverlapScore = this.totalOverlapScore(file);
    const longestFragmentScore = this.longestFragmentScore(file);

    const finalScore =
      this.steepSquareScaling(similarityScore?.score || 0) +
      this.steepSquareScaling(totalOverlapScore?.totalOverlapWrtSize || 0) * 3 +
      this.steepSquareScaling(longestFragmentScore?.longestFragmentWrtSize || 0) * 5;

    return { file, similarityScore, totalOverlapScore, longestFragmentScore, finalScore };
  }

  public calculateSimilarityScore(file: File): SimilarityScore | null {
    const pairArray = Array.from(this.pairMap.get(file.id)?.values() || []);

    if (pairArray.length <= 0) {
      return null;
    }

    const pair = pairArray.reduce((a, b) =>
      a.similarity > b.similarity ? a : b
    );

    return { pair, score: pair.similarity };
  }

  public totalOverlapScore(file: File): TotalOverlapScore | null {
    const pairArray = Array.from(this.pairMap.get(file.id)?.values() || []);

    if (pairArray.length <= 0) {
      return null;
    }

    const pair = pairArray.reduce((a, b) =>
      a.totalOverlap > b.totalOverlap ? a : b
    );

    return {
      pair,
      totalOverlapTokens: pair.totalOverlap,
      // TODO: find out which unit the total overlap is in, and find the total of this file
      totalOverlapWrtSize: pair.totalOverlap / file.content.length
    };
  }

  public longestFragmentScore(file: File): LongestFragmentScore | null {
    const pairArray = Array.from(this.pairMap.get(file.id)?.values() || []);

    if (pairArray.length <= 0) {
      return null;
    }

    const pair = pairArray.reduce((a, b) =>
      a.longestFragment > b.longestFragment ? a : b
    );

    return {
      pair,
      longestFragmentTokens: pair.longestFragment,
      longestFragmentWrtSize: pair.longestFragment / file.content.length
    };
  }

  private steepSquareScaling(x: number): number {
    return 5 * x * x;
  }
}
