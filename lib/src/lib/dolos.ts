import { Report } from "./report.js";
import { CustomOptions, Options } from "./options.js";
import { Tokenizer } from "./tokenizer/tokenizer.js";
import { Language, LanguagePicker } from "./language.js";
import { readFiles, readPath } from "./reader.js";

import { FingerprintIndex, ExtraInfo, File, Result } from "@dodona/dolos-core";
import { csvParse, DSVRowString } from "d3-dsv";

import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync as spawn } from "node:child_process";
import { tmpdir } from "node:os";

export class Dolos {
  readonly options: Options;

  private languageDetected = false;
  private language: Language | null = null;
  private tokenizer: Tokenizer | null = null;
  private index: FingerprintIndex | null = null;

  private readonly languagePicker = new LanguagePicker();

  constructor(customOptions?: CustomOptions) {
    this.options = new Options(customOptions);
  }

  private async fromDirectory(dirPath: string): Promise<Result<File[]>> {
    const dirs = [dirPath];
    const files = [];

    let i = 0;

    while(i < dirs.length) {
      for (const entry of await fs.readdir(dirs[i], { withFileTypes: true })) {
        if (entry.isDirectory()) {
          dirs.push(path.join(dirs[i], entry.name));
        } else if (entry.isFile()) {
          files.push(readPath(path.join(dirs[i], entry.name)));
        }
      }
      i += 1;
    }

    return await Result.all(files);
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
      if (await fs.access(infoPath, constants.R_OK).then(() => true).catch(() => false)) {
        return await this.fromCSV(infoPath);
      } else {
        return await this.fromDirectory(tmpDir);
      }
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
          labels: row.label as string || row.labels as string
        }))
        .map((row: ExtraInfo) => readPath(path.join(dirname, row.filename), row));
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
      files = readFiles(paths);
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

    if (this.index == null) {
      if (this.options.language) {
        this.language = await this.languagePicker.findLanguage(this.options.language);
      } else {
        this.language = this.languagePicker.detectLanguage(files);
        this.languageDetected = true;
      }
      this.tokenizer = await this.language.createTokenizer();
      this.index = new FingerprintIndex(this.options.kgramLength, this.options.kgramsInWindow, this.options.kgramData);
    }

    const warnings = [];
    let filteredFiles;
    if (this.languageDetected) {
      filteredFiles = files.filter(file => this.language?.extensionMatches(file.path));
      const diff = files.length - filteredFiles.length;
      if (diff > 0) {
        warnings.push(
          `The language of the files was detected as ${this.language?.name} ` +
          `but ${diff} files were ignored because they did not have a matching extension.` +
          "You can override this behavior by setting the language explicitly."
        );
      }
    } else {
      filteredFiles = files;
    }

    if (files.length < 2) {
      throw new Error("You need to supply at least two files");
    } else if (files.length == 2 && this.options.maxFingerprintPercentage !== null) {
      throw new Error("You have given a maximum hash percentage but your are " +
        "comparing two files. Each matching hash will thus " +
        "be present in 100% of the files. This option does only" +
        "make sense when comparing more than two files.");
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tokenizedFiles = filteredFiles.map(f => this.tokenizer!.tokenizeFile(f));
    this.index.addFiles(tokenizedFiles);

    return new Report(
      this.options,
      this.language,
      tokenizedFiles,
      this.index,
      nameCandidate,
      warnings
    );
  }
}
