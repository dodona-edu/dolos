import { default as Parser, Tree } from "tree-sitter";
import { CodeTokenizer } from "./codeTokenizer";

export class CodeTokenizerTreeSitter extends CodeTokenizer {
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
      require("tree-sitter-" + language);
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
    if (!CodeTokenizerTreeSitter.isSupportedLanguage(language)) {
      CodeTokenizerTreeSitter.registerLanguage(language);
    }

    this.language = language;
    this.parser = new Parser();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const languageModule = require("tree-sitter-" + language);
    this.parser.setLanguage(languageModule);
  }

  public getTree(contents: string): Tree {
    return this.parser.parse(contents);
  }

}
