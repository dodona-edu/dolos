import { Readable } from "stream";
import { Hash, HashFilter } from "./hashFilter";
import { RollingHash } from "./rollingHash";

export class NoFilter extends HashFilter {
  protected readonly k: number;

  /**
   * Generates a HashFilter object with given k-mer size. It will not hashing
   * anything and return all hashes
   *
   * @param k The k-mer size of which hashes are calculated
   */
  constructor(k: number) {
    super();
    this.k = k;
  }

  /**
   * Returns an async interator that yields tuples containing a hashing and its
   * corresponding k-mer position. Can be called successively on multiple files.
   *
   * @param stream The readable stream of a file (or stdin) to process. Such
   * stream can be created using fs.createReadStream("path").
   */
  public async *hashes(stream: Readable): AsyncIterableIterator<Hash> {
    const hash = new RollingHash(this.k);
    const window: string[] = [];
    const skippedWindow: number[] = [];
    let filePos = 0;
    let lastToken = "";
    let lastSkipped = 0;

    for await (const { token, skipped } of HashFilter.readTokens(stream)) {
      if (window.length === this.k) {
        lastToken = window.shift() as string;
        lastSkipped = skippedWindow.shift() as number;
      }
      filePos += lastToken.length + lastSkipped;
      window.push(token);
      skippedWindow.push(skipped);

      const byte = this.hash(token);

      if (window.length < this.k) {
        hash.nextHash(byte);
        continue;
      }
      const data = this.zip(skippedWindow, window);
      const hashV = hash.nextHash(byte);
      yield {
        hash: hashV,
        start: filePos,
        stop: filePos + data.length - 1,
        data
      };
    }
  }
}
