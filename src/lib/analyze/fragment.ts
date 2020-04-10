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
    this.leftKmers = new Range(initial.leftKmer);
    this.rightKmers = new Range(initial.rightKmer);
    this.leftSelection = initial.leftLocation;
    this.rightSelection = initial.rightLocation;
    this.mergedData = initial.leftData;
  }

  public extendable(other: Match<Selection>): boolean {
    return this.leftKmers.to == other.leftKmer &&
      this.rightKmers.to == other.rightKmer;
  }

  public extend(other: Match<Selection>): void {
    assert(this.extendable(other), "match does not extend this fragment");
    this.matches.push(other);

    // Merge kmers
    let i = this.mergedData.length - other.leftData.length;
    let j = other.leftData.length;
    while(
      i < this.mergedData.length &&
      this.mergedData.substring(i) !== other.leftData.substring(0, j)
    ){
      i += 1;
      j -= 1;
    }
    this.mergedData += other.leftData.substring(j);

    // Merge kmers index range
    this.leftKmers = Range.merge(this.leftKmers, new Range(other.leftKmer));
    this.rightKmers = Range.merge(this.rightKmers, new Range(other.rightKmer));

    // Merge selection
    this.leftSelection = Selection.merge(
      this.leftSelection,
      other.leftLocation
    );
    this.rightSelection = Selection.merge(
      this.rightSelection,
      other.rightLocation
    );

  }

}
