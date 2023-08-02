/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Tokenizer } from "./tokenizer/tokenizer.js";
import { File } from "@dodona/dolos-core";

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

  public abstract createTokenizer(): Promise<Tokenizer>;
}

export class ProgrammingLanguage extends Language {

  protected languageModule: TreeSitterLanguage | undefined;

  public getLanguageModule(): TreeSitterLanguage {
    if (this.languageModule === undefined) {
      throw new Error("Language module is not loaded yet.");
    }
    return this.languageModule;
  }

  public async loadLanguageModule(): Promise<TreeSitterLanguage> {
    try {
      if (this.languageModule === undefined) {
        this.languageModule = (await import(`tree-sitter-${this.name}`)).default;
      }
      return this.languageModule;
    } catch (error) {
      throw new Error(
        `The module 'tree-sitter-${this.name}' could not be found. ` +
        "Try to install it using npm or yarn, but it may not be supported (yet)."
      );
    }
  }

  async createTokenizer(): Promise<Tokenizer> {
    const { CodeTokenizer } = await import ("./tokenizer/codeTokenizer.js");
    await this.loadLanguageModule();
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

  public async loadLanguageModule(): Promise<TreeSitterLanguage> {
    if (this.languageModule === undefined) {
      if (typeof this.customTreeSitterPackage === "string") {
        this.languageModule = (await import(this.customTreeSitterPackage)).default;
      } else {
        this.languageModule = await this.customTreeSitterPackage();
      }
    }
    return this.languageModule;
  }
}

export class CustomTokenizerLanguage extends Language {
  constructor(
    readonly name: string,
    readonly extensions: string[],
    readonly customTokenizer: ((self: Language) => Promise<Tokenizer>)
  ) {
    super(name, extensions);
  }

  public async createTokenizer(): Promise<Tokenizer> {
    return await this.customTokenizer(this);
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
    new CustomTreeSitterLanguage("typescript", [".ts"],
      // @ts-ignore
      async () => (await import("tree-sitter-typescript")).default.typescript
    ),
    new CustomTreeSitterLanguage("tsx", [".tsx"],
      // @ts-ignore
      async () => (await import("tree-sitter-typescript")).default.tsx
    ),
    new CustomTokenizerLanguage("char", [".txt", ".md"], async self => {
      const { CharTokenizer } = await import("./tokenizer/charTokenizer.js");
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
   * Find the language to use for tokenization based on the most common
   * extension of the files. If the extension does not match any known language,
   * then a LanguageError is thrown.
   *
   * @param files the files to tokenize
   */
  public detectLanguage(files: File[]): Language {
    const counts: Map<string, number> = new Map();
    let maxCount = 0;
    let language: Language | undefined = undefined;
    for (const file of files) {
      const count = (counts.get(file.extension) ?? 0) + 1;
      if (count > maxCount) {
        maxCount = count;
        language = this.byExtension.get(file.extension);
      }
      counts.set(file.extension, count);
    }

    if (language == undefined) {
      throw new LanguageError(
        "Could not detect language based on extension."
      );
    }

    return language;
  }

  /**
   * Find the language to use for tokenization based on the name of the language.
   *
   * @param name
   */
  public async findLanguage(name: string): Promise<Language> {
    let language = this.byName.get(name);
    if (language == null) {
      const proglang = new ProgrammingLanguage(name, []);
      // Try to load the language module to see if it exists,
      // will throw an error if it does not exist.
      await proglang.loadLanguageModule();
      language = proglang;
    }
    return language;
  }
}





