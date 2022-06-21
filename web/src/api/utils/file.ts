import { File as DolosFile, Region, TokenizedFile } from "@dodona/dolos-lib";

export function fileToTokenizedFile(file: File): TokenizedFile {
  const dolosFile = new DolosFile(file.path, file.content);
  if (file.astAndMappingLoaded) {
    return new TokenizedFile(dolosFile, file.ast, file.mapping as Region[]);
  } else {
    throw new Error("File AST and mapping not parsed");
  }
}
