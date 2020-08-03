import assert from "assert";

/**
 * Defines a selection in a file.
 */
export class Region {

  public static compare(left: Region, right: Region): number {
    let diff = left.startRow - right.startRow;
    if (diff !== 0) { return diff; }
    diff = left.startCol - right.startCol;
    if (diff !== 0) { return diff; }
    diff = left.endRow - right.endRow;
    if (diff !== 0) { return diff; }
    diff = left.endCol - right.endCol;
    if (diff !== 0) { return diff; }
    return 0;
  }

  public static valid(
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): boolean {
    return startRow < endRow || (startRow === endRow && startCol <= endCol);
  }

  public static isInOrder(first: Region, second: Region): boolean {
    return Region.valid(
      first.startRow, first.startCol,
      second.endRow, second.endCol
    );
  }

  public static merge(one: Region, other: Region): Region {
    let startRow, startCol, endRow, endCol;
    if(one.startRow < other.startRow) {
      startRow = one.startRow;
      startCol = one.startCol;
    } else if (one.startRow > other.startRow) {
      startRow = other.startRow;
      startCol = other.startCol;
    } else {
      startRow = one.startRow;
      startCol = Math.min(one.startCol, other.startCol);
    }
    if(one.endRow > other.endRow) {
      endRow = one.endRow;
      endCol = one.endCol;
    } else if (one.endRow < other.endRow) {
      endRow = other.endRow;
      endCol = other.endCol;
    } else {
      endRow = one.endRow;
      endCol = Math.max(one.endCol, other.endCol);
    }
    return new Region(startRow, startCol, endRow, endCol);
  }

  constructor(
    public startRow: number,
    public startCol: number,
    public endRow: number,
    public endCol: number
  ) {
    assert(
      Region.valid(startRow, startCol, endRow, endCol),
      "startRow and startCol should be smaller than endRow and endCol, was " +
      `new Selection(${startRow}, ${startCol}, ${endRow}, ${endCol})`
    );
  }

  public overlapsWith(other: Region): boolean {
    const [left, right] = [this, other].sort(Region.compare);
    if (left.endRow < right.startRow) {
      return false;
    } else if (left.endRow === right.startRow) {
      return right.startCol < left.endCol;
    } else {
      return true;
    }
  }

  public toString(): string {
    return `Selection {${this.startRow}:${this.startCol} ` +
      `-> ${this.endRow}:${this.endCol}}`;
  }
}
