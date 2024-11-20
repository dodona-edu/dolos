import { File, TokenizedFile, Region } from "@dodona/dolos-core";
import { Language } from "../language.js";

export interface Token {
  token: string;
  location: Region;
}

export type TokenizerOptions = Partial<{
  includeComments: boolean;
}>

export abstract class Tokenizer {

  constructor(public readonly language: Language, protected readonly options: TokenizerOptions = {}) {}

  /**
   * Runs the parser on a given string. Returns a list of Tokens
   * containing the stringified version of the token and the
   * corresponding position.
   *
   * @param text The text string to parse
   */
  public abstract generateTokens(text:string): Token[];

  /**
   * Returns a tokenized version of the given file.
   *
   * @param file The file to parse
   */
  public tokenizeFile(file: File): TokenizedFile {
    const [ast, mapping] = this.tokenizeWithMapping(file.content);
    return new TokenizedFile(file, ast, mapping);
  }

  /**
   * Returns a stringified version of the tokens in the buffer
   *
   * @param text The buffer to stringify
   */
  public tokenize(text: string): string {
    return this.generateTokens(text).join();
  }

  /**
   * Runs the stringifier on a given buffer. Returns a tuple containing the
   * stringified version and an array containing a mapping from each token to
   * the corresponding token in the original buffer.
   *
   * @param text The text buffer to stringify
   */
  public tokenizeWithMapping(text: string): [string[], Region[]] {
    const resultTokens: Array<string> = [];
    const positionMapping: Array<Region> = [];
    for (const { token, location } of this.generateTokens(text)) {
      resultTokens.push(token);
      positionMapping.push(location);
    }
    return [resultTokens, positionMapping];
  }

  /**
   * Returns a new token-object.
   * Just a shorthand for {token: ..., location: ...}.
   *
   * @param token the text of the token
   * @param location the location of the token
   */
  protected newToken(token: string, location: Region): Token {
    return { token, location };
  }
}
