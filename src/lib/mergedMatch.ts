import assert from "assert";
import { Match } from "./match";
import { Selection } from "./selection";
import { Range } from "./range";

export class MergedMatch {

  public matches: Array<Match<Selection>>;
  public leftKmers: Range;
  public rightKmers: Range;

  constructor(initial: Match<Selection>) {
    this.matches = [initial];
    this.leftKmers = new Range(initial.leftKmer);
    this.rightKmers = new Range(initial.rightKmer);
  }

  public mergeable(other: Match<Selection>): boolean {
    return this.leftKmers.to == other.leftKmer &&
      this.rightKmers.to == other.rightKmer;
  }

  public merge(other: Match<Selection>): void {
    assert(this.mergeable(other), "matches are not mergeable");
    this.leftKmers = Range.merge(this.leftKmers, new Range(other.leftKmer));
    this.rightKmers = Range.merge(this.rightKmers, new Range(other.rightKmer));
    this.matches.push(other);
  }
}
