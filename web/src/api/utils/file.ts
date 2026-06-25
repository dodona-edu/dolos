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
 * @returns Common prefix for all files.
 */
export function commonFilenamePrefix(files: File[]): string {
  if (files.length <= 1) return "";
  //debugger;
  const first = files[0].path;
  // Find all possible locations with a path separator, sort them descending
  const splitLocations = Array.from(first.matchAll(/[\\/]/g)).map(r => r.index).sort((a, b) => b - a);
  /// If there are none, there is no desirable prefix
  if (splitLocations.length == 0) {
    return "";
  }
  let splitIndex = 0;
  let prefixLength = splitLocations[splitIndex];
  let i = 1;
  while(i < files.length && prefixLength > 0) {
    let j = 0;
    while(j < prefixLength && first[j] == files[i].path[j]) {
      j += 1;
    }
    while (prefixLength != undefined && j < prefixLength) {
      splitIndex += 1;
      prefixLength = splitLocations[splitIndex];
    }
    i += 1;
  }

  if (prefixLength == undefined || prefixLength == 0) {
    return "";
  } else {
    return files[0].path.substring(0, prefixLength + 1);
  }

}
