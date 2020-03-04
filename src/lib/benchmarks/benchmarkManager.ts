import fs from "fs";
import { BenchmarkMatcher, BenchmarkResults }
  from "../benchmarks/benchmarkMatcher";
import { JSONFormatter } from "../formatters/jsonFormatter";
import { ObjectMap } from "../utils";
import * as Utils from "../utils";
import { Options } from "../options";
import { BenchmarkHelper, BenchMarkSettings } from "./benchmarkHelper";
import { HTMLBenchmarkFormatter } from "./htmlBenchmarkFormatter";

export type NumericRangesTuple = [[number, number], [number, number]];
/**
 * A class to manage benchmarks.
 */
export class BenchmarkManager {

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

  public get json(): string | undefined {
    return this.jsonResults;
  }
  public static readonly defaultBenchmarkSettings: BenchMarkSettings = {
    comparisonOptions: new Options({}),
    filterOptions: { minimumFragmentLength: 0 },
    gapSize: 0,
  };

  private static readonly htmlFormatter: HTMLBenchmarkFormatter =
    new HTMLBenchmarkFormatter();

  private benchMarks:
    Map<string, (benchmarkMatcher: BenchmarkMatcher) => Promise<void>> =
    new Map();

  private readonly generateHTML: boolean;

  private helper: BenchmarkHelper =
    new BenchmarkHelper(BenchmarkManager.defaultBenchmarkSettings);

  private benchmarkSettingsList: BenchMarkSettings[] = [];

  private jsonResults: string | undefined;

  /**
   * @param generateHTML Wither or not to generate an html output.
   */
  constructor(generateHTML = false) {
    this.generateHTML = generateHTML;
  }

  /**
   * Registers a benchmark under a certain name.
   * @param benchmarkName The name for the benchmark.
   * @param benchmarkFunction The function that contains the benchmark.
   */
  public async benchmark(
    benchmarkName: string,
    benchmarkFunction: (benchmarkMather: BenchmarkMatcher) => Promise<void>
  ): Promise<void> {

    this.benchMarks.set(benchmarkName, benchmarkFunction);
  }
  /**
   * Execute all registered benchmarks.
   */
  public async executeBenchmarks(): Promise<void> {
    const benchmarkResultsList: ObjectMap<Array<[string, BenchmarkResults]>> =
      {};

    if (this.benchmarkSettingsList.length === 0) {
      this.benchmarkSettingsList.push(
        BenchmarkManager.defaultBenchmarkSettings
      );
    }
    for (const benchmarkSettings of this.benchmarkSettingsList.values()) {
      const results: Array<[string, BenchmarkResults]> = [];
      this.helper.benchmarkSettings = benchmarkSettings;
      for (const [name, benchmarkFunction] of this.benchMarks.entries()) {
        const benchmarkMatcher: BenchmarkMatcher =
          new BenchmarkMatcher(this.helper);

        await benchmarkFunction(benchmarkMatcher);
        if (benchmarkMatcher.result === undefined) {
          continue;
        }
        results.push([name, benchmarkMatcher.result]);
      }
      benchmarkResultsList[JSON.stringify(benchmarkSettings)] = results;
    }

    const json: string =
      JSON.stringify(benchmarkResultsList, JSONFormatter.JSONReplacerFunction);

    this.jsonResults = json;
    if (this.generateHTML) {
      this.generateHTMLFile(json);
    } else {
      this.outputResultsToConsole(benchmarkResultsList);
    }
  }

  /**
   * Add a benchmark setting to the list of benchmarks. If none are add then
   * only the no-filter options is executed.
   *
   * @param benchmarkSettings The benchmark setting you want to add.
   */
  public addBenchmarkSettings(benchmarkSettings: BenchMarkSettings): void {
    this.benchmarkSettingsList.push(benchmarkSettings);
  }

  /**
   * A function used to generate an html output. Will write to a file with the
   * current timestamp and overwrite the current latest.html. Both files are
   * written to the `__benchmarks__` directory.
   *
   * @param jsonResults The results you want to show on the html page.
   */
  private generateHTMLFile(json: string): void {
    const fileName: string = new Date().toISOString();
    const html: string = BenchmarkManager.htmlFormatter.format(json);
    fs.writeFileSync(`src/lib/__benchmarks__/${fileName}.html`, html, "utf8");
    fs.writeFileSync("src/lib/__benchmarks__/latest.html", html, "utf8");
  }

  /**
   * Prints the given result to the console.
   * @param resultsMap The results you want to pint to the console.
   */
  private outputResultsToConsole(
    resultsMap: ObjectMap<Array<[string, BenchmarkResults]>>
  ): void {

    for (const [options, results] of Object.entries(resultsMap)) {
      console.log(Utils.colour("green", `${options} => `));
      for (const [name, result] of results.values()) {
        console.log(
          Utils.colour("red", `\t${name} => `) +
            `matchedLines: ${result.matchedLines}, ` +
            `missedLines: ${result.missedLines}, ` +
            `falseLines: ${result.falseLines}, ` + 
            `falseMatches: ${result.falseMatches}, ` +
            `falseMatchingLines: ${result.falseMatchingLines}`
        );
      }
      console.log("");
    }
  }
}
