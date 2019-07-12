import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;

export interface Token<Location> {
  token: string;
  location: Location;
}

export abstract class Tokenizer<Location> {
  protected newToken(token: string, location: Location): Token<Location> {
    return { token, location };
  }

  /**
   * Returns a stringified version the given file.
   *
   * @param fileName The name of the file to parse
   */
  public async tokenizeFile(fileName: string): Promise<string> {
    const fileContent = await fs.readFile(fileName);
    return this.tokenize(fileContent);
  }

  /**
   * Returns a stringified version of the buffer
   *
   * @param text The buffer to stringify
   */
  public abstract tokenize(text: Buffer): string;

  /**
   * Runs the stringifier on a file with the given name.  Returns a tuple containing the
   * stringified version and an array containing a mapping from each token to the
   * corresponding token in the original buffer.
   *
   * @param fileName The name of the file to stringify
   */
  public async tokenizeFileWithMapping(fileName: string): Promise<[string, Location[]]> {
    const fileContent = await fs.readFile(fileName);
    return this.tokenizeWithMapping(fileContent);
  }

  /**
   * Runs the stringifier on a given buffer. Returns a tuple containing the stringified version
   * and an array containing a mapping from each token to the corresponding token in the
   * original buffer.
   *
   * @param text The text buffer to stringify
   */
  public async tokenizeWithMapping(text: Buffer): Promise<[string, Location[]]> {
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
  public async *generateTokensFromFile(fileName: string): AsyncIterableIterator<Token<Location>> {
    const fileContent = await fs.readFile(fileName);
    yield* this.generateTokens(fileContent);
  }

  /**
   * Runs the tokenizer on a given Buffer. Returns an async iterator returning tuples
   * containing the stringified version of the token and the corresponding position.
   *
   * @param text The text string to parse
   */
  public abstract generateTokens(text: Buffer): IterableIterator<Token<Location>>;
}
