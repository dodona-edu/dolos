import { Result } from "./result";
import Path from "path";
import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;

/**
 * Contains the content of a file, does not need to be backed by an actual file
 * (so it can be used to stub files in the tests).
 */
export class File {

  public readonly charCount: number;
  public readonly lineCount: number;
  public readonly lines: Array<string>;

  /**
   * Reads all the given locations into files.
   *
   * Returns a result which is either an array of all the files, or an error
   * combining all the errors encountered when reading the location list.
   */
  public static async readAll(
    locations: Array<string>
  ): Promise<Result<Array<File>>> {
    return Result.all(locations.map(File.fromPath));
  }

  /**
   * Read the given locatio into a file.
   *
   * Reaturns a result with the File if it succeeded, or an Error otherwise.
   */
  public static async fromPath(location: string): Promise<Result<File>> {
    return Result.tryAwait(async () =>
      new File(
        location,
        Path.basename(location),
        (await fs.readFile(location)).toString()
      )
    );
  }

  /**
   * Creates a file with the given name and content.
   */
  public static fromContent(name: string, content: string): File {
    return new File(null, name, content);
  }

  constructor(
    public readonly path: string | null,
    public readonly name: string,
    content: string
  ) {
    this.charCount = content.length;
    this.lines = content.split("\n");
    this.lineCount = this.lines.length;
  }

  get content(): string {
    return this.lines.join("\n");
  }
}
