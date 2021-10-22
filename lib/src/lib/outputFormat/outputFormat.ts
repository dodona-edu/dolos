import { Options } from "../util/options";
import { ScoredPairs } from "../analyze/report";
import { File } from "../file/file";
// we can import things from tree-sitter as long as it is only used as a type. This is because type imports are removed
// in the generated javascript. So this will not break in any environment where tree-sitter cannot be used.
import { Tree } from "tree-sitter";

// TODO change name
export interface OutputFormat {
   files: AstFile[],
   pairs: ScoredPairs[],
   metadata: Options,
   fingerprints: FingerPrint[]
}

export class AstFile extends File {
  constructor(file: File, public readonly tree: Tree) {
    super(file.path, file.content, file.extra);
  }
}

export interface FingerPrint {
   id: number
   fingerprint: number
   data: string | null
   fileIds: number[]
}
