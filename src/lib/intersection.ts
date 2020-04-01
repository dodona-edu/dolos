import { Selection } from "./selection";
import { Match } from "./match";
import { MergedMatch } from "./mergedMatch";

/**
 * This class represents all the matches between two files (i.e. the
 * intersection of their hashes).
 */
export class Intersection {

  public readonly matches: MergedMatch[];

  constructor(
    public readonly leftFile: string,
    public readonly rightFile: string
  ) {
    this.matches = [];
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
}
