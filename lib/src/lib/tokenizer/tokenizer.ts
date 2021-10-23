import { File } from "../file/file";
import { Region } from "../util/region";
import { TokenizedFile } from "../file/tokenizedFile";

export interface Token {
  token: string;
  location: Region;
}

export abstract class Tokenizer<TokenizableFile extends File> {

  /**
   * Runs the tokenizer on a given Buffer. Returns an async iterator returning
   * tuples containing the stringified version of the token and the
   * corresponding position.
   *
   * @param text The text string to parse
   */
  public abstract generateTokens(text: TokenizableFile): IterableIterator<Token>;

  /**
   * Returns a tokenized version of the given file.
   *
   * @param file The file to parse
   */
  public tokenizeFile(file: TokenizableFile | File): TokenizedFile {
    let tokenizableFile: TokenizableFile;
    if(file.constructor.name === File.name) {
      tokenizableFile = this.toTokenizableFile(file);
    } else {
      tokenizableFile = file as TokenizableFile;
    }
    const [ast, mapping] = this.tokenizeWithMapping(tokenizableFile);
    return new TokenizedFile(file, ast, mapping);
  }

  public abstract toTokenizableFile(file: File): TokenizableFile;

  //TODO delete?
  // /**
  //  * Returns a stringified version of the tokens in the buffer
  //  *
  //  * @param text The buffer to stringify
  //  */
  // public tokenize(text: string): string {
  //   return Array.of(...this.generateTokens(text)).join();
  // }

  /**
   * Runs the stringifier on a given buffer. Returns a tuple containing the
   * stringified version and an array containing a mapping from each token to
   * the corresponding token in the original buffer.
   *
   * @param tokenizableFile A tokenizable file for which the contents should be tokenized
   */
  public tokenizeWithMapping(tokenizableFile: TokenizableFile): [string[], Region[]] {
    const resultTokens: Array<string> = [];
    const positionMapping: Array<Region> = [];
    for (const { token, location } of this.generateTokens(tokenizableFile)) {
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
