import { File } from "./file";

export interface Token<Location> {
  token: string;
  location: Location;
}

export abstract class Tokenizer<Location> {
  /**
   * Returns a stringified version the given file.
   *
   * @param fileName The name of the file to parse
   */
  public tokenizeFile(file: File): string {
    return this.tokenize(file.content);
  }

  /**
   * Returns a stringified version of the buffer
   *
   * @param text The buffer to stringify
   */
  public abstract tokenize(text: string): string;

  /**
   * Runs the stringifier on a file with the given name.  Returns a tuple containing the
   * stringified version and an array containing a mapping from each token to the
   * corresponding token in the original buffer.
   *
   * @param fileName The name of the file to stringify
   */
  public tokenizeFileWithMapping(file: File): [string, Location[]] {
    return this.tokenizeWithMapping(file.content);
  }

  /**
   * Runs the stringifier on a given buffer. Returns a tuple containing the stringified version
   * and an array containing a mapping from each token to the corresponding token in the
   * original buffer.
   *
   * @param text The text buffer to stringify
   */
  public tokenizeWithMapping(text: string): [string, Location[]] {
    let resultString = "";
    const positionMapping: Location[] = [];
    for (const { token, location } of this.generateTokens(text)) {
      resultString += token;
      positionMapping.push(...new Array(token.length).fill(location));
    }
    return [resultString, positionMapping];
  }

  /**
   * Runs the stringifier on a file with the given name. Returns an async iterator returning
   * tuples containing the stringified version of the token and the corresponding position.
   *
   * @param fileName The name of the file to stringify
   */
  public *generateTokensFromFile(file: File): IterableIterator<Token<Location>> {
    yield* this.generateTokens(file.content);
  }

  /**
   * Runs the tokenizer on a given Buffer. Returns an async iterator returning tuples
   * containing the stringified version of the token and the corresponding position.
   *
   * @param text The text string to parse
   */
  public abstract generateTokens(text: string): IterableIterator<Token<Location>>;

  /**
   * Returns a new token-object. Just a shorthand for {token: ..., location: ...}.
   *
   * @param token the text of the token
   * @param location the location of the token
   */
  protected newToken(token: string, location: Location): Token<Location> {
    return { token, location };
  }
}
