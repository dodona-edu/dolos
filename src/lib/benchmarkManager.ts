import fs from "fs";
import { BenchmarkHelper, BenchMarkSettings } from "./benchmarkHelper";
import { BenchmarkMatcher, BenchmarkResults } from "./benchmarkMatcher";
import { HTMLBenchmarkFormatter } from "./htmlBenchmarkFormatter";
import { JSONFormatter } from "./jsonFormatter";
import { ObjectMap, Utils } from "./utils";

export type NumericRangesTuple = [[number, number], [number, number]];
/**
 * A class to manage benchmarks.
 */
export class BenchmarkManager {
  public static readonly defaultBenchmarkSettings: BenchMarkSettings = {
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

  /**
   * @param generateHTML Wither or not to generate an html output.
   */
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
    const benchmarkResultsList: ObjectMap<Array<[string, BenchmarkResults]>> = {};
    if (this.benchmarkSettingsList.length === 0) {
      this.benchmarkSettingsList.push(BenchmarkManager.defaultBenchmarkSettings);
    }
    for (const benchmarkSettings of this.benchmarkSettingsList.values()) {
      const results: Array<[string, BenchmarkResults]> = [];
      this.helper.benchmarkSettings = benchmarkSettings;
      for (const [name, benchmarkFunction] of this.benchMarks.entries()) {
        const benchmarkMatcher: BenchmarkMatcher = new BenchmarkMatcher(this.helper);
        await benchmarkFunction(benchmarkMatcher);
        if (benchmarkMatcher.result === undefined) {
          continue;
        }

        results.push([name, benchmarkMatcher.result]);
      }
      benchmarkResultsList[JSON.stringify(benchmarkSettings)] = results;
    }
    if (this.generateHTML) {
      this.generateHTMLFile(benchmarkResultsList);
    } else {
      this.outputResultsToConsole(benchmarkResultsList);
    }
  }

  /**
   * Add a benchmark setting to the list of benchmarks. If none are add then only the no-filter options is executed.
   * @param benchmarkSettings The benchmark setting you want to add.
   */
  public addBenchmarkSettings(benchmarkSettings: BenchMarkSettings) {
    this.benchmarkSettingsList.push(benchmarkSettings);
  }

  /**
   * A benchmark setting where no filtering is applied.
   */
  public get benchmarkSettingNoFilter(): BenchMarkSettings {
    return BenchmarkManager.defaultBenchmarkSettings;
  }

  /**
   * Set all the benchmark settings. Overwrites previous values.
   */
  public set benchmarkSettings(benchmarkSettings: BenchMarkSettings[]) {
    this.benchmarkSettingsList = benchmarkSettings;
  }

  /**
   * A function used to generate an html output. Will write to a file with the current timestamp and overwrite the
   * current latest.html. Both files are written to the `__benchmarks__` directory
   * @param jsonResults The results you want to show on the html page.
   */
  private generateHTMLFile(resultsMap: ObjectMap<Array<[string, BenchmarkResults]>>) {
    const fileName: string = new Date().toISOString();
    const json: string = JSON.stringify(resultsMap, JSONFormatter.JSONReplacerFunction);
    const html: string = BenchmarkManager.htmlFormatter.format(json);
    fs.writeFileSync(`src/lib/__benchmarks__/${fileName}.html`, html, "utf8");
    fs.writeFileSync(`src/lib/__benchmarks__/latest.html`, html, "utf8");
  }

  /**
   * Prints the given result to the console.
   * @param resultsMap The results you want to pint to the console.
   */
  private outputResultsToConsole(resultsMap: ObjectMap<Array<[string, BenchmarkResults]>>) {
    for (const [options, results] of Object.entries(resultsMap)) {
      console.log(Utils.colour("FgGreen", `${options} => `));
      for (const [name, result] of results.values()) {
        console.log(
          Utils.colour("FgRed", `\t${name} => `) +
            `matchedLines: ${result.matchedLines}, missedLines: ${result.missedLines}, ` +
            `falseLines: ${result.falseLines}, falseMatches: ${result.falseMatches}, ` +
            `falseMatchingLines: ${result.falseMatchingLines}`,
        );
      }
      console.log("");
    }
  }
}
