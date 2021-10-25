import { File } from "../file/file";
import { Region } from "../util/region";
import { TokenizedFile } from "../file/tokenizedFile";

export interface Token {
  token: string;
  location: Region;
}

/**
 * The generic type "TokenizableFile" defines which file format the tokenizer needs in order for tokenization to happen
 */
export abstract class Tokenizer<TokenizableFile extends File> {

  /**
   * Runs the tokenizer on a given Buffer. Returns an async iterator returning
   * tuples containing the stringified version of the token and the
   * corresponding position.
   *
   * @param tokenizableFile A tokenizable file for which the contents should be tokenized
   */
  public abstract generateTokens(tokenizableFile: TokenizableFile): IterableIterator<Token>;

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
    const [tokenStream, mapping] = this.tokenizeWithMapping(tokenizableFile);
    return new TokenizedFile(file, tokenStream, mapping);
  }

  /**
   * converts a normal file to a file containing all the data needed in order for tokenization to happen.
   * @param file The file to be converted.
   */
  public abstract toTokenizableFile(file: File): TokenizableFile;

  /**
   * Runs the stringifier on a given buffer. Returns a tuple containing the
   * stringified version and an array containing a mapping from each token to
   * the corresponding token in the original buffer.
   *
   * @param tokenizableFile A tokenizable file for which the contents should be tokenized
   * @return An array of tokens and the regions they correspond with in the original file.
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
