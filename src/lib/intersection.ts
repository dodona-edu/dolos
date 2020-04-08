import { Selection } from "./selection";
import { Range } from "./range";
import { Match } from "./match";
import { MergedMatch } from "./mergedMatch";
import { TokenizedFile } from "./tokenizedFile";

/**
 * This class represents all the matches between two files (i.e. the
 * intersection of their hashes).
 */
export class Intersection {

  #matches: MergedMatch[];

  constructor(
    public readonly leftFile: TokenizedFile,
    public readonly rightFile: TokenizedFile
  ) {
    this.#matches = [];
  }

  get matches(): Array<MergedMatch> {
    return this.#matches;
  }

  public addMatch(newMatch: Match<Selection>): void {
    let i = 0;
    while(i < this.matches.length && !this.matches[i].mergeable(newMatch)) {
      i++;
    }
    if (i == this.matches.length) {
      this.matches.push(new MergedMatch(newMatch));
    } else {
      this.matches[i].merge(newMatch);
    }
  }

  /**
   * Remove each MergedMatch that is contained in a bigger MergedMatch.
   */
  public squash(): void {
    const squashed: Array<MergedMatch> = [];
    let kandidates: Array<MergedMatch> = [];
    for (
      const match of
      this.matches.sort((a , b) => Range.compare(a.leftKmers, b.leftKmers))
    ) {

      let i = 0;
      let removed = false;
      const newKandidates: Array<MergedMatch> = [];

      while(i < kandidates.length && !removed) {
        if (match.leftKmers.from < kandidates[i].leftKmers.to) {
          newKandidates.push(kandidates[i]);
          removed = kandidates[i].leftKmers.contains(match.leftKmers) &&
            kandidates[i].rightKmers.contains(match.rightKmers);
        }
        // else: don't push the new kandidate
        i += 1;
      }
      while(i < kandidates.length) {
        newKandidates.push(kandidates[i]);
        i += 1;
      }

      if (!removed) {
        newKandidates.push(match);
        squashed.push(match);
      }

      kandidates = newKandidates;
    }
    this.#matches = squashed;
  }

  /**
   * Calculate how much kmers both files share. Each kmer is only counted once.
   */
  public totalOverlapKmers(): number {
    return Range.totalCovered(
      this.matches.map(m => m.leftKmers).sort(Range.compare)
    );
  }
}
