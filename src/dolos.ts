import { Comparison, Analysis } from "./lib/comparison";
import { CustomOptions, Options } from "./lib/options";
import { CodeTokenizer } from "./lib/codeTokenizer";
import { File } from "./lib/file";
import { Result } from "./lib/result";

export class Dolos {

  private readonly options: Options;
  private readonly tokenizer: CodeTokenizer;
  private readonly comparison: Comparison;

  constructor(customOptions?: CustomOptions) {
    this.options = new Options(customOptions);
    this.tokenizer = new CodeTokenizer(this.options.language);
    this.comparison = new Comparison(this.tokenizer, this.options);
  }

  public async analyzePaths(paths: string[]): Promise<Analysis> {
    const files = await Result.all(paths.map(File.fromPath));
    return this.analyze(files.ok());
  }

  public async analyze(
    files: Array<File>
  ): Promise<Analysis> {

    if (files.length < 2) {
      throw new Error("You need to supply at least two files");
    }

    await this.comparison.addFiles(files);
    return this.comparison.compareFiles(files);
  }

}
