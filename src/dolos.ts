import { Comparison, Analysis } from "./lib/comparison";
import { CustomOptions, Options } from "./lib/options";
import { CodeTokenizer } from "./lib/codeTokenizer";

export class Dolos {

  private readonly options: Options;
  private readonly tokenizer: CodeTokenizer;
  private readonly comparison: Comparison;

  constructor(customOptions?: CustomOptions) {
    this.options = new Options(customOptions);
    this.tokenizer = new CodeTokenizer(this.options.language);
    this.comparison = new Comparison(this.tokenizer, this.options);
  }

  public async analyze(
    locations: string[]
  ): Promise<Analysis> {

    if (locations.length < 2) {
      throw new Error("You need to supply at least two locations");
    }

    await this.comparison.addFiles(locations);
    return this.comparison.compareFiles(locations);
  }
}
