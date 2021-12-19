import { Pair, File } from "@/api/api";
import { pairsAsNestedMap } from "./PairAsNestedMap";

type SimilarityScore = {
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
  longestFragmentScore: LongestFragmentScore | null;
  finalScore: number;
};

export class FileInterestingnessCalculator {
  private pairMap: Map<number, Map<number, Pair>>;

  private longestFragmentWeight = 5 / 10;
  private similarityWeight = 2 / 10;
  private totalOverlapWeight = 3 / 10;

  constructor(private pairs: Pair[]) {
    this.pairMap = pairsAsNestedMap(pairs);
  }

  public calculateFileScoring(file: File): FileScoring {
    const similarityScore = this.calculateSimilarityScore(file);
    const totalOverlapScore = this.totalOverlapScore(file);
    const longestFragmentScore = this.longestFragmentScore(file);

    const finalScore =
      this.steepSquareScaling(similarityScore?.weightedScore || 0) +
      this.steepSquareScaling(totalOverlapScore?.weightedScore || 0) +
      this.steepSquareScaling(longestFragmentScore?.weightedScore || 0);

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
      weightedScore: pair.similarity * this.similarityWeight
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
        (fileOverlapTokens / file.amountOfKgrams) * this.totalOverlapWeight
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
      weightedScore:
        (pair.longestFragment / file.amountOfKgrams) *
        this.longestFragmentWeight
    };
  }

  private steepSquareScaling(x: number): number {
    return 5 * x * x;
  }
}
