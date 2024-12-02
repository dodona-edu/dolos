/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Tokenizer, TokenizerOptions } from "./tokenizer/tokenizer.js";
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

  public abstract createTokenizer(options?: TokenizerOptions): Promise<Tokenizer>;
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
    if (this.languageModule === undefined) {
      // @ts-ignore
      this.languageModule = (await import("@dodona/dolos-parsers")).default[this.name];
      this.languageModule ||= (await import(`tree-sitter-${this.name}`)).default;
      if (this.languageModule === undefined) {
        throw new LanguageError(
          `Could not find language module for ${this.name}, ` +
          `searched in @dodona/dolos-parsers and tree-sitter-${this.name}`
        );
      }
    }
    return this.languageModule;
  }

  async createTokenizer(options?: TokenizerOptions): Promise<Tokenizer> {
    const { CodeTokenizer } = await import ("./tokenizer/codeTokenizer.js");
    await this.loadLanguageModule();
    return new CodeTokenizer(this, options);
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
    readonly customTokenizer: ((self: Language, options?: TokenizerOptions) => Promise<Tokenizer>)
  ) {
    super(name, extensions);
  }

  public async createTokenizer(options?: TokenizerOptions): Promise<Tokenizer> {
    return await this.customTokenizer(this, options);
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
    new ProgrammingLanguage("modelica", [".mo", ".mos"]),
    new ProgrammingLanguage("ocaml", [".ml"]),
    new ProgrammingLanguage("java", [".java"]),
    new ProgrammingLanguage("javascript", [".js"]),
    new ProgrammingLanguage("elm", [".elm"]),
    new ProgrammingLanguage("go", [".go"]),
    new ProgrammingLanguage("groovy", [".groovy", ".gvy", ".gy", ".gsh"]),
    new ProgrammingLanguage("r", [".r", ".rdata", ".rds", ".rda"]),
    new ProgrammingLanguage("rust", [".rs", ".rlib"]),
    new ProgrammingLanguage("scala", [".scala", ".sc"]),
    new ProgrammingLanguage("sql", [".sql"]),
    new ProgrammingLanguage("typescript", [".ts"]),
    new ProgrammingLanguage("tsx", [".tsx"]),
    new ProgrammingLanguage("verilog", [".v", ".vh"]),
    new CustomTokenizerLanguage("char", [".txt", ".md"], async (self, options) => {
      const { CharTokenizer } = await import("./tokenizer/charTokenizer.js");
      return new CharTokenizer(self, options);
    }),
  ];

  private readonly byExtension: Map<string, Language> = new Map();
  private readonly byName: Map<string, Language> = new Map();

  constructor() {
    for (const language of LanguagePicker.languages) {
      for (const extension of language.extensions) {
        this.byExtension.set(extension.toLowerCase(), language);
        this.byName.set(language.name.toLowerCase(), language);
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
      const count = (counts.get(file.extension.toLowerCase()) ?? 0) + 1;
      if (count > maxCount) {
        maxCount = count;
        language = this.byExtension.get(file.extension.toLowerCase());
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
    let language = this.byName.get(name.toLowerCase());
    if (language == null) {
      const proglang = new ProgrammingLanguage(name.toLowerCase(), []);
      // Try to load the language module to see if it exists,
      // will throw an error if it does not exist.
      await proglang.loadLanguageModule();
      language = proglang;
    }
    return language;
  }
}

