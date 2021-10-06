import { Index } from "./lib/analyze";
import { Report } from "./lib/analyze/report";
import { CustomOptions, Options } from "./lib/util/options";
import { CodeTokenizer } from "./lib/tokenizer/codeTokenizer";
import { ExtraInfo, File } from "./lib/file/file";
import { Result } from "./lib/util/result";
import { info, error } from "./lib/util/utils";
import { Tokenizer } from "./lib/tokenizer/tokenizer";
import { CharTokenizer } from "./lib/tokenizer/charTokenizer";
import { csvParse, DSVRowString } from "d3-dsv";
import * as path from "path";
import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;

export { CharTokenizer } from "./lib/tokenizer/charTokenizer";
export { CodeTokenizer } from "./lib/tokenizer/codeTokenizer";
export { CustomOptions, Options } from "./lib/util/options";
export { ExtraInfo, File } from "./lib/file/file";
export { Fragment } from "./lib/analyze/fragment";
export { Index } from "./lib/analyze";
export { Pair } from "./lib/analyze/pair";
export { Region } from "./lib/util/region";
export { Report, ScoredPairs } from "./lib/analyze/report";
export { Result } from "./lib/util/result";
export { Tokenizer } from "./lib/tokenizer/tokenizer";
export { info, error, closestMatch } from "./lib/util/utils";

function newTokenizer(language: string): Tokenizer {
  if (language == "chars") {
    return new CharTokenizer();
  } else if (CodeTokenizer.supportedLanguages.includes(language)) {
    return new CodeTokenizer(language);
  }
  throw new Error(`No tokenizer found for ${language}`);
}

export class Dolos {
  readonly options: Options;
  private readonly tokenizer: Tokenizer;
  private readonly index: Index;

  constructor(customOptions?: CustomOptions) {
    this.options = new Options(customOptions);
    this.tokenizer = newTokenizer(this.options.language);
    this.index = new Index(this.tokenizer, this.options);
  }

  public async analyzePaths(paths: string[]): Promise<Report> {
    info("=== Starting report ===");
    let files = null;
    if(paths.length == 1) {
      const infoPath = paths[0];
      if(infoPath.toLowerCase().endsWith(".csv")) {
        info("Reading info-file from Dodona");
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
          error(e);
          throw new Error("The given '.csv'-file could not be opened");
        }
      } else {
        throw new Error("You only gave one file wich is not a '.csv.'-file. ");
      }
    } else {
      info(`Reading ${ paths.length} files`);
      files = paths.map(location => File.fromPath(location));
    }
    return this.analyze((await Result.all(files)).ok());
  }

  public async analyze(
    files: Array<File>
  ): Promise<Report> {

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
}
