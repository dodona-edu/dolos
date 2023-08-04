import { default as Parser, SyntaxNode } from "tree-sitter";
import { Region, assert } from "@dodona/dolos-core";
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
    const tree = this.parser.parse(text);
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
    const tree = this.parser.parse(text);
    yield* this.tokenizeNode(tree.rootNode);
  }

  private *tokenizeNode(node: SyntaxNode): IterableIterator<Token> {
    const fullSpan = new Region(
      node.startPosition.row,
      node.startPosition.column,
      node.endPosition.row,
      node.endPosition.column
    );

    const location = Region.firstDiff(fullSpan, this.getChildrenRegions(node));
    assert(location !== null, "There should be at least one diff'ed region");

    yield this.newToken("(", location);

    // "(node.type child1 child2 ...)"
    yield this.newToken(node.type, location);

    for (const child of node.namedChildren) {
      yield* this.tokenizeNode(child);
    }
    yield this.newToken(")", location);
  }

  private getChildrenRegions(node: SyntaxNode): Region[] {
    const nodeToRegion = (node: SyntaxNode):Region => new Region(
      node.startPosition.row,
      node.startPosition.column,
      node.endPosition.row,
      node.endPosition.column
    );

    const getChildrenRegion =
      (node: SyntaxNode): Region[] =>
        node.children.reduce<Region[]>(
          (list, child) =>
            list.concat(getChildrenRegion(child))
              .concat(nodeToRegion(node)),
          []
        );

    return node.children.map(getChildrenRegion).flat();
  }
}
