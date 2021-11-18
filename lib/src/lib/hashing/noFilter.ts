import { Fingerprint, HashFilter } from "./hashFilter";
import { RollingHash } from "./rollingHash";

export class NoFilter extends HashFilter {
  private readonly k: number;

  /**
   * Generates a HashFilter object with given kgram size. It will not hashing
   * anything and return all hashes
   *
   * @param k The kgram size of which hashes are calculated
   * @param debug Whether to output debugging information in fingerprints.
   */
  constructor(k: number, debug = false) {
    super(debug);
    this.k = k;
  }

  /**
   * Returns an async iterator that yields tuples containing a hashing and its
   * corresponding kgram position. Can be called successively on multiple files.
   *
   * @param tokens The list of tokens to process.
   */
  public async *fingerprints(tokens: string[]): AsyncIterableIterator<Fingerprint> {
    const hash = new RollingHash(this.k);
    let window: string[] = [];
    let filePos: number = -1 * this.k;

    for await (const [byte, token] of this.hashTokens(tokens)) {
      filePos++;
      window = window.slice(-this.k+1);
      window.push(token);
      if (filePos < 0) {
        hash.nextHash(byte);
        continue;
      }
      yield {
        hash: hash.nextHash(byte),
        start: filePos,
        stop: filePos + this.k - 1,
        data: this.kgramData ? window : null,
      };
    }
  }
}
