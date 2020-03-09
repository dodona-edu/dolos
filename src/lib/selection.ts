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

  public static merge(left: Selection, right: Selection): Selection {
    return new Selection(
      left.startRow, left.startCol,
      right.endRow, right.endCol
    );
  }

  constructor(
    public startRow: number,
    public startCol: number,
    public endRow: number,
    public endCol: number
  ) {
    if (startRow > endRow || (startRow === endRow && startCol > endCol)) {
      throw new Error(
        "startRow and startCol should be smaller than endRow and endCol"
      );
    }
  }

  public overlapsWith(other: Selection): boolean {
    const [left, right] = [this, other].sort();
    if (left.endRow < right.startRow) {
      return false;
    } else if (left.endRow === right.startRow) {
      return left.endCol < right.startCol;
    } else {
      return true;
    }
  }
}
