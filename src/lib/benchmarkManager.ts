import { BenchmarkMatcher, BenchmarkResults } from "./benchmarkMatcher";
import { CodeTokenizer } from "./codeTokenizer";
import { Comparison, ComparisonOptions, Matches } from "./comparison";
import { HTMLBenchmarkFormatter } from "./htmlBenchmarkFormatter";
import { JSONFormatter } from "./jsonFormatter";
import { Range } from "./range";
import { FilterOptions, RangesTuple, Summary } from "./summary";
import { Tokenizer } from "./tokenizer";

export type NumericRangesTuple = [[number, number], [number, number]];
export interface BenchmarkResultsJSONFormat {
  matchingFile: string;
  matchedFile: string;
  expected: RangesTuple[];
  actual: RangesTuple[];
  benchmarkResults: BenchmarkResults;
}
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

  private benchmarkMatcher: BenchmarkMatcher | undefined;

  private readonly generateHTML: boolean;

  private matchedFile: string | undefined;
  private matchingFile: string | undefined;
  private expected: RangesTuple[] | undefined;
  private actual: RangesTuple[] | undefined;

  constructor(generateHTML: boolean = false) {
    this.generateHTML = generateHTML;
  }
  /**
   * A shorthand function used to match two files.
   * @param file1 The first file you want to test.
   * @param file2 The second file you want to test.
   */
  public async match(file1: string, file2: string): Promise<this> {
    this.matchedFile = file1;
    this.matchingFile = file2;
    this.expected = [];
    this.actual = [];

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
      return this;
    }
    const results: Matches<Range> = summary.results.get(file2) as Matches<Range>;

    if (!results.has(file1)) {
      return this;
    }

    this.actual = results.get(file1) as RangesTuple[];
    return this;
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
    const jsonResults: BenchmarkResultsJSONFormat[] = [];
    for (const [name, benchmarkFunction] of this.benchMarks.entries()) {
      await benchmarkFunction();
      if (this.generateHTML) {
        jsonResults.push({
          actual: this.actual as RangesTuple[],
          benchmarkResults: this.benchmarkResults as BenchmarkResults,
          expected: this.expected as RangesTuple[],
          matchedFile: this.matchedFile as string,
          matchingFile: this.matchingFile as string,
        });
      }

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

    if (this.generateHTML) {
      const html: string = HTMLBenchmarkFormatter.format(
        JSON.stringify(this.benchmarkResults, JSONFormatter.JSONReplacerFunction),
      );
      fs.writeFileSync("src/dist/__benchmarks__/" + new Date().toISOString(), html, "utf8");
    }
  }
  public expect(expected: NumericRangesTuple[]): this {
    this.benchmarkMatcher = new BenchmarkMatcher(expected);
    return this;
  }

  public toBePresentIn(actual: RangesTuple[]) {
    this.actual = actual;
    if (this.benchmarkMatcher === undefined) {
      throw Error("cannot call toBePresentIn without calling expect");
    }
    this.benchmarkResults = this.benchmarkMatcher.toBePresentIn(actual);
  }
}
import fs from "fs";
