import assert from "assert";
import { Diff } from "./diff";
import { DefaultMap } from "../util/defaultMap";
import { File } from "../file/file";
import { TokenizedFile } from "../file/tokenizedFile";
import { PairedOccurrence, ASTRegion } from "./pairedOccurrence";
import { Range } from "../util/range";
import { Options } from "../util/options";
import { SharedKmer } from "./sharedKmer";
import { closestMatch, info } from "../util/utils";

type Hash = number;

export interface ScoredDiff {
  intersection: Diff;
  overlap: number;
  longest: number;
  similarity: number;
}

export interface Occurrence {
  file: TokenizedFile;
  side: ASTRegion;
}

export class Report {

  // computed list of scored intersections,
  // only defined after finished() is called
  private scored?: Array<ScoredDiff>;

  // collection of all shared kmers
  private kmers: Map<Hash, SharedKmer> = new Map();

  private fileSet: Set<TokenizedFile>;

  constructor(
    public readonly options: Options,
    files: TokenizedFile[],
  ) {
    this.fileSet = new Set(files);
  }

  public addMatches(hash: Hash, ...parts: Array<Occurrence>): void {
    assert(parts.length > 0);
    let kmer = this.kmers.get(hash);
    if(!kmer) {
      kmer = new SharedKmer(hash, parts[0].side.data);
      this.kmers.set(hash, kmer);
    }
    kmer.addAll(parts);
  }

  /**
   * Finish the analysis and apply postprocessing steps.
   */
  public finish(): void {
    assert(this.scored !== null, "this analysis is already finished");

    type SortFn = (a: ScoredDiff, b: ScoredDiff) => number;
    const sortfn = closestMatch<SortFn>(this.options.sortBy, {
      "total": (a, b) => b.overlap - a.overlap,
      "continuous": (a, b) => b.longest - a.longest,
      "similarity": (a, b) => b.similarity - a.similarity,
    });

    if(sortfn === null) {
      throw new Error(`${this.options.sortBy} is not a valid field to sort on`);
    }

    info(`Combining ${ this.kmers.size } shared kmers into intersections.`);
    let ints = this.build();

    info(`Cleaning ${ ints.length} intersections.`);
    ints = ints.map(intersection => {
      intersection.removeSmallerThan(this.options.minFragmentLength);
      intersection.squash();
      return intersection;
    });

    info("Filtering intersections.");
    ints = ints.filter(i => i.fragmentCount > 0);

    info(`Calculating the score of ${ ints.length } intersections.`);
    this.scored = ints.map(i => this.calculateScore(i));

    info(`Keeping intersections with similarity >= ${ this.options.minSimilarity }`);
    this.scored = this.scored.filter(s =>
      s.similarity >= this.options.minSimilarity
    );

    info(`Sorting ${ this.scored.length } intersections.`);
    this.scored.sort(sortfn);

    if(this.options.limitResults) {
      console.error(`Limiting to ${ this.options.limitResults } results.`);
      this.scored = this.scored.slice(0, this.options.limitResults);
    }

    info("Freezing analysis object.");
    Object.freeze(this);
  }

  public get scoredIntersections(): Array<ScoredDiff> {
    if(this.scored) {
      return this.scored;
    } else {
      throw new Error("This analysis is not finished yet, " +
                      "but scoredIntersections() was called");
    }
  }

  public sharedKmers(): Array<SharedKmer> {
    return Array.of(...this.kmers.values());
  }

  /**
   * Combining all shared kmers and build intersections
   */
  private build(): Array<Diff> {
    const intersections:
      DefaultMap<TokenizedFile, Map<TokenizedFile, Diff>>
      = new DefaultMap(() => new Map());

    let maxFiles: number;
    if (this.options.maxHashCount != null) {
      maxFiles = this.options.maxHashCount;
    } else if (this.options.maxHashPercentage != null) {
      maxFiles = this.options.maxHashPercentage * this.fileSet.size;
    } else {
      maxFiles = this.fileSet.size;
    }

    const filteredKmers = Array.of(...this.kmers.values())
      .filter(k => k.files().length <= maxFiles);

    // create intersections
    for (const kmer of filteredKmers) {
      const parts = kmer.parts().sort((a, b) => File.compare(a.file, b.file));
      for (let i = 0; i < parts.length; i += 1) {
        const first = parts[i];
        for (let j = i + 1; j < parts.length; j += 1) {
          const second = parts[j];
          if (first.file === second.file) {
            // ignore pairedOccurrences within the same file (internal duplication)
            continue;
          }

          let intersection = intersections.get(first.file).get(second.file);
          if (!intersection) {
            intersection = new Diff(first.file, second.file);
            intersections.get(first.file).set(second.file, intersection);
          }

          const match = new PairedOccurrence(first.side, second.side, kmer);
          intersection.addMatch(match);
        }
      }
    }

    // flatten nested map
    return Array.of(...intersections.values())
      .map(m => Array.of(...m.values()))
      .flat();
  }

  public files(): TokenizedFile[] {
    return Array.of(...this.fileSet);
  }


  private calculateScore(intersection: Diff): ScoredDiff {
    const fragments = intersection.fragments();
    const leftCovered = Range.totalCovered(fragments.map(f => f.leftKmers));
    const rightCovered = Range.totalCovered(fragments.map(f => f.rightKmers));
    const leftTotal = intersection.leftFile.kmers.length;
    const rightTotal = intersection.rightFile.kmers.length;
    return {
      intersection,
      overlap: leftCovered,
      longest: intersection.largestFragmentLength(),
      similarity: (leftCovered + rightCovered) / (leftTotal + rightTotal)
    };
  }
}
