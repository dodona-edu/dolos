import { default as Parser, SyntaxNode } from "tree-sitter";
import { Region } from "@dodona/dolos-core";
import { Token, Tokenizer, TokenizerOptions } from "./tokenizer.js";
import { ProgrammingLanguage } from "../language.js";

export class CodeTokenizer extends Tokenizer {

  private readonly parser: Parser;
  /**
   * Creates a new tokenizer of the given language. Will throw an error when the
   * given language is not supported. See Tokenizer.supportedLanguages for a
   * list of all supported languages.
   *
   * @param language The language to use for this tokenizer.
   * @param options
   */
  constructor(language: ProgrammingLanguage, options?: TokenizerOptions) {
    super(language, options);
    this.parser = new Parser();
    this.parser.setLanguage(language.getLanguageModule());
  }

  /**
   * Runs the parser on a given string. Returns a stringified version of the
   * abstract syntax tree.
   *
   * @param text The text string to parse
   */
  public tokenize(text: string): string {
    const tree = this.parser.parse(text, undefined, { bufferSize: Math.max(32 * 1024, text.length * 2) });
    return tree.rootNode.toString();
  }

  /**
   * Runs the parser on a given string. Returns a list of Tokens
   * containing the stringified version of the token and the
   * corresponding position.
   *
   * @param text The text string to parse
   */
  public generateTokens(text: string): Token[] {
    const tree = this.parser.parse(text, undefined, { bufferSize: Math.max(32 * 1024, text.length * 2) });
    const tokens: Token[] = [];
    this.tokenizeNode(tree.rootNode, tokens);
    return tokens;
  }

  /**
   * Tokenizes the given node and its child nodes. It will create a list of Tokens
   * containing the stringified version of the token and the corresponding position.
   *
   * @param node The node (and child nodes) that will be tokenized.
   * @param tokens A list of tokens that will be filled during the execution of the function
   * @returns A tuple `(startRow, startCol)`, It represents
   * the starting position of the given tokenized node.
   */
  private tokenizeNode(node: SyntaxNode, tokens: Token[]): [number,number]{
    const location = new Region(
      node.startPosition.row,
      node.startPosition.column,
      node.endPosition.row,
      node.endPosition.column
    );

    const includeToken = !node.type.includes("comment") || this.options.includeComments;
    if (includeToken) {
      tokens.push(this.newToken("(", location));
      tokens.push(this.newToken(node.type, location));
    }
    for (const child of node.namedChildren) {

      const [childStartRow, childStartCol] = this.tokenizeNode(child, tokens);

      // If the code is already captured in one of the children, the region of the current node can be shortened.
      if ((childStartRow < location.endRow) || (childStartRow === location.endRow && childStartCol < location.endCol)) {
        location.endRow = childStartRow;
        location.endCol = childStartCol;
      }
    }

    if (includeToken) {
      tokens.push(this.newToken(")", location));
    }

    // Also return the startRow and startCol, this can be used by the parent node.
    return [location.startRow, location.startCol];
  }
}
