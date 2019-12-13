import { default as Parser, SyntaxNode } from "tree-sitter";
import { Token, Tokenizer } from "./tokenizer";

export class CodeTokenizer extends Tokenizer<number> {
  public static supportedLanguages = ["c-sharp", "haskell", "java",
    "javascript", "python"];

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
      require("tree-sitter-" + language);
    } catch (error) {
      throw new Error(
        `The module 'tree-sitter-${language}' could not be found`
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
      throw new Error(`Language '${language}' is not supported`);
    }

    this.language = language;
    this.parser = new Parser();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const languageModule = require("tree-sitter-" + language);
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
  public *generateTokens(text: string): IterableIterator<Token<number>> {
    const tree = this.parser.parse(text);
    yield* this.tokenizeNode(tree.rootNode);
  }

  private *tokenizeNode(node: SyntaxNode): IterableIterator<Token<number>> {
    const location = node.startPosition.row;

    yield this.newToken("(", location);
    // "(node.type child1 child2 ...)"
    for (const c of node.type) {
      yield this.newToken(c, location);
    }

    for (const child of node.namedChildren) {
      yield this.newToken(" ", location);
      yield* this.tokenizeNode(child);
    }
    yield this.newToken(")", location);
  }
}
