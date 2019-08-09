enum RangeNumberEnum {
  Lower,
  Upper,
  Middle,
  NotInRange,
}

export class Range {
  private lowerBound: number;
  private upperBound: number;
  private readonly gapSize: number;

  constructor(lowerBound: number, upperBound: number, gapSize: number) {
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
    this.gapSize = gapSize;
  }

  /**
   * Tests if and where the given number can extend this range. There are four possible return values, all part of the
   * RangeNumberEnum: Lower, Upper if the number can extend the lower and upper bound of the range respectively. Middle
   * if the number is within the range but does not extend it in any way. Finally NotInRange, when the number cannot
   * extend the range. This function allows for gaps as long as the gap is smaller than [[this.gapSize]]
   * @param value the number you want to test
   */
  public whereCanNumberExtend(value: number): RangeNumberEnum {
    if (this.lowerBound <= value && value <= this.upperBound) {
      return RangeNumberEnum.Middle;
    } else if (value < this.lowerBound && this.upperBound - value - 1 <= this.gapSize) {
      return RangeNumberEnum.Lower;
    } else if (this.upperBound < value && value - this.upperBound - 1 <= this.gapSize) {
      return RangeNumberEnum.Upper;
    } else {
      return RangeNumberEnum.NotInRange;
    }
  }

  /**
   * Tests if the given number can extend the range.
   * @param value The number you want to test.
   */
  public canExtendWithNumber(value: number): boolean {
    return this.whereCanNumberExtend(value) !== RangeNumberEnum.NotInRange;
  }

  /**
   * Extends the range with the given number. Allows for a gap as long as that gap is smaller or equal to
   * [[this.gapSize]]. If the number is smaller or bigger than the lower, and upper bounds respectively then the
   * corresponding bound is replaced. If the number is smaller than the upper bound and bigger than the lower then the
   * range does not change. Nothing will happen if the number cannot extend the range.
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
   * @param range The range you want this range to be extended by.
   */
  public extendWithRange(range: Range): void {
    if (this.canExtendWithRange(range)) {
      this.lowerBound = Math.min(range.lowerBound, this.lowerBound);
      this.upperBound = Math.max(range.upperBound, this.upperBound);
    }
  }

  /**
   * The gap size of this range will be used to perform this test, so if the gap size of the two ranges differ then
   * the result might not be what you expect.
   * @param range The range you want to test if can be used to extend the current range with.
   * @returns A boolean if the range can be used to extend the current range.
   */
  public canExtendWithRange(range: Range): boolean {
    return (
      this.whereCanNumberExtend(range.lowerBound) !== RangeNumberEnum.NotInRange ||
      this.whereCanNumberExtend(range.upperBound) !== RangeNumberEnum.NotInRange
    );
  }

  public toString(zeroBased?: true): string {
    if(zeroBased){
      return `[${this.lowerBound}, ${this.upperBound}]`;
    } else {
      return `[${this.lowerBound+1}, ${this.upperBound+1}]`;
    }
  }

  /**
   * @returns The amount of lines in this range.
   */
  public getLineCount(): number {
    return this.upperBound - this.lowerBound + 1;
  }
}
