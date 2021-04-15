import { Region } from "../util/region";
import { CodeTokenizer } from "./codeTokenizer";
import { MarkdownTokenizer } from "./markdownTokenizer";
import { Token, Tokenizer } from "./tokenizer";

export interface IPyNbFileFormat {
  metadata: {
    kernel_info?: {
      name: string;
    };
    language_info: {
      name: string;
    };
  };
  cells: {
    cell_type: string;
    source: string | string[];
  }[];
}

export class IPyNbTokenizer extends Tokenizer {
  private markdownTokenizer = new MarkdownTokenizer();

  /**
   * Runs the parser on a given string. Returns an async iterator returning
   * tuples containing the stringified version of the token and the
   * corresponding position.
   *
   * @param text The text string to parse
   */
  public *generateTokens(text: string): IterableIterator<Token> {
    const nb = JSON.parse(text) as IPyNbFileFormat;
    const language = nb.metadata.language_info.name;
    const codeTokenizer = new CodeTokenizer(language);

    let lineNumber = 0;
    for (const cell of nb.cells) {
      const source: string = Array.isArray(cell.source) ? cell.source.join("\n") : cell.source;
      const tokenizer: Tokenizer | undefined = ({
        code: codeTokenizer,
        markdown: this.markdownTokenizer,
      } as { [key: string]: Tokenizer })[cell.cell_type];

      if (tokenizer) {
        for (const token of tokenizer.generateTokens(source)) {
          yield this.newToken(
            token.token,
            new Region(
              token.location.startRow + lineNumber,
              token.location.startCol,
              token.location.endRow + lineNumber,
              token.location.endCol,
            ),
          );
        }
      }
      lineNumber += (source.match(/\n/g) || "").length + 1;
    }
  }
}
