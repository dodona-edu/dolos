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

  public matches: Array<Match>;
  public leftKmers: Range;
  public rightKmers: Range;
  public leftSelection: Selection;
  public rightSelection: Selection;
  public mergedData: string;

  private mergedStop: number;

  constructor(initial: Match) {
    this.matches = [initial];
    this.leftKmers = new Range(initial.left.index);
    this.rightKmers = new Range(initial.right.index);
    this.leftSelection = initial.left.location;
    this.rightSelection = initial.right.location;
    this.mergedData = initial.left.data;
    this.mergedStop = initial.left.stop;
  }

  private extendable(other: Match): boolean {
    return this.leftKmers.to == other.left.index &&
      this.rightKmers.to == other.right.index;
  }

  public extendWithMatch(other: Match): void {
    assert(this.extendable(other), "match does not extend this fragment");
    this.matches.push(other);

    if (this.mergedStop < other.left.start) {
      this.mergedData += "|" + other.left.data;
    } else {
      this.mergedData +=
        other.left.data.substring(this.mergedStop - other.left.start + 1);
    }
    this.mergedStop = other.left.stop;

    // Merge kmers index range
    this.leftKmers =
      Range.merge(this.leftKmers, new Range(other.left.index));
    this.rightKmers =
      Range.merge(this.rightKmers, new Range(other.right.index));

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

  public extendWithFragment(other: Fragment): void {
    const otherFirst = other.matches[0];
    assert(this.extendable(otherFirst));

    this.matches = this.matches.concat(other.matches);

    if (this.mergedStop < other.leftKmers.from) {
      this.mergedData += "|" + other.mergedData;
    } else {
      this.mergedData +=
        other.mergedData.substring(this.mergedStop - other.leftKmers.from + 1);
    }

    this.mergedStop = other.mergedStop;

    // merge kmer ranges
    this.leftKmers =
      Range.merge(this.leftKmers, other.leftKmers);
    this.rightKmers =
      Range.merge(this.rightKmers, other.rightKmers);

    // merge selections
    this.leftSelection = Selection.merge(
      this.leftSelection,
      other.leftSelection,
    );
    this.rightSelection = Selection.merge(
      this.rightSelection,
      other.rightSelection,
    );

  }

}
