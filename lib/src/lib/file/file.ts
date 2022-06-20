import { Result } from "../util/result";
import { default as fsWithCallbacks } from "fs";
import Identifiable from "../util/identifiable";
const fs = fsWithCallbacks.promises;

export interface ExtraInfo {
  filename: string;
  fullName: string;
  id: string;
  status: string;
  submissionID: string;
  nameEN: string;
  nameNL: string;
  exerciseID: string;
  createdAt: Date;
  labels: string;
}

/**
 * Contains the content of a file, does not need to be backed by an actual file
 * (so it can be used to stub files in the tests).
 */
export class File extends Identifiable {

  public readonly charCount: number;
  public readonly lineCount: number;
  public readonly lines: Array<string>;
  public readonly extra?: ExtraInfo;

  public static compare(a: File, b: File): number {
    if (a.path < b.path) {
      return -1;
    } else if (a.path > b.path) {
      return 1;
    } else {
      return 0;
    }
  }

  /**
   * Reads all the given locations into files.
   *
   * Returns a result which is either an array of all the files, or an error
   * combining all the errors encountered when reading the location list.
   */
  public static async readAll(
    locations: Array<string>
  ): Promise<Result<Array<File>>> {
    return Result.all(locations.map(location => File.fromPath(location)));
  }

  /**
   * Read the given location into a file.
   *
   * Returns a result with the File if it succeeded, or an Error otherwise.
   */
  public static async fromPath(location: string, extra?: ExtraInfo): Promise<Result<File>> {
    return Result.tryAwait(async () =>
      new File(
        location,
        (await fs.readFile(location)).toString(),
        extra
      )
    );
  }

  constructor(
    public readonly path: string,
    content: string,
    extra?: ExtraInfo,
    id?: number
  ) {
    super(id);
    this.charCount = content.length;
    this.lines = content.split("\n");
    this.lineCount = this.lines.length;
    this.extra = extra;
  }

  get content(): string {
    return this.lines.join("\n");
  }
}
