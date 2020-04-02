import assert from "assert";

/**
 * Defines a selection in a file.
 */
export class Selection {

  public static compare(left: Selection, right: Selection): number {
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

  public static merge(one: Selection, other: Selection): Selection {
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
    return new Selection(startRow, startCol, endRow, endCol);
  }

  constructor(
    public startRow: number,
    public startCol: number,
    public endRow: number,
    public endCol: number
  ) {
    assert(
      startRow < endRow || (startRow === endRow && startCol < endCol),
      "startRow and startCol should be smaller than endRow and endCol"
    );
  }

  public overlapsWith(other: Selection): boolean {
    const [left, right] = [this, other].sort(Selection.compare);
    if (left.endRow < right.startRow) {
      return false;
    } else if (left.endRow === right.startRow) {
      return right.startCol < left.endCol;
    } else {
      return true;
    }
  }
}
