import { File as DolosFile, Region, TokenizedFile } from "@dodona/dolos-lib";
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
 * @returns Common prefix for all files.
 */
export function commonFilenamePrefix(files: File[]): string {
  if (files.length <= 1) return "";

  let index = 0;
  while (
    files[0].path[index] &&
    files.every((f) => f.path[index] === files[0].path[index])
  ) {
    index++;
  }

  return files[0].path.substring(0, index) ?? "";
}
