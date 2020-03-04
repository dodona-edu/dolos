import { Comparison, Matches } from "./lib/comparison";
import { FileGroup } from "./lib/files/fileGroup";
import { CustomOptions, Options } from "./lib/options";
import { Summary } from "./lib/summary";
import { CodeTokenizer } from "./lib/tokenizers/codeTokenizer";

export class Dolos {

  private readonly options: Options;
  private readonly tokenizer: CodeTokenizer;
  private readonly comparison: Comparison<number>;

  constructor(customOptions?: CustomOptions) {
    this.options = new Options(customOptions);
    this.tokenizer = new CodeTokenizer(this.options.language);
    this.comparison = new Comparison(this.tokenizer, this.options);
  }

  public async analyze(
    locations: string[]
  ): Promise<Map<FileGroup, Matches<number>>> {

    if (locations.length < 2) {
      throw new Error("You need to supply at least two locations");
    }

    // TODO: clean this up
    let files = locations;
    if (this.options.base) {
      if (this.options.directory) {

        const baseLocations = locations.filter(l =>
          l.startsWith(this.options.base as string));
        this.comparison.addToFilterList(await FileGroup.asGroup(baseLocations));

        files = locations.filter(l =>
          !l.startsWith(this.options.base as string));

      } else {
        this.comparison.addToFilterList(
          await FileGroup.asGroup([this.options.base])
        );
      }
    }

    let groups;
    if (this.options.directory) {
      groups = await FileGroup.groupByDirectory(files);
    } else {
      groups = await FileGroup.groupByFile(files);
    }

    await this.comparison.addAll(groups);
    return this.comparison.compareFiles(
      groups,
      undefined
    );
  }

  public output(
    matches: Map<FileGroup, Matches<number>>,
    format: string
  ): string {

    const summary = new Summary(matches, this.options);
    switch (format.toLowerCase()) {
    case "terminal":
    case "console":
      return summary.toString(this.options, true);
    case "json":
      return  summary.toJSON(this.options);
    case "html":
      return summary.toHTML(this.options);
    default:
      throw new Error("Output format not recognized");
    }
  }
}
