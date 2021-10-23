import { CodeTokenizer } from "./codeTokenizer";
import { AstFile } from "../outputFormat/outputFormat";
import { File } from "../file/file";
import { Tree } from "tree-sitter";

// TODO doc
export class CodeTokenizerFromAst extends CodeTokenizer {
  private fileToAstFile: Map<string, AstFile<Tree>>;

  public constructor(files: AstFile<Tree>[]) {
    super();
    this.fileToAstFile = new Map<string, AstFile<Tree>>();
    for (const file of files) {
      this.fileToAstFile.set(file.content, file);
    }
  }

  toTokenizableFile(file: File): AstFile<Tree> {
    return this.fileToAstFile.get(file.content) as AstFile<Tree>;
  }

}
