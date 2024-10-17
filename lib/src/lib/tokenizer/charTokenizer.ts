import { Region } from "@dodona/dolos-core";
import { Token, Tokenizer } from "./tokenizer.js";

export class CharTokenizer extends Tokenizer {

  generateTokens(text: string): Token[] {
    const tokens = [];
    for (const [lineNumber, line] of text.split("\n").entries()) {
      tokens.push(
        line
          .split("")
          .map((char, col) => this.newToken(char, new Region(lineNumber, col, lineNumber, col + 1)))
      );
    }

    return tokens.flat();
  }
}
