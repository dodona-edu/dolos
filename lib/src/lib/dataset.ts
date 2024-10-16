import { readFiles, readPath } from "./reader.js";

import { ExtraInfo, File, Result } from "@dodona/dolos-core";
import { csvParse, DSVRowString } from "d3-dsv";

import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync as spawn } from "node:child_process";
import { tmpdir } from "node:os";

export class Dataset {
  constructor(
      public name: string,
      public files: File[],
      public ignore?: File) {
  }

  private static async fromDirectory(dirPath: string): Promise<Result<File[]>> {
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

  private static async setIgnoredFile(resolvedFiles: File[], ignore?: string): Promise<File | undefined> {
    const ignoredFiles = resolvedFiles.filter(file => file.extra?.ignored === "true");
    if (ignoredFiles.length > 1) {
      throw new Error(
        "More than one file has the ignored field set to true. " +
        "Only one template/boilerplate code file is allowed at this moment."
      );
    }
    else if (ignore) {
      return (await readPath(ignore)).ok();
    }
    return ignoredFiles.length === 1 ? ignoredFiles[0] : undefined;
  }


  private static async fromZIP(
    zipPath: string,
    ignore?: string
  ): Promise<Dataset> {
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
        const dataset = await Dataset.fromCSV(infoPath, ignore);
        if (dataset) {
          dataset.name = path.basename(zipPath, ".zip");
          return dataset;
        }
        else {
          throw new Error("Failed to process files");
        }
      } else {
        const files = (await this.fromDirectory(tmpDir)).ok();
        const ignoredFile = undefined;
        const nameCandidate = path.basename(zipPath, ".zip");
        return new Dataset(nameCandidate, files, ignoredFile);
      }
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  }


  private static async fromCSV(
    infoPath: string,
    ignore?: string
  ): Promise<Dataset> {
    const dirname = path.dirname(infoPath);
    try {
      const csv_files = csvParse((await fs.readFile(infoPath)).toString())
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
          labels: row.label as string || row.labels as string,
          ignored: row.ignored as string
        }))
        .map((row: ExtraInfo) => readPath(path.join(dirname, row.filename), row));
      const resolvedFiles = await Result.all(csv_files);
      const ignoredFile = await this.setIgnoredFile(resolvedFiles.ok(), ignore);
      const files = resolvedFiles.ok().filter(file => file.extra?.ignored !== "true");
      const nameCandidate = path.dirname(infoPath).split(path.sep).pop() || "undefined";
      return new Dataset(nameCandidate, files, ignoredFile);
    } catch(e) {
      throw new Error("The given '.csv'-file could not be opened");
    }
  }


  public static async create(paths: string[], ignore?: string): Promise<Dataset> {
    let resolvedIgnoredFile = null;
    let resolvedFiles = null;
    let nameCandidate = "undefined";

    if (paths.length == 1) {
      const inputFile = paths[0];
      if (inputFile.toLowerCase().endsWith(".zip")) {
        return Dataset.fromZIP(inputFile, ignore);
      } else if (inputFile.toLowerCase().endsWith(".csv")) {
        return Dataset.fromCSV(inputFile, ignore);
      } else {
        throw new Error("You gave one input file, but it is not a CSV file or a ZIP archive.");
      }
    } else {
      resolvedFiles = (await readFiles(paths)).ok();
      resolvedIgnoredFile = await this.setIgnoredFile(resolvedFiles, ignore);
      nameCandidate = path.basename(paths[0]) + " & " + path.basename(paths[1]);
      return new Dataset(nameCandidate, resolvedFiles, resolvedIgnoredFile);
    }
  }
}
