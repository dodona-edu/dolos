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

  public static diff(source: Region, ...other: Region[]) : Region[] {
    type Point = [number, number]
    const regionToPoints = (r: Region): [Point, Point] => [[r.startRow, r.startCol], [r.endRow, r.endCol]];
    const [startPoint, endPoint] = regionToPoints(source);

    const pointArray = other.map(regionToPoints);
    const pointMap = new Map(pointArray);

    const points = [startPoint, endPoint, ...pointMap.keys(), ...pointMap.values()];
    const sortfunc = (a: Point, b: Point): number => a[0] == b[0] ? (a[1] - b[1]) : (a[0] - b[0]);  
    points.sort(sortfunc);


    const result: Region[] = [];
    const stack: Set<Point> = new Set();
    let hasStarted = false;
    let currentIndex = 0;
    let firstPoint: Point | null = null;

    while (points[currentIndex] !== endPoint) {
      const p = points[currentIndex];

      if(p === startPoint)
        hasStarted = true;


      if(pointMap.has(p)) {

        if(stack.size == 0 && hasStarted)
          result.push(new Region(...firstPoint!, ...p));

        stack.add(pointMap.get(p)!);

      } else {
        stack.delete(p);
        if(stack.size == 0 && hasStarted)
          firstPoint = p;
      }

      currentIndex += 1;
    }

    if(stack.size == 0) {
      result.push(new Region(...firstPoint!, ...endPoint));
    }

    return result;
  }
}
