import { Tokenizer } from "../tokenizer/tokenizer";
import { CodeTokenizer } from "../tokenizer/codeTokenizer";
import { CharTokenizer } from "../tokenizer/charTokenizer";
import { File } from "../file/file";

export abstract class Language {
  constructor(
    readonly name: string,
    readonly extensions: string[],
  ) {}

  public extensionMatches(filename: string): boolean {
    return this.extensions.some(ext => filename.endsWith(ext));
  }

  public checkLanguage(file: File) {
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

  protected languageModule: any | undefined;

  public getLanguageModule(): any {
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
    return new CodeTokenizer(this);
  }
}

export class CustomTreeSitterLanguage extends ProgrammingLanguage {
  constructor(
    readonly name: string,
    readonly extensions: string[],
    readonly customTreeSitterPackage: string | (() => Promise<any>)
  ) {
    super(name, extensions);
  }

  public getLanguageModule(): any {
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
    readonly customTokenizer: (() => Tokenizer)
  ) {
    super(name, extensions);
  }

  public createTokenizer(): Tokenizer {
    return this.customTokenizer();
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
    new ProgrammingLanguage("c-sharp", [".cs"]),
    new ProgrammingLanguage("python", [".py", ".py3"]),
    new ProgrammingLanguage("java", [".java"]),
    new ProgrammingLanguage("javascript", [".js"]),
    new CustomTreeSitterLanguage("elm", [".elm"], "@elm-tooling/tree-sitter-elm"),
    new CustomTreeSitterLanguage("typescript", [".ts"], () => require("tree-sitter-typescript").typescript),
    new CustomTreeSitterLanguage("tsx", [".tsx"], () => require("tree-sitter-typescript").tsx),
    new CustomTokenizerLanguage("char", [".txt", ".md"], () => new CharTokenizer()),
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
        `Could not detect language for ${firstFile.path} (unknown extension).`
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





