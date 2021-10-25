import { File } from "../file/file";

// we can import things from tree-sitter as long as it is only used as a type. This is because type imports are removed
// in the generated javascript. So this will not break in any environment where tree-sitter cannot be used.
import { Tree } from "tree-sitter";

/**
 * File where the contents has been parsed by tree sitter and where the resulting tree is stored.
 * @typedef T - Either Tree or null. AstFile<Tree> signifies that the ast file is not null while AstFile<null> signifies
 * that it is empty. The utility types {@see AstFileNullable} and {@see AstFileNotNull} are defined so that the
 * `tree-sitter` types are not imported where not strictly needed.
 */
export class AstFile<T extends Tree | null> extends File {
  constructor(file: File, public readonly ast: T) {
    super(file.path, file.content, file.extra);
  }

  public static FromFile<F extends Tree | null>(file: File | AstFile<F>): AstFile<F | null> {
    if (file instanceof AstFile) {
      return file;
    } else {
      return new AstFile<null>(file, null);
    }
  }
}

export type AstFileNullable = AstFile<Tree | null>;
export type AstFileNotNull = AstFile<Tree>;
