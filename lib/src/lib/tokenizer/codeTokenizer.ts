import { Tree, SyntaxNode } from "tree-sitter";
import { Token, Tokenizer } from "./tokenizer";
import { Region } from "../util/region";

export abstract class CodeTokenizer extends Tokenizer {
    abstract getTree(contents: string): Tree;

    /**
     * Runs the parser on a given string. Returns a stringified version of the
     * abstract syntax tree.
     *
     * @param text The text string to parse
     */
    public tokenize(text: string): string {
      const tree = this.getTree(text);
      return tree.rootNode.toString();
    }

    /**
     * Runs the parser on a given string. Returns an async iterator returning
     * tuples containing the stringified version of the token and the
     * corresponding position.
     *
     * @param text The text string to parse
     */
    public *generateTokens(text: string): IterableIterator<Token> {
      const tree = this.getTree(text);
      yield* this.tokenizeNode(tree.rootNode);
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
