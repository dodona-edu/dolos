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
