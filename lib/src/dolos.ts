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
import { OutputFormat } from "./lib/outputFormat/outputFormat";
import { Fragment } from "./lib/analyze/fragment";
import { CodeTokenizerFromAst } from "./lib/tokenizer/codeTokenizerFromAst";
import { AstFileNullable, AstFileTree } from "./lib/outputFormat/astFile";
const fs = fsWithCallbacks.promises;

function newTokenizer(language: string): Tokenizer<File | AstFileNullable> {
  if (language == "chars") {
    return new CharTokenizer();
  } else if (CodeTokenizerTreeSitter.supportedLanguages.includes(language)) {
    return new CodeTokenizerTreeSitter(language);
  }
  throw new Error(`No tokenizer found for ${language}`);
}

export class Dolos {
  readonly options: Options;
  private readonly tokenizer: Tokenizer<File | AstFileNullable>;
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

  public static async getFragments(outputFormat: OutputFormat, file1: AstFileNullable, file2: AstFileNullable):
      Promise<Fragment[]> {
    let tokenizer;
    if (outputFormat.metadata.language === "chars") {
      tokenizer = new CharTokenizer();
    } else {
      if(file1.astTree && file2.astTree) {
        tokenizer = new CodeTokenizerFromAst([
          file1 as AstFileTree,
          file2 as AstFileTree
        ]);
      } else {
        throw Error("Files must contain non null ast trees!");
      }
    }
    const index = new WinnowingIndex(tokenizer, outputFormat.metadata);
    const hashWhitelist = new Set(outputFormat.fingerprints.map(fingerprint => fingerprint.fingerprint));
    const report = await index.compareFiles([file1, file2], hashWhitelist);
    // TODO add assert
    const reportPair = report.scoredPairs[0];
    return reportPair.pair.fragments();
  }
}
