import assert from "assert";
import { Intersection } from "./intersection";
import { DefaultMap } from "../util/defaultMap";
import { File } from "../file/file";
import { TokenizedFile } from "../file/tokenizedFile";
import { Match, Side } from "./match";
import { Range } from "../util/range";
import { Options } from "../util/options";
import { SharedKmer } from "./sharedKmer";

type Hash = number;

export interface ScoredIntersection {
  intersection: Intersection;
  overlap: number;
  longest: number;
  similarity: number;
}

export interface FilePart {
  file: TokenizedFile;
  side: Side;
}

export class Analysis {

  // computed list of scored intersections,
  // only defined after finished() is called
  private scored?: Array<ScoredIntersection>;

  // collection of all shared kmers
  private kmers: Map<Hash, SharedKmer> = new Map();

  private files: Set<TokenizedFile>;

  constructor(
    public readonly options: Options,
    files: TokenizedFile[],
  ) {
    this.files = new Set(files);
  }

  public addMatches(hash: Hash, ...parts: Array<FilePart>): void {
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
    this.scored =
      this.build()
        .map(intersection => {
          intersection.removeSmallerThan(this.options.minFragmentLength),
          intersection.squash();
          return intersection;
        })
        .filter(i => i.fragmentCount > 0)    // ignore empty intersections
        .map(i => this.calculateScore(i))       // calculate their similarity
        .filter(s =>                            // filter by minimum similarity
          s.similarity >= this.options.minSimilarity
        )
        .sort((a, b) => b.overlap - a.overlap) // sort in reversed order
        .slice(0, this.options.limitResults);  // limit to first n results
    Object.freeze(this);
  }

  public get scoredIntersections(): Array<ScoredIntersection> {
    if(this.scored) {
      return this.scored;
    } else {
      throw new Error("This analysis is not finished yet, " +
                      "but scoredIntersections() was called");
    }
  }

  /**
   * Combining all shared kmers and build intersections
   */
  private build(): Array<Intersection> {
    const intersections:
      DefaultMap<TokenizedFile, Map<TokenizedFile, Intersection>>
      = new DefaultMap(() => new Map());

    const byMax: (k: SharedKmer) => boolean = this.options.filterByPercentage
      ? k => this.files.size / k.files().length < this.options.maxHash 
      : k => k.files().length < this.options.maxHash;

    const filteredKmers = Array.of(...this.kmers.values()).filter(byMax);

    // create intersections
    for (const kmer of filteredKmers) {
      const parts = kmer.parts().sort((a, b) => File.compare(a.file, b.file));
      for (let i = 0; i < parts.length; i += 1) {
        const first = parts[i];
        for (let j = i + 1; j < parts.length; j += 1) {
          const second = parts[j];
          if (first.file === second.file) {
            // ignore matches within the same file (internal duplication)
            continue;
          }

          let intersection = intersections.get(first.file).get(second.file);
          if (!intersection) {
            intersection = new Intersection(first.file, second.file);
            intersections.get(first.file).set(second.file, intersection);
          }

          const match = new Match(first.side, second.side, kmer);
          intersection.addMatch(match);
        }
      }
    }

    // flatten nested map
    return Array.of(...intersections.values())
      .map(m => Array.of(...m.values()))
      .flat();
  }


  private calculateScore(intersection: Intersection): ScoredIntersection {
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
