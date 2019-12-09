import { default as fs } from "fs";
import { default as path } from "path";

import Result from "../result";
import FileGroup from "./fileGroup";

/**
 * A class to centralize file handling.
 */
export default class File {

  public static async read(location: string, group: FileGroup): Promise<File> {
    const readResult = await Result.tryAwait(async () =>
      (await fs.promises.readFile(location)).toString());
    return new File(location, group, readResult);
  }

  public readonly location: string;
  public readonly group: FileGroup;

  public readResult: Result<string>;
  public lineCount: Result<number>;

  constructor(location: string, group: FileGroup, readResult: Result<string>) {
    this.location = path.resolve(location);
    this.group = group;
    this.readResult = readResult;
    this.lineCount = readResult.map(content => {
      const lines = content.split("\n");
      if (lines[lines.length - 1].length === 0) {
        return lines.length - 1;
      } else {
        return lines.length;
      }
    });
  }

  public showContent(): string {
    return this.readResult.okOrElse(
      () => `Error while reading file: ${this.readResult.err()}`,
    );
  }
}
