import { Readable } from "stream";
import { Hash } from "./hashFilter";
import { NoFilter } from "./noFilter";

export class ModFilter extends NoFilter {
  private readonly mod: number;

  /**
   * Generates a HashFilter object with given k-mer size and mod value. It will
   * return all hashes whose value is 0 after % mod.
   *
   * @param k The k-mer size of which hashes are calculated
   * @param mod The mod value for which hashes to keep
   */
  constructor(k: number, mod: number) {
    super(k);
    this.mod = mod;
  }

  /**
   * Returns an async interator that yields tuples containing a hashing and its
   * corresponding k-mer position. Can be called successively on multiple files.
   *
   * @param stream The readable stream of a file (or stdin) to process. Such
   * stream can be created using fs.createReadStream("path").
   */
  public async *hashes(stream: Readable): AsyncIterableIterator<Hash> {
    for await( const hash of super.hashes(stream)) {
      if( hash.hash % this.mod === 0) {
        yield hash;
      }
    }
  }
}
