import assert from "assert";
import { Match } from "./match";
import { Selection } from "../util/selection";
import { Range } from "../util/range";

/**
 * A fragment is a collection of one or more consequent matches (kmers).
 *
 * A fragment can be extended with a new match if its kmer indices in both
 * files are directly after that of the fragment.
 */
export class Fragment {

  public matches: Array<Match<Selection>>;
  public leftKmers: Range;
  public rightKmers: Range;
  public leftSelection: Selection;
  public rightSelection: Selection;
  public mergedData: string;

  constructor(initial: Match<Selection>) {
    this.matches = [initial];
    this.leftKmers = new Range(initial.left.index);
    this.rightKmers = new Range(initial.right.index);
    this.leftSelection = initial.left.location;
    this.rightSelection = initial.right.location;
    this.mergedData = initial.left.data;
  }

  public extendable(other: Match<Selection>): boolean {
    return this.leftKmers.to == other.left.index &&
      this.rightKmers.to == other.right.index;
  }

  public extend(other: Match<Selection>): void {
    assert(this.extendable(other), "match does not extend this fragment");
    this.matches.push(other);

    // Merge kmers
    let i = this.mergedData.length - other.left.data.length;
    let j = other.left.data.length;
    while(
      i < this.mergedData.length &&
      this.mergedData.substring(i) !== other.left.data.substring(0, j)
    ){
      i += 1;
      j -= 1;
    }
    this.mergedData += other.left.data.substring(j);

    // Merge kmers index range
    this.leftKmers = Range.merge(this.leftKmers, new Range(other.left.index));
    this.rightKmers = Range.merge(this.rightKmers, new Range(other.right.index));

    // Merge selection
    this.leftSelection = Selection.merge(
      this.leftSelection,
      other.left.location
    );
    this.rightSelection = Selection.merge(
      this.rightSelection,
      other.right.location
    );

  }

}
