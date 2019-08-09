
export class Range {
  private from: number;
  private to: number;
  private readonly gapSize: number;

  constructor(from: number, to: number, gapSize: number) {
    this.from = from;
    this.to = to;
    this.gapSize = gapSize;
  }


  /**
   * Tests if the given number can extend the range.
   * @param value The number you want to test.
   */
  public canExtendWithNumber(value: number): boolean {
    return (this.from <= value && value <= this.to) ||
           (value < this.from && this.to - value - 1 <= this.gapSize) ||
           (this.to < value && value - this.to - 1 <= this.gapSize)
  }

  /**
   * Extends the range with the given number. Allows for a gap as long as that gap is smaller or equal to
   * [[this.gapSize]]. If the number is smaller or bigger than the lower, and upper bounds respectively then the
   * corresponding bound is replaced. If the number is smaller than the upper bound and bigger than the lower then the
   * range does not change. Nothing will happen if the number cannot extend the range.
   * @param value
   * @returns A reference to this.
   */
  public extendWithNumber(value: number): this {
    this.from = Math.min(value, this.from);
    this.to = Math.max(value, this.to);
    return this;
  }


  /**
   * Attempts to extend the range in place with the given range. The given range will not be changed.
   * @param range The range you want this range to be extended by.
   */
  public extendWithRange(range: Range): this {
    if (this.canExtendWithRange(range)) {
      this.from = Math.min(range.from, this.from);
      this.to = Math.max(range.to, this.to);
    }
    return this;
  }

  /**
   * The gap size of this range will be used to perform this test, so if the gap size of the two ranges differ then
   * the result might not be what you expect.
   * @param range The range you want to test if can be used to extend the current range with.
   * @returns A boolean if the range can be used to extend the current range.
   */
  public canExtendWithRange(range: Range): boolean {
    return (
      this.canExtendWithNumber(range.from) &&
      this.canExtendWithNumber(range.to)
    );
  }

  /**
   * @param zeroBased If true the lines will be zero based, if it is true it will be 1-based
   */
  public toString(zeroBased: boolean=false): string {
    if(zeroBased){
      return `[${this.from}, ${this.to}]`;
    } else {
      return `[${this.from+1}, ${this.to+1}]`;
    }
  }

  /**
   * @returns The amount of lines in this range.
   */
  public getLineCount(): number {
    return this.to - this.from + 1;
  }
}
