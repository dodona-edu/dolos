import { CodeTokenizer } from "./codeTokenizer";
import { File } from "../file/file";
import { AstFileNotNull } from "../file/astFile";

export class CodeTokenizerFromAst extends CodeTokenizer {
  private fileToAstFile: Map<string, AstFileNotNull>;

  /**
   * Functions the same as {@link CodeTokenizerTreeSitter}, however it does not use `tree-sitter` to get the Ast Tree.
   * But instead returns one of the previously parsed files.
   * @param files - All relevant files containing already parsed `tree-sitter` ASTs
   */
  public constructor(files: AstFileNotNull[]) {
    super();
    this.fileToAstFile = new Map<string, AstFileNotNull>();
    for (const file of files) {
      this.fileToAstFile.set(file.content, file);
    }
  }

  toTokenizableFile(file: File): AstFileNotNull {
    return this.fileToAstFile.get(file.content) as AstFileNotNull;
  }

}
