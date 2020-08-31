import { Readable } from "stream";
import { Hash, HashFilter } from "./hashFilter";
import { RollingHash } from "./rollingHash";
import sha1 from "sha1";

export class NoFilter extends HashFilter {
  private readonly k: number;

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
    let window: string[] = [];
    let filePos: number = -1 * this.k;

    for await (const token of HashFilter.readTokens(stream)) {
      filePos += token.length;
      window = window.slice(-this.k+1);
      window.push(token);

      let byte;
      if (token.length === 1) {
        byte = token.charCodeAt(0);
      } else {
        byte = parseInt(sha1(token), 16);
      }

      if (filePos < 0) {
        hash.nextHash(byte);
        continue;
      }
      const data = window.join("");
      const hashV = hash.nextHash(byte);
      console.log(filePos, filePos + data.length - 1, data);
      yield {
        hash: hashV,
        start: filePos,
        stop: filePos + data.length - 1,
        data
      };
    }
  }
}
