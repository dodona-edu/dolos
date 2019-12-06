import { default as fs } from "fs";
import { default as path } from "path";
import { Result } from "./result";

/**
 * A class to centralize file handling.
 */
export default class File {

  public readonly location: string;

  private readResult: Result<string> | null = null;
  private lineCount: Result<number> | null = null;

  constructor(location: string) {
    this.location = path.resolve(location);
  }

  public async content(): Promise<Result<string>> {
    if (this.readResult === null) {
      this.readResult = await Result.tryAwait(async () =>
        (await fs.promises.readFile(this.location)).toString());
    }
    return this.readResult;
  }

  public async lines(): Promise<Result<number>> {
    if (this.lineCount === null) {
      this.lineCount = (await this.content())
        .map(content => {
          const lines = content.split("\n");
          if (lines[lines.length - 1].length === 0) {
            return lines.length - 1;
          } else {
            return lines.length;
          }
        });
    }
    return this.lineCount;
  }

}
