import assert from "assert";
import { PairedOccurrence } from "./pairedOccurrence";
import { Region } from "../util/region";
import { Range } from "../util/range";

/**
 * A block is a collection of one or more consequent pairedOccurrences (kmers).
 *
 * A block can be extended with a new PairedOccurence if its kmer indices in both
 * files are directly after that of the block.
 */
export class Block {

  public pairs: Array<PairedOccurrence>;
  public leftKmers: Range;
  public rightKmers: Range;
  public leftSelection: Region;
  public rightSelection: Region;
  public mergedData: Array<string>;
  private mergedStart: number;
  private mergedStop: number;

  constructor(initial: PairedOccurrence) {
    this.pairs = [initial];
    this.leftKmers = new Range(initial.left.index);
    this.rightKmers = new Range(initial.right.index);
    this.leftSelection = initial.left.location;
    this.rightSelection = initial.right.location;
    this.mergedStart = initial.left.start;
    this.mergedData = initial.left.data;
    this.mergedStop = initial.left.stop;
  }

  private extendable(other: PairedOccurrence): boolean {
    return this.leftKmers.to == other.left.index &&
      this.rightKmers.to == other.right.index;
  }

  public extendWithPair(other: PairedOccurrence): void {
    assert(this.extendable(other), "match does not extend this block");
    this.pairs.push(other);

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
    this.mergedStop = other.left.stop;

    // Merge kmers index range
    this.leftKmers =
      Range.merge(this.leftKmers, new Range(other.left.index));
    this.rightKmers =
      Range.merge(this.rightKmers, new Range(other.right.index));

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

  public extendWithBlock(other: Block): void {
    const otherFirst = other.pairs[0];
    assert(this.extendable(otherFirst));

    this.pairs = this.pairs.concat(other.pairs);

    if (this.mergedStop < other.leftKmers.from) {
      for (let i = 0; i < (other.mergedStart - this.mergedStop - 1); i++) {
        this.mergedData.push("?");
      }
      for (let i = 0; i < other.mergedData.length; i++) {
        this.mergedData.push(other.mergedData[i]);
      }
    } else {
      for (let i = this.mergedStop - other.leftKmers.from + 1; i < other.mergedData.length; i++) {
        this.mergedData.push(other.mergedData[i]);
      }
    }

    this.mergedStop = other.mergedStop;

    // merge kmer ranges
    this.leftKmers =
      Range.merge(this.leftKmers, other.leftKmers);
    this.rightKmers =
      Range.merge(this.rightKmers, other.rightKmers);

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
