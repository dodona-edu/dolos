import { Comparison, ComparisonOptions, Matches } from "../comparison";
import { File } from "../files/file";
import { FileGroup } from "../files/fileGroup";
import { Options } from "../options";
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
   * @param group1 The first file group you want to test.
   * @param group2 The second file group you want to test.
   */
  public async match(file1: File, file2: File): Promise<RangesTuple[]> {
    const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
    const opts = this.currentBenchmarkSettings.comparisonOptions ||
      (BenchmarkManager.defaultBenchmarkSettings.comparisonOptions);

    const comparison: Comparison<number> = new Comparison(
      tokenizer,
      opts as ComparisonOptions
    );
    comparison.add(file1.group);

    const matchesPerFile: Map<FileGroup, Matches<number>> =
      await comparison.compareFiles([file2.group]);

    const filterOptions = this.currentBenchmarkSettings.filterOptions || {};
    const summary = new Summary(
      matchesPerFile,
      new Options({
        clusterMinMatches: 0,
        maxGapSize: this.currentBenchmarkSettings.gapSize,
        maxMatches: filterOptions.fragmentOutputLimit,
        minFragmentLength: filterOptions.minimumFragmentLength,
      })
    );

    if (!summary.results.has(file2.group)) {
      return [];
    }
    const results: Matches<Range> =
      summary.results.get(file2.group) as Matches<Range>;

    if (!results.has(file1)) {
      return [];
    }

    return results.get(file1) as RangesTuple[];
  }
}
