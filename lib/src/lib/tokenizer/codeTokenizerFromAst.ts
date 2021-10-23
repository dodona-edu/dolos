import { CodeTokenizer } from "./codeTokenizer";
import { File } from "../file/file";
import { AstFileTree } from "../outputFormat/astFile";

// TODO doc
export class CodeTokenizerFromAst extends CodeTokenizer {
  private fileToAstFile: Map<string, AstFileTree>;

  public constructor(files: AstFileTree[]) {
    super();
    this.fileToAstFile = new Map<string, AstFileTree>();
    for (const file of files) {
      this.fileToAstFile.set(file.content, file);
    }
  }

  toTokenizableFile(file: File): AstFileTree {
    return this.fileToAstFile.get(file.content) as AstFileTree;
  }

}
