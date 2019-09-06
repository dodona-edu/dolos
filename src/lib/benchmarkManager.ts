import { BenchmarkMatcher, BenchmarkResults } from "./benchmarkMatcher";
import { CodeTokenizer } from "./codeTokenizer";
import { Comparison, ComparisonOptions, Matches } from "./comparison";
import { Range } from "./range";
import { FilterOptions, RangesTuple, Summary } from "./summary";
import { Tokenizer } from "./tokenizer";

export type NumericRangesTuple = [[number, number], [number, number]];

/**
 * A class to manage benchmarks.
 */
export class BenchmarkManager {
  private static defaultFilterOptions: FilterOptions = {
    minimumFragmentLength: 1,
  };
  private static defaultComparisonOptions: ComparisonOptions = {
    filterHashByPercentage: undefined,
  };

  private static defaultGapSize: number = 1;

  private benchMarks: Map<string, () => Promise<void>> = new Map();

  private benchmarkResults: BenchmarkResults | undefined;

  /**
   * A shorthand function used to match two files.
   * @param file1 The first file you want to test.
   * @param file2 The second file you want to test.
   */
  public async match(file1: string, file2: string): Promise<RangesTuple[]> {
    const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
    const comparison: Comparison<number> = new Comparison(
      tokenizer,
      BenchmarkManager.defaultComparisonOptions,
    );
    await comparison.addFile(file1);

    const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles([file2]);

    const filterOptions: FilterOptions = BenchmarkManager.defaultFilterOptions;
    const summary = new Summary(matchesPerFile, BenchmarkManager.defaultGapSize, filterOptions, 0);

    if (!summary.results.has(file2)) {
      return [];
    }
    const results: Matches<Range> = summary.results.get(file2) as Matches<Range>;

    if (!results.has(file1)) {
      return [];
    }

    return results.get(file1) as RangesTuple[];
  }

  /**
   * Registers a benchmark under a certain name.
   * @param benchmarkName The name for the benchmark.
   * @param benchmarkFunction The function that contains the benchmark.
   */
  public async benchmark(benchmarkName: string, benchmarkFunction: () => Promise<void>) {
    this.benchMarks.set(benchmarkName, benchmarkFunction);
  }

  /**
   * Execute all registered benchmarks.
   */
  public async executeBenchmarks() {
    for (const [name, benchmarkFunction] of this.benchMarks.entries()) {
      await benchmarkFunction();
      console.log(`${name} =>`);
      if (this.benchmarkResults) {
        console.log(
          `\tmatchedLines: ${this.benchmarkResults.matchedLines}, missedLines: ${this.benchmarkResults.missedLines}, ` +
            `falseLines: ${this.benchmarkResults.falseLines}, falseMatches: ${this.benchmarkResults.falseMatches}, ` +
            ` falseMatchingLines: ${this.benchmarkResults.falseMatchingLines}`,
        );
      }
      console.log("");
    }
  }

  private benchmarkMatcher: BenchmarkMatcher | undefined;
  public expect(expected: NumericRangesTuple[]): this {
    this.benchmarkMatcher = new BenchmarkMatcher(expected);
    return this;
  }

  public toBePresentIn(actual: RangesTuple[]) {
    if(this.benchmarkMatcher === undefined) {
      throw Error("cannot call toBePresentIn without calling expect");
    }
    this.benchmarkResults = this.benchmarkMatcher.toBePresentIn(actual);
  }
}
