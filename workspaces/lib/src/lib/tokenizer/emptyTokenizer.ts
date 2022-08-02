import { Token, Tokenizer } from "./tokenizer";

/**
 * An empty tokenizer, only to be used when no tokenization needs to happen in the index.
 */
export class EmptyTokenizer extends Tokenizer {
  /**
     * Does not do anything
     *
     * @param _text
     */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
  public *generateTokens(_text: string): IterableIterator<Token> {
  }
}
