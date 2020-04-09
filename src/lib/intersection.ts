import { Selection } from "./selection";
import { Range } from "./range";
import { Match } from "./match";
import { Fragment } from "./fragment";
import { TokenizedFile } from "./tokenizedFile";

/**
 * This class represents all the fragments between two files (i.e. the
 * intersection of their hashes).
 */
export class Intersection {

  #fragments: Array<Fragment>;

  constructor(
    public readonly leftFile: TokenizedFile,
    public readonly rightFile: TokenizedFile
  ) {
    this.#fragments = [];
  }

  get fragments(): Array<Fragment> {
    return this.#fragments;
  }

  public addMatch(newMatch: Match<Selection>): void {
    let i = 0;
    while(i < this.fragments.length
          && !this.fragments[i].extendable(newMatch)) {
      i += 1;
    }
    if (i == this.fragments.length) {
      this.fragments.push(new Fragment(newMatch));
    } else {
      this.fragments[i].extend(newMatch);
    }
  }

  /**
   * Remove each Fragment that is contained in a bigger Fragment.
   */
  public squash(): void {
    const squashed: Array<Fragment> = [];
    let kandidates: Array<Fragment> = [];
    for (
      const match of
      this.fragments.sort((a , b) => Range.compare(a.leftKmers, b.leftKmers))
    ) {

      let i = 0;
      let removed = false;
      const newKandidates = [];

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
    this.#fragments = squashed;
  }

  /**
   * Calculate how much kmers both files share. Each kmer is only counted once.
   */
  public totalOverlapKmers(): number {
    return Range.totalCovered(
      this.fragments.map(m => m.leftKmers).sort(Range.compare)
    );
  }
}
