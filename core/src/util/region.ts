import { assert } from "./utils.js";


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

  /**
   * This function takes the first 'difference' of one region with a list of other regions.
   * The 'difference' of a region is every interval [(x1,y1), (x2, y2)] that is only covered by the source region.
   *
   * In this case, this is useful for determining the region a node covers without taking its children into account.
   *
   * Every region that belongs to the diff (that is covered by source, and not by any other) is called a 'good' region.
   * @param source
   * @param others
   * @returns the first 'difference' region, or null if there is none.
   */
  public static firstDiff(source: Region, others: Region[]) : Region | null {
    type Point = [number, number]
    const regionToPoints = (r: Region): [Point, Point] => [[r.startRow, r.startCol], [r.endRow, r.endCol]];
    const [startPoint, endPoint] = regionToPoints(source);

    const pointArray = others.map(regionToPoints);
    // This map contains all the startpoints mapped to their respective endpoints.
    // This is how we will identify the closing point of this token
    const pointMap = new Map(pointArray);

    const points = [startPoint, endPoint].concat(Array.from(pointMap.keys())).concat(Array.from(pointMap.values()));
    const sortfunc = (a: Point, b: Point): number => a[0] == b[0] ? (a[1] - b[1]) : (a[0] - b[0]);
    points.sort(sortfunc);

    // The "points" array now contains all the points (both opening and closing) sorted by their position.
    // We will traverse this array from left to right (beginning of region to end of region) to evaluate whether
    // a spot is covered by the source region and/or other regions.

    // This stack contains all regions that are 'active' or cover this interval
    // (at the current point in the traversal process)
    const stack: Set<Point> = new Set();
    let hasStarted = false;
    let currentIndex = 0;
    let firstPoint: Point | null = null;

    // Traversing the points list
    while (points[currentIndex] !== endPoint) {
      const p = points[currentIndex];

      // Extra boolean to check whether we are currently covering the source interval
      if(p === startPoint) {
        hasStarted = true;
      }


      // If this point is a starting point of a child region
      if(pointMap.has(p)) {
        // If we used to be covered by the source region (hasStarted) and by no child regions (stack size == 0)
        // then this region is 'good'.
        if(stack.size == 0 && hasStarted) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return new Region(...firstPoint!, ...p);
        }

        // Register that the current region is covered by a child
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        stack.add(pointMap.get(p)!);

      } else {
        // If this point is the end point of a region, then we remove the end point of this region from the stack.
        // We also register the current point as the starting point of a 'good' region
        stack.delete(p);
        if(stack.size == 0 && hasStarted) {
          firstPoint = p;
        }
      }

      currentIndex += 1;
    }

    if(stack.size == 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return new Region(...firstPoint!, ...endPoint);
    } else {
      return null;
    }
  }
}
