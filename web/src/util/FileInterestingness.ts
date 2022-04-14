import { Pair, File } from "@/api/api";
import { pairsAsNestedMap } from "./PairAsNestedMap";
import { NodeStats } from "@dodona/dolos-lib/dist/lib/analyze/SemanticAnalyzer";
import Store from "@/store";

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

type SemanticMatchingScore = {
  pair: Pair;
  weightedScore: number;
  match: NodeStats
}

export type FileScoring = {
  file: File;
  similarityScore: SimilarityScore | null;
  totalOverlapScore: TotalOverlapScore | null;
  longestFragmentScore: LongestFragmentScore | null;
  semanticMatchScore: SemanticMatchingScore | null;
  finalScore: number;
};

export class FileInterestingnessCalculator {
  private pairMap: Map<number, Map<number, Pair>>;

  private longestFragmentWeight = 4 / 10;
  private similarityWeight = 3 / 10;
  private totalOverlapWeight = 3 / 10;

  constructor(private pairs: Pair[], private $store: any) {
    this.pairMap = pairsAsNestedMap(pairs);
  }

  public async calculateFileScoring(file: File): Promise<FileScoring> {
    const similarityScore = this.calculateSimilarityScore(file);
    const totalOverlapScore = this.totalOverlapScore(file);
    const longestFragmentScore = this.longestFragmentScore(file);
    const semanticMatchScore = await this.semanticMatchingScore(file);

    // The smallest files have arbitrarily high scores. Therefore, we linearly adjust total weight
    const smallFileWeight = file.amountOfKgrams < 15 ? (file.amountOfKgrams / 15) : 1;

    const finalScore =
      (this.steepSquareScaling(similarityScore?.weightedScore || 0) +
      this.steepSquareScaling(totalOverlapScore?.weightedScore || 0) +
      this.steepSquareScaling(longestFragmentScore?.weightedScore || 0) +
      this.steepSquareScaling(semanticMatchScore?.weightedScore || 0)) *
      smallFileWeight;

    return {
      file,
      similarityScore,
      totalOverlapScore,
      longestFragmentScore,
      semanticMatchScore,
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
      // If the file is too small in total, we don't match it at all.
      weightedScore: file.amountOfKgrams > 10
        ? (
          (pair.longestFragment / file.amountOfKgrams) *
        this.longestFragmentWeight)
        : (0)
    };
  }

  public async semanticMatchingScore(file: File): Promise<SemanticMatchingScore | null> {
    const pairArray = Array.from(this.pairMap.get(file.id)?.values() || []);
    const matchSize = (m: NodeStats): number => m.ownNodes.length + m.childrenTotal;
    const matchContainsFunction = (m: NodeStats): boolean =>
      m.ownNodes.map(n => file.ast[n]).some(v => v.includes("fun"));
    const matchScore = (m: NodeStats): number => matchContainsFunction(m) ? matchSize(m) * 2 : matchSize(m);

    let maxScore = 0;
    let maxFileId: number | null = null;
    let maxMatch = null;
    for (const [fileid, matches] of file.semanticMap) {
      const filteredMatches = matches.filter(m => m.ownNodes.length + m.childrenTotal > 15);
      for (const match of filteredMatches) {
        if (matchScore(match) > maxScore) {
          maxScore = matchScore(match);
          maxFileId = fileid;
          maxMatch = match;
        }
      }
    }

    if (maxFileId === null || maxMatch === null) {
      return null;
    }

    const pair = pairArray.filter(p =>
      (p.leftFile.id === file.id && p.rightFile.id === maxFileId) ||
      (p.leftFile.id === maxFileId && p.rightFile.id === file.id)
    )[0];

    await this.$store.dispatch("populateFragments", { pairId: pair.id });

    if (pair.pairedMatches.length === 0) { return null; }

    if (pair.id === 3484) { console.log(pair.pairedMatches, maxMatch); }

    return {
      pair,
      match: maxMatch,
      weightedScore: matchContainsFunction(maxMatch) ? 0.8 : 0.6,
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

type PairField = "similarity" | "longestFragment" | "totalOverlap" | "semanticMatching"
export function getLargestFieldOfScore(scoredFile: FileScoring): PairField {
  const scores = [scoredFile.similarityScore?.weightedScore || 0, scoredFile.longestFragmentScore?.weightedScore || 0,
    scoredFile.totalOverlapScore?.weightedScore || 0, scoredFile.semanticMatchScore?.weightedScore || 0];

  const i = scores.indexOf(Math.max(...scores));
  const a: Array<PairField> = ["similarity", "longestFragment", "totalOverlap", "semanticMatching"];
  return a[i];
}
