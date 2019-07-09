import { Readable } from "stream";
import { HashFilter } from "./hashFilter";
import { RollingHash } from "./rollingHash";

export class ModFilter extends HashFilter {
  private readonly k: number;
  private readonly mod: number;

  /**
   * Generates a HashFilter object with given k-mer size and mod value. It will return
   * all hashes whose value is 0 after % mod.
   *
   * @param k The k-mer size of which hashes are calculated
   * @param mod The mod value for which hashes to keep
   */
  constructor(k: number, mod: number) {
    super();
    this.k = k;
    this.mod = mod;
  }

  /**
   * Returns an async interator that yields tuples containing a hash and its corresponding k-mer
   * position. Can be called successively on multiple files.
   *
   * @param stream The readable stream of a file (or stdin) to process. Such stream can be created
   * using fs.createReadStream("path").
   */
  public async *hashes(stream: Readable): AsyncIterableIterator<[number, number]> {
    const hash = new RollingHash(this.k);
    let filePos: number = -1 * this.k;
    let currentHash: number;

    for await (const byte of HashFilter.readBytes(stream)) {
      filePos++;
      if (filePos < 0) {
        hash.nextHash(byte);
        continue;
      }
      currentHash = hash.nextHash(byte);
      if (currentHash % this.mod === 0) {
        yield [currentHash, filePos];
      }
    }
  }
}
