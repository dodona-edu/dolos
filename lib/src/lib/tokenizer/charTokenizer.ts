import { Region } from "../util/region";
import { Token, Tokenizer } from "./tokenizer";
import { File } from "../file/file";

export class CharTokenizer extends Tokenizer<File> {
  /**
   * Runs the parser on a given string. Returns an async iterator returning
   * tuples containing the stringified version of the token and the
   * corresponding position.
   *
   * @param tokenizableFile A tokenizable file for which the contents should be tokenized
   */
  public *generateTokens(tokenizableFile: File): IterableIterator<Token> {
    const text = tokenizableFile.content;
    for (const [lineNumber, line] of text.split("\n").entries())
      yield* line
        .split("")
        .map((char, col) => this.newToken(char, new Region(lineNumber, col, lineNumber, col + 1)));
  }

  toTokenizableFile(file: File): File {
    return file;
  }
}
