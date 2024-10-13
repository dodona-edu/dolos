import { default as Parser, SyntaxNode } from "tree-sitter";
import { assert, Region } from "@dodona/dolos-core";
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
   * Runs the parser on a given string. Returns an async iterator returning
   * tuples containing the stringified version of the token and the
   * corresponding position.
   *
   * @param text The text string to parse
   */
  public *generateTokens(text: string): IterableIterator<Token> {
    const tree = this.parser.parse(text, undefined, { bufferSize: Math.max(32 * 1024, text.length * 2) });
    yield* this.tokenizeNode(tree.rootNode);
  }

  private *tokenizeNode(node: SyntaxNode): IterableIterator<Token> {
    const fullSpan = new Region(
      node.startPosition.row,
      node.startPosition.column,
      node.endPosition.row,
      node.endPosition.column
    );

    const childrenRegions = this.getChildrenRegions(node);
    const location = Region.firstDiff(fullSpan,childrenRegions);
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

  generateTokensNew(text: string): Token[] {
    const tree = this.parser.parse(text, undefined, { bufferSize: Math.max(32 * 1024, text.length * 2) });
    return this.tokenizeNodeNew(tree.rootNode)[0];
  }
  
  private tokenizeNodeNew(node: SyntaxNode): [Token[], Region[]]{
    const fullSpan = new Region(
      node.startPosition.row,
      node.startPosition.column,
      node.endPosition.row,
      node.endPosition.column
    );
    
    const allNodes: Token[] = [];
    const allRegions: Region[] = [];
    const childrenNodes: Token[] = [];

    for (const child of node.namedChildren) {
      const [tokens, regions] = this.tokenizeNodeNew(child);
      childrenNodes.push(...tokens);
      allRegions.push(...regions);
    }

    const location = Region.firstDiff(fullSpan, allRegions);
    assert(location !== null, "There should be at least one diff'ed region");

    allNodes.push(this.newToken("(", location));
    allNodes.push(this.newToken(node.type, location));
    allNodes.push(...childrenNodes);
    allNodes.push(this.newToken(")", location));

    allRegions.push(fullSpan);

    return [allNodes, allRegions];
  }
}
