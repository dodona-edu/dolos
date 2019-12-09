import { Comparison, ComparisonOptions, Matches } from "../comparison";
import File from "../files/file";
import FileGroup from "../files/fileGroup";
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
  public async match(group1: FileGroup, group2: FileGroup): Promise<RangesTuple[]> {
    const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
    const comparison: Comparison<number> = new Comparison(
      tokenizer,
      this.currentBenchmarkSettings.comparisonOptions ||
        (BenchmarkManager.defaultBenchmarkSettings.comparisonOptions as ComparisonOptions),
    );
    comparison.add(group1);

    const matchesPerFile: Map<File, Matches<number>> = await comparison.compareFiles([group2]);

    const filterOptions = this.currentBenchmarkSettings.filterOptions || {};
    const summary = new Summary(
      matchesPerFile,
      new Options({
        clusterMinMatches: 0,
        maxGapSize: this.currentBenchmarkSettings.gapSize,
        maxMatches: filterOptions.fragmentOutputLimit,
        minFragmentLength: filterOptions.minimumFragmentLength,
      }),
    );

    if (!summary.results.has(group2.files[0])) {
      return [];
    }
    const results: Matches<Range> = summary.results.get(group2.files[0]) as Matches<Range>;

    if (!results.has(group1.files[0])) {
      return [];
    }

    return results.get(group1.files[0]) as RangesTuple[];
  }
}
