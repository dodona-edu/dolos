import { SyntaxNode } from "tree-sitter";
import { Token, Tokenizer } from "./tokenizer";
import { Region } from "../util/region";
import { AstFileTree } from "../outputFormat/astFile";

export abstract class CodeTokenizer extends Tokenizer<AstFileTree> {

  // /**
  //  * Runs the parser on a given string. Returns a stringified version of the
  //  * abstract syntax tree.
  //  *
  //  * @param text The text string to parse
  //  */
  // public tokenize(text: string): string {
  //   const tree = this.getTree(text);
  //   return tree.rootNode.toString();
  // }

  /**
     * Runs the parser on a given string. Returns an async iterator returning
     * tuples containing the stringified version of the token and the
     * corresponding position.
     *
     * @param tokenizableFile A tokenizable file for which the contents should be tokenized
     */
  public *generateTokens(tokenizableFile: AstFileTree): IterableIterator<Token> {
    yield* this.tokenizeNode(tokenizableFile.astTree.rootNode);
  }

  private *tokenizeNode(node: SyntaxNode): IterableIterator<Token> {
    const location = new Region(
      node.startPosition.row,
      node.startPosition.column,
      node.endPosition.row,
      node.endPosition.column
    );

    yield this.newToken("(", location);

    // "(node.type child1 child2 ...)"
    yield this.newToken(node.type, location);

    for (const child of node.namedChildren) {
      yield* this.tokenizeNode(child);
    }
    yield this.newToken(")", location);
  }
}
