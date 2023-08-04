import { File as DolosFile, Region, TokenizedFile } from "@dodona/dolos-core";
import { File } from "@/api/models";

export function fileToTokenizedFile(file: File): TokenizedFile {
  const dolosFile = new DolosFile(file.path, file.content, undefined, file.id);
  if (file.astAndMappingLoaded) {
    return new TokenizedFile(dolosFile, file.ast, file.mapping as Region[]);
  } else {
    throw new Error("File AST and mapping not parsed");
  }
}

/**
 * Common filename prefix for a given list of files
 * @param files Files
 * @param getPath Function to extract the path from the file
 * @returns Common prefix for all files.
 */
export function commonFilenamePrefix(files: File[], getPath: (f: File) => string): string {
  if (files.length <= 1) return "";

  let index = 0;
  while (
    getPath(files[0])[index] &&
    files.every((f) => getPath(f)[index] === getPath(files[0])[index])
  ) {
    index++;
  }

  return getPath(files[0]).substring(0, index) ?? "";
}
