import { assert } from "../util/utils.js";
import { PairedOccurrence } from "./pairedOccurrence.js";
import { Region } from "../util/region.js";
import { Range } from "../util/range.js";

/**
 * A fragment is a collection of one or more consequent pairedOccurrences (kgrams).
 *
 * A fragment can be extended with a new PairedOccurence if its kgram indices in both
 * files are directly after that of the fragment.
 */
export class Fragment {

  public pairs: Array<PairedOccurrence>;
  public leftkgrams: Range;
  public rightkgrams: Range;
  public leftSelection: Region;
  public rightSelection: Region;
  public mergedData: Array<string> | null;
  private mergedStart: number;
  private mergedStop: number;

  constructor(initial: PairedOccurrence) {
    this.pairs = [initial];
    this.leftkgrams = new Range(initial.left.index);
    this.rightkgrams = new Range(initial.right.index);
    this.leftSelection = initial.left.location;
    this.rightSelection = initial.right.location;
    this.mergedStart = initial.left.start;
    this.mergedData = initial.left.data;
    this.mergedStop = initial.left.stop;
  }

  private extendable(other: PairedOccurrence): boolean {
    return this.leftkgrams.to == other.left.index &&
      this.rightkgrams.to == other.right.index;
  }

  public extendWith(other: PairedOccurrence): void {
    assert(this.extendable(other), "match does not extend this fragment");
    this.pairs.push(other);

    if(this.mergedData && other.left.data) {
      if (this.mergedStop < other.left.start) {

        for (let i = 0; i < (other.left.start - this.mergedStop - 1); i++) {
          this.mergedData.push("?");
        }
        for (let i = 0; i < other.left.data.length; i++) {
          this.mergedData.push(other.left.data[i]);
        }
      } else {
        for (let i = this.mergedStop - other.left.start + 1; i < other.left.data.length; i++) {
          this.mergedData.push(other.left.data[i]);
        }
      }
    }

    this.mergedStop = other.left.stop;

    // Merge kgrams index range
    this.leftkgrams =
      Range.merge(this.leftkgrams, new Range(other.left.index));
    this.rightkgrams =
      Range.merge(this.rightkgrams, new Range(other.right.index));

    // Merge selection
    this.leftSelection = Region.merge(
      this.leftSelection,
      other.left.location
    );
    this.rightSelection = Region.merge(
      this.rightSelection,
      other.right.location
    );

  }

  public extendWithFragment(other: Fragment): void {
    const otherFirst = other.pairs[0];
    assert(this.extendable(otherFirst));

    this.pairs = this.pairs.concat(other.pairs);

    if (this.mergedData && other.mergedData) {
      if (this.mergedStop < other.leftkgrams.from) {
        for (let i = 0; i < (other.mergedStart - this.mergedStop - 1); i++) {
          this.mergedData.push("?");
        }
        for (let i = 0; i < other.mergedData.length; i++) {
          this.mergedData.push(other.mergedData[i]);
        }
      } else {
        for (let i = this.mergedStop - other.leftkgrams.from + 1; i < other.mergedData.length; i++) {
          this.mergedData.push(other.mergedData[i]);
        }
      }
    }

    this.mergedStop = other.mergedStop;

    // merge kgram ranges
    this.leftkgrams =
      Range.merge(this.leftkgrams, other.leftkgrams);
    this.rightkgrams =
      Range.merge(this.rightkgrams, other.rightkgrams);

    // merge selections
    this.leftSelection = Region.merge(
      this.leftSelection,
      other.leftSelection,
    );
    this.rightSelection = Region.merge(
      this.rightSelection,
      other.rightSelection,
    );

  }

}
