import { Tokenizer } from "../tokenizer/tokenizer";
import { File } from "../file/file";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TreeSitterLanguage = any;

export abstract class Language {
  constructor(
    readonly name: string,
    readonly extensions: string[],
  ) {}

  public extensionMatches(filename: string): boolean {
    return this.extensions.some(ext => filename.endsWith(ext));
  }

  public checkLanguage(file: File): void {
    if (!this.extensionMatches(file.extension)) {
      throw new LanguageError(
        "We tried to guess the language based on the extension of the first " +
        `file (${this.name}), but the extension of one or more files ` +
        "does not match this language."
      );
    }
  }

  public abstract createTokenizer(): Tokenizer;
}

export class ProgrammingLanguage extends Language {

  protected languageModule: TreeSitterLanguage | undefined;

  public getLanguageModule(): TreeSitterLanguage {
    try {
      if (this.languageModule === undefined) {
        this.languageModule = require(`tree-sitter-${this.name}`);
      }
      return this.languageModule;
    } catch (error) {
      throw new Error(
        `The module 'tree-sitter-${this.name}' could not be found. ` +
        "Try to install it using npm or yarn, but it may not be supported (yet)."
      );
    }
  }

  createTokenizer(): Tokenizer {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CodeTokenizer } = require("../tokenizer/codeTokenizer");
    return new CodeTokenizer(this);
  }
}

export class CustomTreeSitterLanguage extends ProgrammingLanguage {
  constructor(
    readonly name: string,
    readonly extensions: string[],
    readonly customTreeSitterPackage: string | (() => Promise<TreeSitterLanguage>)
  ) {
    super(name, extensions);
  }

  public getLanguageModule(): TreeSitterLanguage {
    if (this.languageModule === undefined) {
      if (typeof this.customTreeSitterPackage === "string") {
        this.languageModule = require(this.customTreeSitterPackage);
      } else {
        this.languageModule = this.customTreeSitterPackage();
      }
    }
    return this.languageModule;
  }
}

export class CustomTokenizerLanguage extends Language {
  constructor(
    readonly name: string,
    readonly extensions: string[],
    readonly customTokenizer: ((self: Language) => Tokenizer)
  ) {
    super(name, extensions);
  }

  public createTokenizer(): Tokenizer {
    return this.customTokenizer(this);
  }
}

export class LanguageError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Helper class to find or detect languages to use for tokenization.
 */
export class LanguagePicker {

  static languages: Language[] = [
    new ProgrammingLanguage("bash", [".sh", ".bash"]),
    new ProgrammingLanguage("c", [".c", ".h"]),
    new ProgrammingLanguage("cpp", [".cpp", ".hpp", ".cc", ".cp", ".cxx", ".c++", ".h", ".hh", ".hxx", ".h++"]),
    new ProgrammingLanguage("c-sharp", [".cs", ".csx"]),
    new ProgrammingLanguage("python", [".py", ".py3"]),
    new ProgrammingLanguage("php", [".php", ".php3", ".php4", ".php5", ".php7", ".phps", ".phpt", ".phtml"]),
    new ProgrammingLanguage("java", [".java"]),
    new ProgrammingLanguage("javascript", [".js"]),
    new CustomTreeSitterLanguage("elm", [".elm"], "@elm-tooling/tree-sitter-elm"),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    new CustomTreeSitterLanguage("typescript", [".ts"], () => require("tree-sitter-typescript").typescript),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    new CustomTreeSitterLanguage("tsx", [".tsx"], () => require("tree-sitter-typescript").tsx),
    new CustomTokenizerLanguage("char", [".txt", ".md"], self => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { CharTokenizer } = require("../tokenizer/charTokenizer");
      return new CharTokenizer(self);
    }),
  ];

  private readonly byExtension: Map<string, Language> = new Map();
  private readonly byName: Map<string, Language> = new Map();

  constructor() {
    for (const language of LanguagePicker.languages) {
      for (const extension of language.extensions) {
        this.byExtension.set(extension, language);
        this.byName.set(language.name, language);
      }
    }
  }

  /**
   * Find the language to use for tokenization based on the extension of the
   * first file. If the extension does not match any known language, then
   * a LanguageError is thrown.
   *
   * @param files the files to tokenize
   */
  public detectLanguage(files: File[]): Language {
    const firstFile = files[0];
    const language = this.byExtension.get(firstFile.extension);
    if (language == null) {
      throw new LanguageError(
        `Could not detect language based on extension (${firstFile.extension}).`
      );
    }
    for (const file of files) {
      language.checkLanguage(file);
    }
    return language;
  }

  /**
   * Find the language to use for tokenization based on the name of the language.
   *
   * @param name
   */
  public findLanguage(name: string): Language {
    let language = this.byName.get(name);
    if (language == null) {
      const proglang = new ProgrammingLanguage(name, []);
      // Try to load the language module to see if it exists,
      // will throw an error if it does not exist.
      proglang.getLanguageModule();
      language = proglang;
    }
    return language;
  }
}





