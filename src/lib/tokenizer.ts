import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;
import Parser from "tree-sitter";

export class Tokenizer {
  public static supportedLanguages = ["c-sharp", "haskell", "java", "javascript", "python"];

  public static isSupportedLanguage(language: string): boolean {
    return this.supportedLanguages.includes(language);
  }

  public readonly language: string;
  private readonly parser: Parser;

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

  public async tokenize(fileName: string): Promise<string> {
    const fileContent = await fs.readFile(fileName, "utf8");
    const tree = this.parser.parse(fileContent);
    return tree.rootNode.toString();
  }
}
