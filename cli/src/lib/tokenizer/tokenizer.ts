import { File } from "../file/file";
import { Selection } from "../util/selection";
import { TokenizedFile } from "../file/tokenizedFile";

export interface Token {
  token: string;
  location: Selection;
}

export abstract class Tokenizer {

  /**
   * Runs the tokenizer on a given Buffer. Returns an async iterator returning
   * tuples containing the stringified version of the token and the
   * corresponding position.
   *
   * @param text The text string to parse
   */
  public abstract generateTokens(text: string): IterableIterator<Token>;

  /**
   * Returns a stringified version the given file.
   *
   * @param fileName The name of the file to parse
   */
  public tokenizeFile(file: File): TokenizedFile {
    const [ast, mapping] = this.tokenizeWithMapping(file.content);
    return new TokenizedFile(file, ast, mapping);
  }

  /**
   * Returns a stringified version of the buffer
   *
   * @param text The buffer to stringify
   */
  public tokenize(text: string): string {
    return Array.of(...this.generateTokens(text)).join();
  }

  /**
   * Runs the stringifier on a given buffer. Returns a tuple containing the
   * stringified version and an array containing a mapping from each token to
   * the corresponding token in the original buffer.
   *
   * @param text The text buffer to stringify
   */
  public tokenizeWithMapping(text: string): [string, Selection[]] {
    let resultString = "";
    const positionMapping: Array<Selection> = [];
    for (const { token, location } of this.generateTokens(text)) {
      resultString += token;
      positionMapping.push(...new Array(token.length).fill(location));
    }
    return [resultString, positionMapping];
  }

  /**
   * Returns a new token-object.
   * Just a shorthand for {token: ..., location: ...}.
   *
   * @param token the text of the token
   * @param location the location of the token
   */
  protected newToken(token: string, location: Selection): Token {
    return { token, location };
  }
}
