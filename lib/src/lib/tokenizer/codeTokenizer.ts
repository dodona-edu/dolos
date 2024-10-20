import { default as Parser, SyntaxNode } from "tree-sitter";
import { Region } from "@dodona/dolos-core";
import { Token, Tokenizer } from "./tokenizer.js";
import { ProgrammingLanguage } from "../language.js";

export class CodeTokenizer extends Tokenizer {

  private readonly parser: Parser;

  /**
   * Creates a new tokenizer of the given language. Will throw an error when the
   * given language is not supported. See Tokenizer.supportedLanguages for a
   * list of all supported languages.
   *
   * @param language The language to use for this tokenizer.
   */
  constructor(language: ProgrammingLanguage) {
    super(language);
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
    return this.tokenizeNode(tree.rootNode)[0];
  }

  private tokenizeNode(node: SyntaxNode): [Token[], [number,number]]{
    const location = new Region(
      node.startPosition.row,
      node.startPosition.column,
      node.endPosition.row,
      node.endPosition.column
    );

    const allNodes = [];
    allNodes.push(this.newToken("(", location));
    allNodes.push(this.newToken(node.type, location));
    for (const child of node.namedChildren) {

      const [childNodes, [childStartRow, childStartCol]] = this.tokenizeNode(child);

      if ((childStartRow < location.endRow) || (childStartRow === location.endRow && childStartCol < location.endCol)) {
        location.endRow = childStartRow;
        location.endCol = childStartCol;
      }

      allNodes.push(...childNodes);
    }

    allNodes.push(this.newToken(")", location));

    return [allNodes, [location.startRow, location.startCol]];
  }
}
