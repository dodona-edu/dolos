import { assert } from "./utils.js";

/**
 * A range of whole numbers starting at `from` (inclusive) and ending at `to`
 * (Exclusive).
 */
export class Range {

  public static compare(one: Range, other: Range): number {
    if (one.from == other.from){
      return one.to - other.to;
    } else {
      return one.from - other.from;
    }
  }

  public static compareEnds(one: Range, other: Range): number {
    if (one.to == other.to) {
      return one.from - other.from;
    } else {
      return one.to - other.to;
    }
  }

  public static merge(one: Range, other: Range): Range {
    return new Range(
      Math.min(one.from, other.from),
      Math.max(one.to, other.to)
    );
  }

  public static totalCovered(ranges: Array<Range>): number {
    let total = 0;
    let last = 0;
    for (const range of ranges.sort(Range.compare)) {
      if(last < range.to) {
        total += range.to - Math.max(last, range.from);
        last = range.to;
      }
    }
    return total;
  }


  constructor(
    public readonly from: number,
    public readonly to: number = -1
  ){
    if(this.to == -1) {
      this.to = this.from + 1;
    }
    assert(
      this.from < this.to,
      "'from' should be smaller than 'to'"
    );
  }

  get length(): number {
    return this.to - this.from;
  }

  public overlapsWith(other: Range): boolean {
    if (this.from < other.from) {
      return this.to > other.from;
    } else if (this.from > other.from) {
      return other.to > this.from;
    } else { // 'from' overlaps
      return true;
    }
  }

  public contains(other: Range): boolean {
    return this.from <= other.from && other.to <= this.to;
  }
}
