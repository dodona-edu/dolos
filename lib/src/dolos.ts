import { Index } from "./lib/analyze";
import { Report } from "./lib/analyze/report";
import { CustomOptions, Options } from "./lib/util/options";
import { ExtraInfo, File } from "./lib/file/file";
import { Result } from "./lib/util/result";
import { csvParse, DSVRowString } from "d3-dsv";
import * as path from "path";
import { Tokenizer } from "./lib/tokenizer/tokenizer";
import { default as fsWithCallbacks, constants } from "fs";
import { spawnSync as spawn } from "child_process";
import { tmpdir } from "os";
import {
  Language,
  LanguagePicker
} from "./lib/util/language";
const fs = fsWithCallbacks.promises;


export class Dolos {
  readonly options: Options;

  private languageDetected = false;
  private language: Language | null = null;
  private tokenizer: Tokenizer | null = null;
  private index: Index | null = null;

  private readonly languagePicker = new LanguagePicker();

  constructor(customOptions?: CustomOptions) {
    this.options = new Options(customOptions);
  }


  private async fromZIP(zipPath: string): Promise<Result<File[]>> {
    const tmpDir = await fs.mkdtemp(path.join(tmpdir(), "dolos-unzip-"));
    try {
      const { status, error, stderr } = spawn("unzip", [zipPath, "-d", tmpDir]);
      if (error) {
        throw error;
      } else if (status != 0) {
        throw new Error(`Unzipping failed with exit status ${ status }, stderr: \n${stderr}`);
      }
      const infoPath = path.join(tmpDir, "info.csv");
      try {
        await fs.access(infoPath, constants.R_OK);
      } catch {
        throw new Error("Zip does not contain a required 'info.csv' file");
      }
      return await this.fromCSV(infoPath);
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  }

  private async fromCSV(infoPath: string): Promise<Result<File[]>> {
    const dirname = path.dirname(infoPath);
    try {
      const files = csvParse((await fs.readFile(infoPath)).toString())
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
      return await Result.all(files);
    } catch(e) {
      throw new Error("The given '.csv'-file could not be opened");
    }
  }


  public async analyzePaths(paths: string[]): Promise<Report> {
    let files = null;
    let nameCandidate = undefined;
    if(paths.length == 1) {
      const inputFile = paths[0];
      if(inputFile.toLowerCase().endsWith(".zip")) {
        files = this.fromZIP(inputFile);
        nameCandidate = path.basename(inputFile, ".zip");
      } else if(inputFile.toLowerCase().endsWith(".csv")) {
        files = this.fromCSV(inputFile);
        if (inputFile.endsWith("info.csv")) {
          nameCandidate = path.dirname(inputFile).split(path.sep).pop();
        }
      } else {
        throw new Error("You gave one input file, but is not a CSV file or a ZIP archive.");
      }
    } else {
      files = Result.all(paths.map(location => File.fromPath(location)));
      if (paths.length === 2) {
        nameCandidate = path.basename(paths[0]) + " & " + path.basename(paths[1]);
      }
    }
    return this.analyze((await files).ok(), nameCandidate);
  }

  public async analyze(
    files: Array<File>,
    nameCandidate?: string
  ): Promise<Report> {

    if (files.length < 2) {
      throw new Error("You need to supply at least two files");
    } else if (files.length == 2 && this.options.maxFingerprintPercentage !== null) {
      throw new Error("You have given a maximum hash percentage but your are " +
        "comparing two files. Each matching hash will thus " +
        "be present in 100% of the files. This option does only" +
        "make sense when comparing more than two files.");
    } else if (this.index == null) {
      if (this.options.language) {
        this.language = this.languagePicker.findLanguage(this.options.language);
      } else {
        this.language = this.languagePicker.detectLanguage(files);
        this.languageDetected = true;
      }
      this.tokenizer = this.language.createTokenizer();
      this.index = new Index(this.tokenizer, this.options);
    }
    if (this.languageDetected) {
      for (const file of files) {
        this.language?.checkLanguage(file);
      }
    }
    return this.index.compareFiles(files, nameCandidate);
  }
}
