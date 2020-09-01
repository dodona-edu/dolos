import { Readable } from "stream";

export interface Hash {
  data: string;
  hash: number;
  start: number;
  stop: number;
}

export abstract class HashFilter {

  private readonly map: Map<string, number>;
  private currentIndex = 1000000;


  protected constructor() {
    this.map = new Map();
  }

  protected hash(str: string): number {
    if (!this.map.has(str)) {
      this.map.set(str, this.currentIndex);
      this.currentIndex -= 1;
    }
    return this.map.get(str) as number;
  }

  public static async *readBytes(stream: Readable):
    AsyncIterableIterator<number> {

    for await (const buffer of stream) {
      if (buffer instanceof Buffer) {
        yield* buffer as Buffer;
      } else {
        const s = buffer as string;
        for (let i = 0; i < s.length; ++i) {
          yield s.charCodeAt(i);
        }
      }
    }
  }

  protected zip(skipped: number[], tokens: string[]): string {
    let string = "";
    for(let i = 0; i < tokens.length; i += 1) {
      string += " ".repeat(skipped[i]) + tokens[i];
    }
    return string;
  }

  /**
   * iterates of the tokens read from stream. There are four kinds of tokens: "(", ")", whitespace and lastly everything
   * that isn't broken up by the first three tokens.
   * @param stream the input stream
   */
  public static async *readTokens(stream: Readable): AsyncIterableIterator<{token: string; skipped: number}> {
    let token = "";
    let skipped = 0;
    for await(const byte of HashFilter.readBytes(stream)) {
      const char = String.fromCharCode(byte);
      if (char.trim().length === 0) {
        if (token.length > 0) {
          yield { token, skipped };
          token = "";
          skipped = 0;
        }
        skipped += char.length;
      } else {
        if (char === "(" || char === ")") {
          if (token.length !== 0){
            yield { token, skipped };
            skipped = 0;
            token = "";
          }
          yield { token: char, skipped: 0 };
        } else {
          token += char;
        }
      }
    }
    if (token.length !== 0) {
      yield { token, skipped };
    }
  }

  public abstract hashes(stream: Readable): AsyncIterableIterator<Hash>;

  public async *hashesFromString(text: string): AsyncIterableIterator<Hash> {
    const stream = new Readable();
    stream.push(text);
    stream.push(null);
    yield* this.hashes(stream);
  }
}
