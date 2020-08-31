import { Readable } from "stream";
import { Hash, HashFilter } from "./hashFilter";
import { RollingHash } from "./rollingHash";

export class WinnowFilter extends HashFilter {
  private readonly k: number;
  private readonly windowSize: number;

  /**
   * Generates a Winnow object with given window size and k-mer size. The
   * winnowing algorithm will reduce the number of hashing values returned by the
   * hashing function. It will at least return 1 hashing for every window (i.e. for
   * every windowSize characters).
   *
   * @param k The k-mer size of which hashes are calculated
   * @param windowSize The window size
   */
  constructor(k: number, windowSize: number) {
    super();
    this.k = k;
    this.windowSize = windowSize;
  }

  /**
   * Returns an async interator that yields tuples containing a hashing and its
   * corresponding k-mer position. Can be called successively on multiple files.
   *
   * Code based on pseudocode from
   * http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
   *
   * @param stream The readable stream of a file (or stdin) to process. Such
   * stream can be created using `fs.createReadStream("path")`.
   */
  public async *hashes(stream: Readable): AsyncIterableIterator<Hash> {
    const hash = new RollingHash(this.k);
    let window = "";
    let filePos: number = -1 * this.k;
    let bufferPos = 0;
    let minPos = 0;
    const buffer: number[] =
      new Array(this.windowSize).fill(Number.MAX_SAFE_INTEGER);

    // At the end of each iteration, minPos holds the position of the rightmost
    // minimal hashing in the current window.
    // yield([x,pos]) is called only the first time an instance of x is selected
    for await (const byte of HashFilter.readBytes(stream)) {
      filePos++;
      const char = String.fromCharCode(byte);
      window = window.slice(-(this.windowSize + this.k)) + char;
      if (filePos < 0) {
        hash.nextHash(byte);
        continue;
      }
      bufferPos = (bufferPos + 1) % this.windowSize;
      buffer[bufferPos] = hash.nextHash(byte);
      if (minPos === bufferPos) {
        // The previous minimum is no longer in this window.
        // Scan buffer starting from bufferPos for the rightmost minimal hashing.
        // Note minPos starts with the index of the rightmost hashing.
        for (
          let i = (bufferPos + 1) % this.windowSize;
          i !== bufferPos;
          i = (i + 1) % this.windowSize
        ) {
          if (buffer[i] <= buffer[minPos]) {
            minPos = i;
          }
        }

        const offset = (minPos - bufferPos - this.windowSize) % this.windowSize;
        const start = filePos + offset;
        const data =
          window.slice(window.length + offset - this.k, window.length + offset);

        yield {
          data,
          hash: buffer[minPos],
          start,
          stop: start + this.k - 1,
        };

      } else {
        // Otherwise, the previous minimum is still in this window. Compare
        // against the new value and update minPos if necessary.
        if (buffer[bufferPos] <= buffer[minPos]) {
          minPos = bufferPos;
          const start =
            filePos + ((minPos - bufferPos - this.windowSize) % this.windowSize);
          yield {
            data: window.slice(-this.k),
            hash: buffer[minPos],
            start,
            stop: start + this.k - 1,
          };
        }
      }
    }
  }
}
