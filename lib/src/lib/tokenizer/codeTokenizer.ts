import { default as Parser, SyntaxNode } from "tree-sitter";
import { Region } from "../util/region";
import { Token, Tokenizer } from "./tokenizer";

export class CodeTokenizer extends Tokenizer {
  public static supportedLanguages =
    ["c", "c-sharp", "bash", "java", "javascript", "python"];

  /**
   * Returns true if the grammar of the given language is supported.
   *
   * @param language The name of the language to check
   */
  public static isSupportedLanguage(language: string): boolean {
    return this.supportedLanguages.includes(language);
  }

  /**
   * Registers an additional language to Dolos. For this to work, the supporting
   * module of the name `tree-sitter-someLanguage` must first be installed
   * manually through yarn or npm.
   *
   * The function will throw an error when the supported module is not found.
   *
   * @param language The name of the language to register
   */
  public static registerLanguage(language: string): void {
    try {
      if (language === "elm") {
        require("@elm-tooling/tree-sitter-elm");
      } else {
        require("tree-sitter-" + language);
      }
    } catch (error) {
      throw new Error(
        `The module 'tree-sitter-${language}' could not be found. ` +
        "Try to install it using npm or yarn, but it may not be supported (yet)."
      );
    }
    this.supportedLanguages.push(language);
  }

  public readonly language: string;
  private readonly parser: Parser;

  /**
   * Creates a new tokenizer of the given language. Will throw an error when the
   * given language is not supported. See Tokenizer.supportedLanguages for a
   * list of all supported languages.
   *
   * @param language The language to use for this tokenizer.
   */
  constructor(language: string) {
    super();
    if (!CodeTokenizer.isSupportedLanguage(language)) {
      CodeTokenizer.registerLanguage(language);
    }

    this.language = language;
    this.parser = new Parser();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let languageModule;
    if (language === "elm") {
      languageModule = require("@elm-tooling/tree-sitter-elm");
    } else {
      languageModule = require("tree-sitter-" + language);
    }
    this.parser.setLanguage(languageModule);
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

    const location = Region.diff(fullSpan, ...this.getChildrenRegions(node))[0];
    
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
      node.children.reduce<Region[]>((list, child) => [...list, ...getChildrenRegion(child), nodeToRegion(node)], []);

    return node.children.map(getChildrenRegion).flat();
  }
}
