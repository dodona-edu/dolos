import { Pair, File } from "@/api/models";
import { pairsAsNestedMap } from "./PairAsNestedMap";

export type SimilarityScore = {
  similarity: number;
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
  longestFragmentScore: LongestFragmentScore | null;
};

export type ScoreField = "similarity" | "longestFragment";

export class FileInterestingnessCalculator {
  private pairMap: Map<number, Map<number, Pair>>;

  constructor(private pairs: Pair[]) {
    this.pairMap = pairsAsNestedMap(pairs);
  }

  public calculateFileScoring(file: File): FileScoring {
    return {
      file,
      similarityScore: this.calculateSimilarityScore(file),
      longestFragmentScore: this.longestFragmentScore(file),
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
    const fileSize = pair.leftFile.id === file.id ? pair.leftTotal : pair.rightTotal;

    return {
      pair,
      longestFragmentTokens: pair.longestFragment,
      longestFragmentWrtSize: fileSize > 0 ? pair.longestFragment / fileSize : 0,
    };
  }
}

// The value of a field of a file scoring, between 0 and 1.
export function getScoreOfField(scoring: FileScoring, field: ScoreField): number {
  if (field === "similarity") {
    return scoring.similarityScore?.similarity ?? 0;
  }
  return scoring.longestFragmentScore?.longestFragmentWrtSize ?? 0;
}
