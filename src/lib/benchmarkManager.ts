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
    filterOptions: { minimumFragmentLength: 0 },
    gapSize: 0,
  };

  private static readonly htmlFormatter: HTMLBenchmarkFormatter = new HTMLBenchmarkFormatter();

  private benchMarks: Map<
    string,
    (benchmarkMatcher: BenchmarkMatcher) => Promise<void>
  > = new Map();

  private readonly generateHTML: boolean;

  private helper: BenchmarkHelper = new BenchmarkHelper(BenchmarkManager.defaultBenchmarkSettings);
  private benchmarkSettingsList: BenchMarkSettings[] = [];

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
    if (this.benchmarkSettingsList.length === 0) {
      this.benchmarkSettingsList.push(BenchmarkManager.defaultBenchmarkSettings);
    }
    for (const benchmarkSettings of this.benchmarkSettingsList.values()) {
      this.helper.benchmarkSettings = benchmarkSettings;
      for (const [name, benchmarkFunction] of this.benchMarks.entries()) {
        const benchmarkMatcher: BenchmarkMatcher = new BenchmarkMatcher(this.helper);
        await benchmarkFunction(benchmarkMatcher);
        if (benchmarkMatcher.result === undefined) {
          continue;
        }

        if (this.generateHTML) {
          jsonResults.push(benchmarkMatcher.result);
        } else {
          this.outputResultsToConsole(name, benchmarkMatcher.result);
        }
      }

      // TODO make sure things are clustered by settings
      if (this.generateHTML) {
        this.generateHTMLFile(jsonResults);
      }
    }
  }

  public addBenchmarkSettings(benchmarkSettings: BenchMarkSettings) {
    this.benchmarkSettingsList.push(benchmarkSettings);
  }

  private generateHTMLFile(jsonResults: BenchmarkResults[]) {
    const name: string = new Date().toISOString();
    const json: string = JSON.stringify(jsonResults, JSONFormatter.JSONReplacerFunction);
    const html: string = BenchmarkManager.htmlFormatter.format(json);
    fs.writeFileSync(`src/lib/__benchmarks__/${name}.html`, html, "utf8");
    fs.writeFileSync(`src/lib/__benchmarks__/latest.html`, html, "utf8");
  }

  private outputResultsToConsole(name: string, result: BenchmarkResults) {
    console.log(`${name} =>`);
    console.log(
      `\tmatchedLines: ${result.matchedLines}, missedLines: ${result.missedLines}, ` +
        `falseLines: ${result.falseLines}, falseMatches: ${result.falseMatches}, ` +
        `falseMatchingLines: ${result.falseMatchingLines}`,
    );
    console.log("");
  }
}
