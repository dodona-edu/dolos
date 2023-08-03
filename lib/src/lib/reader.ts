
/**
 * Reads all the given locations into files.
 *
 * Returns a result which is either an array of all the files, or an error
 * combining all the errors encountered when reading the location list.
 */
import { Result, File, ExtraInfo } from "@dodona/dolos-core";
import fs from "fs/promises";

export async function readFiles(
  locations: Array<string>
): Promise<Result<Array<File>>> {
  return Result.all(locations.map(location => readPath(location)));
}

/**
 * Read the given location into a file.
 *
 * Returns a result with the File if it succeeded, or an Error otherwise.
 */
export async function readPath(location: string, extra?: ExtraInfo): Promise<Result<File>> {
  return Result.tryAwait(async () =>
    new File(
      location,
      (await fs.readFile(location)).toString(),
      extra
    )
  );
}
