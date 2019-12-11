import { default as fs } from "fs";
import { default as path } from "path";

import { Result } from "../result";
import { FileGroup } from "./fileGroup";

/**
 * A class to centralize file handling.
 */
export class File {

  /**
   * Create a File contained in a single FileGroup.
   */
  public static async alone(location: string): Promise<File> {
    return (await FileGroup.asGroup([location])).files[0];
  }

  /**
   * Asynchronously reads a file and creates a new File object. If an error
   * occured when reading the file, the readResult will be an Error.
   */
  public static async read(location: string, group: FileGroup): Promise<File> {
    const readResult = await Result.tryAwait(async () =>
      (await fs.promises.readFile(location)).toString());
    return new File(location, group, readResult);
  }

  public readonly location: string;
  public readonly group: FileGroup;

  public readResult: Result<string>;
  public lineCount: Result<number>;

  /**
   * Creates a new FileGroup with the given details. The lineCount is equal to
   * the amount of newlines contained in the file.
   */
  constructor(location: string, group: FileGroup, readResult: Result<string>) {
    this.location = path.resolve(location);
    this.group = group;
    this.readResult = readResult;
    this.lineCount = readResult.map(
      content => content.split("").filter(c => c === "\n").length,
    );
  }

  /**
   * Returns a string with the file content, or a string representation of the
   * error thrown when reading the file.
   */
  public showContent(): string {
    return this.readResult.okOrElse(
      () => `Error while reading file: ${this.readResult.err()}`,
    );
  }

  public toString(): string {
    return `File: ${this.location}`;
  }
}
