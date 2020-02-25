import { Match } from "./match";
import { Selection } from "./selection";

export class MergedMatch {

  public matches: Array<Match<Selection>>;
  private left: Selection;
  private right: Selection;

  constructor(initial: Match<Selection>) {
    this.matches = [initial];
    this.left = initial.leftLocation;
    this.right = initial.rightLocation;
  }

  public merge(other: Match<Selection>): boolean {
    if (this.left.overlapsWith(other.leftLocation)
      || this.right.overlapsWith(other.rightLocation)) {
      this.left = Selection.merge(this.left, other.leftLocation);
      this.right = Selection.merge(this.right, other.rightLocation);
      this.matches.push(other);
      return true;
    }
    return false;
  }

}
