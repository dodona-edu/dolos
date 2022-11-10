

export class Language {
  constructor(
    readonly name: string,
    readonly extensions: string[],
    readonly customTreeSitterPackage?: string | (() => Promise<any>)
  ) {}

  public createParser(): any {
    if (this.customTreeSitterPackage === undefined) {
      return require(`tree-sitter-${this.name}`);
    } else if (typeof this.customTreeSitterPackage === "string") {
      return require(this.customTreeSitterPackage);
    } else {
      return this.customTreeSitterPackage();
    }
  }
}

export const languages: Language[] = [
  new Language("bash", ["sh", "bash"]),
  new Language("c", ["c", "h"]),
  new Language("c-sharp", ["cs"]),
  new Language("python", ["py", "py3"]),
  new Language("java", ["java"]),
  new Language("javascript", ["js"]),
  new Language("elm", ["elm"], "@elm-tooling/tree-sitter-elm"),
  new Language("typescript", ["ts"], () => require("tree-sitter-typescript").typescript),
  new Language("tsx", ["tsx"], () => require("tree-sitter-typescript").typescript),
];

const languageByExtension: Map<string, Language> = new Map();
for (const language of languages) {
  for (const extension of language.extensions) {
    languageByExtension.set(extension, language);
  }
}

export function getLanguageByExtension(extension: string): Language | undefined {
  return languageByExtension.get(extension);
}
