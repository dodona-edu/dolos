export class Range {
  private lowerBound: number;
  private upperBound: number;

  constructor(from: number, to: number) {
    if (from > to) {
      throw RangeError("from must be lower then to");
    }
    this.lowerBound = from;
    this.upperBound = to;
  }

  public get from(): number {
    return this.lowerBound;
  }

  public get to(): number {
    return this.upperBound;
  }

  public equals(other: Range): boolean {
    return this.to === other.to && this.from === other.from;
  }

  /**
   * Tests wether or not the given number can extend the range.
   * @param value The number you want to test.
   * @param gapSize The maximum gap size you want to allow. For example if the gap size is 0 then 2 cannot extend [4,5].
   * If you take a gap size of 1 however then the range can be extended and would become [2,5].
   */
  public canExtendWithNumber(value: number, gapSize: number = 0): boolean {
    return this.from - 1 - gapSize <= value && value <= this.to + 1 + gapSize;
  }

  public includes(value: number): boolean {
    return this.from <= value && value <= this.to;
  }

  /**
   * Extends the range with the given number.
   * @param value
   * @returns A reference to this.
   */
  public extendWithNumber(value: number): this {
    this.lowerBound = Math.min(value, this.from);
    this.upperBound = Math.max(value, this.to);
    return this;
  }

  /**
   * Extends the range with the given range in place. The given range will not be changed.
   * @param range The range you want this range to be extended by.
   */
  public extendWithRange(range: Range): this {
    this.lowerBound = Math.min(range.from, this.from);
    this.upperBound = Math.max(range.to, this.to);
    return this;
  }

  /**
   * Tests wether or not the given range can extend the current range.
   * @param range The range you want to test if can be used to extend the current range with.
   * @param gapSize The maximum gap size you want to allow. For example if the gap size is 0 then [1, 3] and [5,6]
   * will not be joined. If you take a gap size of 1 however then the ranges can be combined into [1,6].
   * @returns A boolean if the range can be used to extend the current range.
   */
  public canExtendWithRange(range: Range, gapSize: number = 0): boolean {
    const test =
      this.canExtendWithNumber(range.from, gapSize) ||
      this.canExtendWithNumber(range.to, gapSize) ||
      range.canExtendWithNumber(this.to, gapSize) ||
      range.canExtendWithNumber(this.from, gapSize);
    return test;
  }

  /**
   * Tests if the two ranges overlap.//TODO
   * @param other The other range
   */
  public overlappingLinesAmount(other: Range): number {
    if (!this.canExtendWithRange(other, 0)) {
      return 0;
    }

    if (Math.sign(this.from - other.from) !== Math.sign(this.to - other.to)) {
      return Math.min(this.getLineCount(), other.getLineCount());
    } else {
      return Math.min(this.to - other.from, other.to - this.from) + 1;
    }
  }

  public toString(): string {
    return `[${this.from + 1}, ${this.to + 1}]`;
  }

  /**
   * @returns The amount of lines in this range.
   */
  public getLineCount(): number {
    return this.to - this.from + 1;
  }
}
