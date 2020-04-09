import { Intersection } from "./intersection";
import { DefaultMap } from "./defaultMap";
import { File } from "./file";
import { TokenizedFile } from "./tokenizedFile";
import { Match } from "./match";
import { Selection } from "./selection";
import { Range } from "./range";
import { Options } from "./options";

export interface ScoredIntersection {
  intersection: Intersection;
  overlap: number;
  similarity: number;
}

export class Analysis {

  // to keep track of which two files match (and not have two times the same
  // Intersection but in different order), we use a nested map where we use
  // the two keys in lexicographical order
  private intersectionMap:
    DefaultMap<TokenizedFile, Map<TokenizedFile, Intersection>>
    = new DefaultMap(() => new Map())

  constructor(
    public readonly options: Options
  ) {}

  public addMatch(
    left: TokenizedFile,
    right: TokenizedFile,
    match: Match<Selection>
  ): void {

    const [first, second] = [left, right].sort(File.compare);
    let intersection = this.intersectionMap.get(first).get(second);
    if (!intersection) {
      intersection = new Intersection(left, right);
      this.intersectionMap.get(first).set(second, intersection);
    }

    intersection.addMatch(match);
  }

  /**
   * Finish the analysis and apply postprocessing steps.
   */
  public finish(): void {
    for(const intersection of this.intersectionIterator()) {
      intersection.removeSmallerThan(this.options.minFragmentLength),
      intersection.squash();
    }
    Object.freeze(this);
  }

  public *intersectionIterator(): IterableIterator<Intersection> {
    for (const map of this.intersectionMap.values()) {
      yield *map.values();
    }
  }

  public intersections(): Array<Intersection> {
    return Array.of(...this.intersectionIterator());
  }

  public scoredIntersections(): Array<ScoredIntersection> {
    return this
      .intersections()
      .map(intersection => {
        const leftCovered =
          Range.totalCovered(intersection.fragments.map(f => f.leftKmers));
        const rightCovered =
          Range.totalCovered(intersection.fragments.map(f => f.rightKmers));
        const leftTotal = intersection.leftFile.kmers.length;
        const rightTotal = intersection.rightFile.kmers.length;
        return {
          intersection,
          overlap: leftCovered,
          similarity: (leftCovered + rightCovered) / (leftTotal + rightTotal)
        }})
      .sort((a, b) => a.overlap - b.overlap);
  }
}
