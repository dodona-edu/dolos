import { Readable } from "stream";
import { RollingHash } from "../rollingHash";
import { Hash, HashFilter } from "./hashFilter";

export class NoFilter extends HashFilter {
  private readonly k: number;

  /**
   * Generates a HashFilter object with given k-mer size. It will not filter
   * anything and return all hashes
   *
   * @param k The k-mer size of which hashes are calculated
   */
  constructor(k: number) {
    super();
    this.k = k;
  }

  /**
   * Returns an async interator that yields tuples containing a hash and its
   * corresponding k-mer position. Can be called successively on multiple files.
   *
   * @param stream The readable stream of a file (or stdin) to process. Such
   * stream can be created using fs.createReadStream("path").
   */
  public async *hashes(stream: Readable): AsyncIterableIterator<Hash> {
    const hash = new RollingHash(this.k);
    let filePos: number = -1 * this.k;

    for await (const byte of HashFilter.readBytes(stream)) {
      filePos++;
      if (filePos < 0) {
        hash.nextHash(byte);
        continue;
      }
      yield { hash: hash.nextHash(byte), location: filePos };
    }
  }
}
