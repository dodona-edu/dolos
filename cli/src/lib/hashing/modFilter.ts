import { Fingerprint, HashFilter } from "./hashFilter";
import { RollingHash } from "./rollingHash";

export class ModFilter extends HashFilter {
  private readonly k: number;
  private readonly mod: number;

  /**
   * Generates a HashFilter object with given k-mer size and mod value. It will
   * return all hashes whose value is 0 after % mod.
   *
   * @param k The k-mer size of which hashes are calculated
   * @param mod The mod value for which hashes to keep
   * @param debug Whether to output debugging information in fingerprints.
   */
  constructor(k: number, mod: number, debug = false) {
    super(debug);
    this.k = k;
    this.mod = mod;
  }

  /**
   * Returns an async interator that yields tuples containing a hashing and its
   * corresponding k-mer position. Can be called successively on multiple files.
   *
   * @param tokens The list of tokens to process.
   */
  public async *fingerprints(tokens: string[]): AsyncIterableIterator<Fingerprint> {
    const hash = new RollingHash(this.k);
    let filePos: number = -1 * this.k;
    let currentHash: number;
    let window: string[] = [];

    for await (const [byte, token] of this.hashTokens(tokens)) {
      filePos++;
      window = window.slice(-this.k+1);
      window.push(token);
      if (filePos < 0) {
        hash.nextHash(byte);
        continue;
      }
      currentHash = hash.nextHash(byte);
      if (currentHash % this.mod === 0) {

        yield {
          hash: currentHash,
          start: filePos,
          stop: filePos + this.k - 1,
          data: this.kmerData ? tokens.slice(filePos, filePos + this.k) : null,
        };
      }
    }
  }
}
