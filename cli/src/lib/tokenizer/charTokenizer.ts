import { Region } from "../util/region";
import { Token, Tokenizer } from "./tokenizer";

export class CharTokenizer extends Tokenizer {
  /**
   * Runs the parser on a given string. Returns an async iterator returning
   * tuples containing the stringified version of the token and the
   * corresponding position.
   *
   * @param text The text string to parse
   */
  public *generateTokens(text: string): IterableIterator<Token> {
    for (const [lineNumber, line] of text.split("\n").entries())
      yield* line
        .split("")
        .map((char, col) => this.newToken(char, new Region(lineNumber, col, lineNumber, col + 1)));
  }
}
