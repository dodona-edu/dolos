import { CodeTokenizer } from "./codeTokenizer";
import { AstFile } from "../outputFormat/outputFormat";
import { Tree } from "tree-sitter";

// TODO doc
export class CodeTokenizerFromAst extends CodeTokenizer {
  private contentsToAst: Map<string, Tree>;

  public constructor(files: AstFile[]) {
    super();
    this.contentsToAst = new Map<string, Tree>();
    for (const file of files) {
      this.contentsToAst.set(
        file.content,
        file.tree
      );
    }
  }

  getTree(contents: string): Tree {
    return this.contentsToAst.get(contents) as Tree;
  }

}
