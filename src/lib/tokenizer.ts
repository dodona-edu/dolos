import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;
import { default as Parser, Range, SyntaxNode } from "tree-sitter";

export class Tokenizer {
  public static supportedLanguages = ["c-sharp", "haskell", "java", "javascript", "python"];

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
   * module of the name `tree-sitter-someLanguage` must first be installed manually
   * through yarn or npm.
   *
   * The function will throw an error when the supported module is not found.
   *
   * @param language The name of the language to register
   */
  public static registerLanguage(language: string) {
    try {
      require("tree-sitter-" + language);
    } catch (error) {
      throw new Error(`The module 'tree-sitter-${language}' could not be found`);
    }
    this.supportedLanguages.push(language);
  }

  public readonly language: string;
  private readonly parser: Parser;

  /**
   * Creates a new tokenizer of the given language. Will throw an error when the given
   * language is not supported. See Tokenizer.supportedLanguages for a list of all
   * supported languages.
   *
   * @param language The language to use for this tokenizer.
   */
  constructor(language: string) {
    if (!Tokenizer.isSupportedLanguage(language)) {
      throw new Error(`Language '${language}' is not supported`);
    }

    this.language = language;
    this.parser = new Parser();
    // tslint:disable-next-line: no-var-requires
    const languageModule = require("tree-sitter-" + language);
    this.parser.setLanguage(languageModule);
  }

  /**
   * Runs the parser on a file with the given name. Returns a stringified version
   * of the abstract syntax tree.
   *
   * @param fileName The name of the file to parse
   */
  public async tokenizeFile(fileName: string): Promise<string> {
    const fileContent = await fs.readFile(fileName, "utf8");
    return this.tokenize(fileContent);
  }

  /**
   * Runs the parser on a given string. Returns a stringified version of the abstract
   * syntax tree.
   *
   * @param text The text string to parse
   */
  public tokenize(text: string): string {
    const tree = this.parser.parse(text);
    return tree.rootNode.toString();
  }

  /**
   * Runs the parser on a file with the given name. Returns a tuple containing the
   * stringified version of the abstract syntax tree and an array containing a mapping
   * from the position in the stringified AST (e.g. the position in the array) to the
   * line number in the original code file.
   *
   * @param fileName The name of the file to parse
   */
  public async tokenizeFileWithMapping(fileName: string): Promise<[string, number[]]> {
    const fileContent = await fs.readFile(fileName, "utf8");
    return this.tokenizeWithMapping(fileContent);
  }

  /**
   * Runs the parser on a given string. Returns a tuple containing the stringified version
   * of the abstract syntax tree and an array containing a mapping from the position in the
   * stringified AST (e.g. the position in the array) to the line number in the original code
   * file.
   *
   * @param text The text string to parse
   */
  public async tokenizeWithMapping(text: string): Promise<[string, number[]]> {
    let resultString = "";
    const positionMapping: number[] = [];
    for await (const [token, range] of this.generateTokens(text)) {
      resultString += token;
      positionMapping.push(...new Array(token.length).fill(range.start.row));
    }
    return [resultString, positionMapping];
  }

  /**
   * Runs the parser on a file with the given name. Returns an async iterator returning
   * tuples containing the stringified version of the token and the corresponding position.
   *
   * @param fileName The name of the file to parse
   */
  public async *generateTokensFromFile(fileName: string): AsyncIterableIterator<[string, Range]> {
    const fileContent = await fs.readFile(fileName, "utf8");
    yield* this.generateTokens(fileContent);
  }

  /**
   * Runs the parser on a given string. Returns an async iterator returning tuples
   * containing the stringified version of the token and the corresponding position.
   *
   * @param text The text string to parse
   */
  public async *generateTokens(text: string): AsyncIterableIterator<[string, Range]> {
    const tree = this.parser.parse(text);
    yield* this.tokenizeNode(tree.rootNode);
  }

  private async *tokenizeNode(node: SyntaxNode): AsyncIterableIterator<[string, Range]> {
    const range: Range = {
      end: node.endPosition,
      start: node.startPosition,
    };

    yield ["(", range];
    // "(node.type child1 child2 ...)"
    for (const c of node.type) {
      yield [c, range];
    }

    for (const child of node.namedChildren) {
      yield [" ", range];
      yield* this.tokenizeNode(child);
    }
    yield [")", range];
  }
}
