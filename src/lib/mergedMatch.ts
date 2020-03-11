import assert from "assert";
import { Match } from "./match";
import { Selection } from "./selection";

export class MergedMatch {

  public matches: Array<Match<Selection>>;
  public left: Selection;
  public right: Selection;

  constructor(initial: Match<Selection>) {
    this.matches = [initial];
    this.left = initial.leftLocation;
    this.right = initial.rightLocation;
  }

  public mergeable(other: Match<Selection>): boolean {
    return this.left.overlapsWith(other.leftLocation)
          || this.right.overlapsWith(other.rightLocation);
  }

  public merge(other: Match<Selection>): void {
    assert(this.mergeable(other), "matches are not mergeable");
    this.left = Selection.merge(this.left, other.leftLocation);
    this.right = Selection.merge(this.right, other.rightLocation);
    this.matches.push(other);
  }

}
