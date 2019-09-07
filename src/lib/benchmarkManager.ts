import fs from "fs";
import { BenchmarkHelper, BenchMarkSettings } from "./benchmarkHelper";
import { BenchmarkMatcher, BenchmarkResults } from "./benchmarkMatcher";
import { HTMLBenchmarkFormatter } from "./htmlBenchmarkFormatter";
import { JSONFormatter } from "./jsonFormatter";

export type NumericRangesTuple = [[number, number], [number, number]];
/**
 * A class to manage benchmarks.
 */
export class BenchmarkManager {
  private static readonly defaultBenchmarkSettings: BenchMarkSettings = {
    comparisonOptions: { filterHashByPercentage: undefined },
    filterOptions: { minimumFragmentLength: 1 },
    gapSize: 1,
  };

  private static readonly htmlFormatter: HTMLBenchmarkFormatter = new HTMLBenchmarkFormatter();

  private benchMarks: Map<
    string,
    (benchmarkMatcher: BenchmarkMatcher) => Promise<void>
  > = new Map();

  private readonly generateHTML: boolean;

  private helper: BenchmarkHelper = new BenchmarkHelper(BenchmarkManager.defaultBenchmarkSettings);

  constructor(generateHTML: boolean = false) {
    this.generateHTML = generateHTML;
  }

  /**
   * Registers a benchmark under a certain name.
   * @param benchmarkName The name for the benchmark.
   * @param benchmarkFunction The function that contains the benchmark.
   */
  public async benchmark(
    benchmarkName: string,
    benchmarkFunction: (benchmarkMather: BenchmarkMatcher) => Promise<void>,
  ) {
    this.benchMarks.set(benchmarkName, benchmarkFunction);
  }
  /**
   * Execute all registered benchmarks.
   */
  public async executeBenchmarks() {
    const jsonResults: BenchmarkResults[] = [];
    for (const [name, benchmarkFunction] of this.benchMarks.entries()) {
      const benchmarkMatcher: BenchmarkMatcher = new BenchmarkMatcher(this.helper);
      await benchmarkFunction(benchmarkMatcher);
      if (benchmarkMatcher.result === undefined) {
        continue;
      }

      if (this.generateHTML) {
        jsonResults.push(benchmarkMatcher.result);
      } else {
        const result: BenchmarkResults = benchmarkMatcher.result;
        console.log(`${name} =>`);
        console.log(
          `\tmatchedLines: ${result.matchedLines}, missedLines: ${result.missedLines}, ` +
            `falseLines: ${result.falseLines}, falseMatches: ${result.falseMatches}, ` +
            `falseMatchingLines: ${result.falseMatchingLines}`,
        );
        console.log("");
      }
    }

    if (this.generateHTML) {
      const name: string = new Date().toISOString();
      const json: string = JSON.stringify(jsonResults, JSONFormatter.JSONReplacerFunction);
      const html: string = BenchmarkManager.htmlFormatter.format(json);
      fs.writeFileSync(`src/lib/__benchmarks__/${name}.html`, html, "utf8");
      fs.writeFileSync(`src/lib/__benchmarks__/latest.html`, html, "utf8");
    }
  }
}
