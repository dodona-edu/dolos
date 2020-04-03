import assert from "assert";

/**
 * A range of whole numbers starting at `from` (inclusive) and ending at `to`
 * (Exclusive).
 */
export class Range {

  public static merge(one: Range, other: Range): Range {
    return new Range(
      Math.min(one.from, other.from),
      Math.max(one.to, other.to)
    );
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
      return this.to > other.from
    } else if (this.from > other.from) {
      return other.to > this.from;
    } else { // 'from' overlaps
      return true;
    }
  }
}
