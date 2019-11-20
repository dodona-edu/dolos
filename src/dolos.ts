import { Comparison, Matches} from "./lib/comparison";
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
    this.comparison = new Comparison(this.tokenizer, {
      filterHashByPercentage: this.options.filterByPercentage,
      maxHash: this.options.maxHash,
    });
  }

  public async analyze(locations: [string]): Promise<Map<string, Matches<number>>> {
    if (locations.length < 2) {
      throw new Error("You need to supply at least two locations");
    }

    if (this.options.base) {
      if (this.options.directory) {
        let index = locations.length - 1;
        while (index > 0) {
          if (locations[index].startsWith(this.options.base)) {
            await this.comparison.addFileToFilterList(locations[index]);
            locations.splice(index, 1);
          }
          index -= 1;
        }
      } else {
-       await this.comparison.addFileToFilterList(this.options.base);
      }
    }


    await this.comparison.addFiles(locations);
    return await this.comparison.compareFiles(
      locations,
      undefined,
      this.options.directory,
    );
  }

  public output(matches: Map<string, Matches<number>>, format: string) {
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
