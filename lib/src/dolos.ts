import { WinnowingIndex } from "./lib/analyze/winnowingIndex";
import { WinnowingReport } from "./lib/analyze/winnowingReport";
import { CustomOptions, Options } from "./lib/util/options";
import { CodeTokenizerTreeSitter } from "./lib/tokenizer/codeTokenizerTreeSitter";
import { ExtraInfo, File } from "./lib/file/file";
import { Result } from "./lib/util/result";
import { csvParse, DSVRowString } from "d3-dsv";
import * as path from "path";
import { Tokenizer } from "./lib/tokenizer/tokenizer";
import { CharTokenizer } from "./lib/tokenizer/charTokenizer";
import { default as fsWithCallbacks } from "fs";
import { AstFile, OutputFormat } from "./lib/outputFormat/outputFormat";
import { Fragment } from "./lib/analyze/fragment";
import { CodeTokenizerFromAst } from "./lib/tokenizer/codeTokenizerFromAst";
const fs = fsWithCallbacks.promises;

export { WinnowingReport, ScoredPairs } from "./lib/analyze/winnowingReport";
export { Fragment } from "./lib/analyze/fragment";
export { Region } from "./lib/util/region";
export { Pair } from "./lib/analyze/pair";
export { Options } from "./lib/util/options";


function newTokenizer(language: string): Tokenizer {
  if (language == "chars") {
    return new CharTokenizer();
  } else if (CodeTokenizerTreeSitter.supportedLanguages.includes(language)) {
    return new CodeTokenizerTreeSitter(language);
  }
  throw new Error(`No tokenizer found for ${language}`);
}

export class Dolos {
  readonly options: Options;
  private readonly tokenizer: Tokenizer;
  private readonly index: WinnowingIndex;

  constructor(customOptions?: CustomOptions) {
    this.options = new Options(customOptions);
    this.tokenizer = newTokenizer(this.options.language);
    this.index = new WinnowingIndex(this.tokenizer, this.options);
  }

  public async analyzePaths(paths: string[]): Promise<WinnowingReport> {
    let files = null;
    if(paths.length == 1) {
      const infoPath = paths[0];
      if(infoPath.toLowerCase().endsWith(".csv")) {
        const dirname = path.dirname(infoPath);
        try {
          files = csvParse((await fs.readFile(infoPath)).toString())
            .map((row:  DSVRowString) => ({
              filename: row.filename as string,
              fullName: row.full_name as string,
              id: row.id as string,
              status: row.status as string,
              submissionID: row.submission_id as string,
              nameEN: row.name_en as string,
              nameNL: row.name_nl as string,
              exerciseID: row.exercise_id as string,
              createdAt: new Date(row.created_at as string),
              labels: row.labels as string
            }))
            .map((row: ExtraInfo) => File.fromPath(path.join(dirname, row.filename), row));
        } catch(e) {
          throw new Error("The given '.csv'-file could not be opened");
        }
      } else {
        throw new Error("You only gave one file wich is not a '.csv.'-file. ");
      }
    } else {
      files = paths.map(location => File.fromPath(location));
    }
    return this.analyze((await Result.all(files)).ok());
  }

  public async analyze(
    files: Array<File>
  ): Promise<WinnowingReport> {

    if (files.length < 2) {
      throw new Error("You need to supply at least two files");
    } else if (files.length == 2 && this.options.maxFingerprintPercentage !== null) {
      throw new Error("You have given a maximum hash percentage but your are " +
                      "comparing two files. Each matching hash will thus " +
                      "be present in 100% of the files. This option does only" +
                      "make sense when comparing more than two files.");
    }
    return this.index.compareFiles(files);
  }

  public static async getFragments(outputFormat: OutputFormat, file1: AstFile, file2: AstFile): Promise<Fragment[]> {
    const tokenizer = new CodeTokenizerFromAst([file1, file2]);
    const index = new WinnowingIndex(tokenizer, outputFormat.metadata);
    const hashWhitelist = new Set(outputFormat.fingerprints.map(fingerprint => fingerprint.fingerprint));
    const report = await index.compareFiles([file1, file2], hashWhitelist);
    const reportPair = report.scoredPairs[0];
    return reportPair.pair.fragments();
  }
}
