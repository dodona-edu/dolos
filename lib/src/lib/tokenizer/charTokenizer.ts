import { Region } from "@dodona/dolos-core";
import { Token, Tokenizer } from "./tokenizer.js";

export class CharTokenizer extends Tokenizer {

  generateTokens(text: string): Token[] {
    const tokens: Token[] = [];
    for (const [lineNumber, line] of text.split("\n").entries()) {
      for (let col = 0; col < line.length; col++) {
        tokens.push(this.newToken(line[col], new Region(lineNumber, col, lineNumber, col + 1)));

      }
    }

    return tokens;
  }
}
