import { Comparison, ComparisonOptions, Matches } from "../comparison";
import { Range } from "../range";
import { FilterOptions, Summary } from "../summary";
import { CodeTokenizer } from "../tokenizers/codeTokenizer";
import { Tokenizer } from "../tokenizers/tokenizer";
import { RangesTuple } from "../utils";
import { BenchmarkManager } from "./benchmarkManager";

export interface BenchMarkSettings {
  filterOptions?: FilterOptions;
  comparisonOptions?: ComparisonOptions;
  gapSize?: number;
}
export class BenchmarkHelper {
  private currentBenchmarkSettings: BenchMarkSettings;

  constructor(benchmarkSettings: BenchMarkSettings) {
    this.currentBenchmarkSettings = benchmarkSettings;
  }

  public set benchmarkSettings(benchmarkSettings: BenchMarkSettings) {
    this.currentBenchmarkSettings = benchmarkSettings;
  }

  /**
   * A shorthand function used to match two files.
   * @param file1 The first file you want to test.
   * @param file2 The second file you want to test.
   */
  public async match(file1: string, file2: string): Promise<RangesTuple[]> {
    const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
    const comparison: Comparison<number> = new Comparison(
      tokenizer,
      this.currentBenchmarkSettings.comparisonOptions ||
        (BenchmarkManager.defaultBenchmarkSettings.comparisonOptions as ComparisonOptions),
    );
    await comparison.addFile(file1);

    const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles([file2]);

    const summary = new Summary(
      matchesPerFile,
      this.currentBenchmarkSettings.gapSize,
      this.currentBenchmarkSettings.filterOptions,
      0,
    );

    if (!summary.results.has(file2)) {
      return [];
    }
    const results: Matches<Range> = summary.results.get(file2) as Matches<Range>;

    if (!results.has(file1)) {
      return [];
    }

    return results.get(file1) as RangesTuple[];
  }
}
