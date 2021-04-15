import { Region } from "../util/region";
import { Token, Tokenizer } from "./tokenizer";

const whitespace = /\s/g;

export class MarkdownTokenizer extends Tokenizer {
  /**
   * Runs the parser on a given string. Returns an async iterator returning
   * tuples containing the stringified version of the token and the
   * corresponding position.
   *
   * @param text The text string to parse
   */
  public *generateTokens(text: string): IterableIterator<Token> {
    let lineNumber = 0;
    let column = 0;

    let whitespaceFound: [number, number] | null = null;
    let beginningOfFile = true;

    for (let i = 0; i < text.length; ++i) {
      const char = text[i];
      if (whitespace.test(char)) {
        if (whitespaceFound === null) {
          whitespaceFound = [lineNumber, column];
        }
      } else {
        if (whitespaceFound !== null && !beginningOfFile) {
          yield this.newToken(
            " ",
            new Region(whitespaceFound[0], whitespaceFound[1], lineNumber, column),
          );
          whitespaceFound = null;
        }
        beginningOfFile = false;
        yield this.newToken(char, new Region(lineNumber, column, lineNumber, column + 1));
      }

      if (char == "\n") {
        lineNumber += 1;
        column = 0;
      } else {
        ++column;
      }
    }
  }
}
