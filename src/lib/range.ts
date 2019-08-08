

enum RangeNumberEnum {
    Lower, Upper, Middle, NotInRange
}


export class Range {
    private lowerBound: number;
    private upperBound: number;
    private static gapSize :number;

    public static setGapSize(gapSize: number): void {
        Range.gapSize = gapSize;
    }
    constructor(lowerBound: number, upperBound: number ) {
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
    }

  /**
   * tests if the number is withing the given range. This function allows for gaps
   * as long as the gap is smaller than [[Range.gapSize]]
   * @param value the number you want to test
   */
  public whereCanNumberExtend(value: number): RangeNumberEnum {
    if (this.lowerBound <= value && value <= this.upperBound) {
      return RangeNumberEnum.Middle;
    } else if (value < this.lowerBound && this.upperBound - value - 1 <= Range.gapSize) {
      return RangeNumberEnum.Lower;
    } else if (this.upperBound < value && value - this.upperBound - 1 <= Range.gapSize) {
      return RangeNumberEnum.Upper;
    } else {
      return RangeNumberEnum.NotInRange;
    }
  }


  /**
   * extends the range with the given number. Allows for a gap as long as that gap is smaller or equal to
   * [[Range.gapSize]]. If the number is smaller or bigger than the lower, and upper bounds respectively then the
   * corresponding bound is replaced. If the number is smaller than the upper bound and bigger than the lower then the
   * range does not change. The number cannot extend the range then undefined is returned.
   * @param value
   */
  public extendWithNumber(value: number): void {
    const rangeNumber: RangeNumberEnum = this.whereCanNumberExtend(value);
    switch (rangeNumber) {
      case RangeNumberEnum.Lower: {
        this.lowerBound = value;
        break;
      }
      case RangeNumberEnum.Upper: {
        this.upperBound = value;
        break;
      }
    }
  }

  /**
   * Attempts to extend the range in place with the given range. The given range will not be changed.
   * @param range the range you want this range to be extended by.
   */
  public extendWithRange(range: Range): void {
      if(this.canExtendWithRange(range)) {
        this.lowerBound = Math.min(range.lowerBound, this.lowerBound);
        this.upperBound = Math.max(range.upperBound, this.upperBound);
      }
  }

  public canExtendWithRange(range: Range): boolean {
    return (this.whereCanNumberExtend(range.lowerBound) !== RangeNumberEnum.NotInRange) ||
       this.whereCanNumberExtend(range.upperBound) !== RangeNumberEnum.NotInRange;
  }

  public toString(): string {
    return `[${this.lowerBound}, ${this.upperBound}]`;
  }

  /**
   * @returns The amount of lines in this range
   */
  public getLineCount(): number {
    return this.upperBound - this.lowerBound + 1;
  }

}