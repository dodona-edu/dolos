import { Options } from "../util/options";
import { ScoredPairs } from "../analyze/winnowingReport";
import { File } from "../file/file";
// we can import things from tree-sitter as long as it is only used as a type. This is because type imports are removed
// in the generated javascript. So this will not break in any environment where tree-sitter cannot be used.
import { Tree } from "tree-sitter";

// TODO change name
export interface OutputFormat {
   files: AstFile<Tree | null>[],
   pairs: ScoredPairs[],
   metadata: Options,
   fingerprints: SharedFingerprint[]
}

export class AstFile<T extends Tree | null> extends File {
  constructor(file: File, public readonly astTree: T) {
    super(file.path, file.content, file.extra);
  }

  public static FromFile<F extends Tree | null>(file: File | AstFile<F>): AstFile<F | null> {
    if(file instanceof AstFile) {
      return file;
    } else {
      return new AstFile<null>(file, null);
    }
  }
}

export type AstFileNullable = AstFile<Tree | null>;

export interface SharedFingerprint {
   id: number
   fingerprint: number
   data: string | null
   fileIds: number[]
}
