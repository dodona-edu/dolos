import { Pair, File } from "@/api/models";
import { pairsAsNestedMap } from "./PairAsNestedMap";

export type SimilarityScore = {
  similarity: number;
  weightedScore: number;
  pair: Pair;
};

type TotalOverlapScore = {
  totalOverlapTokens: number;
  totalOverlapWrtSize: number;
  pair: Pair;
  weightedScore: number;
};

type LongestFragmentScore = {
  longestFragmentTokens: number;
  longestFragmentWrtSize: number;
  pair: Pair;
  weightedScore: number;
};

export type FileScoring = {
  file: File;
  similarityScore: SimilarityScore | null;
  totalOverlapScore: TotalOverlapScore | null;
  longestFragmentScore: LongestFragmentScore | null
  finalScore: number;
};

export class FileInterestingnessCalculator {
  private pairMap: Map<number, Map<number, Pair>>;

  private longestFragmentWeight = 4 / 12;
  private similarityWeight = 3 / 12;
  private totalOverlapWeight = 2 / 12;
  private semanticWeight = 3 / 12;

  constructor(private pairs: Pair[]) {
    this.pairMap = pairsAsNestedMap(pairs);
  }

  public calculateFileScoring(file: File): FileScoring {
    const similarityScore = this.calculateSimilarityScore(file);
    const totalOverlapScore = this.totalOverlapScore(file);
    const longestFragmentScore = this.longestFragmentScore(file);
    // The smallest files have arbitrarily high scores. Therefore, we linearly adjust total weight
    const smallFileWeight = file.amountOfKgrams < 15 ? (file.amountOfKgrams / 15) : 1;

    const finalScore =
      ((similarityScore?.weightedScore || 0) +
      (totalOverlapScore?.weightedScore || 0) +
      (longestFragmentScore?.weightedScore || 0)) *
      smallFileWeight;

    return {
      file,
      similarityScore,
      totalOverlapScore,
      longestFragmentScore,
      finalScore
    };
  }

  public calculateSimilarityScore(file: File): SimilarityScore | null {
    const pairArray = Array.from(this.pairMap.get(file.id)?.values() || []);

    if (pairArray.length <= 0) {
      return null;
    }

    const pair = pairArray.reduce((a, b) =>
      a.similarity > b.similarity ? a : b
    );

    return {
      pair,
      similarity: pair.similarity,
      weightedScore: this.steepSquareScaling(pair.similarity) * this.similarityWeight
    };
  }

  public totalOverlapScore(file: File): TotalOverlapScore | null {
    const pairArray = Array.from(this.pairMap.get(file.id)?.values() || []);

    if (pairArray.length <= 0) {
      return null;
    }

    const pair = pairArray.reduce((a, b) =>
      a.totalOverlap > b.totalOverlap ? a : b
    );

    const fileOverlapTokens = pair.leftFile.id === file.id ? pair.leftCovered : pair.rightCovered;

    return {
      pair,
      totalOverlapTokens: fileOverlapTokens,
      totalOverlapWrtSize: fileOverlapTokens / file.amountOfKgrams,
      weightedScore:
        this.steepSquareScaling(fileOverlapTokens / file.amountOfKgrams) * this.totalOverlapWeight
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
      longestFragmentWrtSize: pair.longestFragment / file.amountOfKgrams,
      // If the file is too small in total, we don't match it at all.
      weightedScore: file.amountOfKgrams > 10
        ? (
          this.steepSquareScaling(pair.longestFragment / file.amountOfKgrams) *
        this.longestFragmentWeight)
        : (0)
    };
  }

  private steepSquareScaling(x: number): number {
    return 3 * x * x;
  }
}

export function getLargestPairOfScore(scoredFile: FileScoring): Pair | null {
  const scores = [scoredFile.similarityScore, scoredFile.longestFragmentScore, scoredFile.totalOverlapScore];

  return scores.reduce((s, ns) => (s?.weightedScore || 0) > (ns?.weightedScore || 0) ? s : ns)?.pair || null;
}

type PairField = "similarity" | "longestFragment" | "totalOverlap"
export function getLargestFieldOfScore(scoredFile: FileScoring): PairField {
  const scores = [
    scoredFile.similarityScore?.weightedScore || 0,
    scoredFile.longestFragmentScore?.weightedScore || 0,
    scoredFile.totalOverlapScore?.weightedScore || 0
  ];

  const i = scores.indexOf(Math.max(...scores));
  const a: Array<PairField> = ["similarity", "longestFragment", "totalOverlap"];
  return a[i];
}
