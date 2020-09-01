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
    const window: string[] = [];
    const skippedWindow: number[] = [];
    let filePos = 0;
    let bufferPos = 0;
    let minPos = 0;
    let lastToken = "";
    let lastSkipped = 0;

    const buffer: number[] =
      new Array(this.windowSize).fill(Number.MAX_SAFE_INTEGER);

    // At the end of each iteration, minPos holds the position of the rightmost
    // minimal hashing in the current window.
    // yield([x,pos]) is called only the first time an instance of x is selected
    for await (const { token, skipped } of HashFilter.readTokens(stream)) {
      if (window.length === (this.windowSize + this.k - 1)) {
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

        const offset = (minPos + (this.windowSize - (bufferPos + 1))) % this.windowSize;
        const start = filePos
          + window.slice(0, offset).join("").length
          + skippedWindow.slice(0, offset).reduce((p, c) => p + c, 0);

        const relevantWindow = window.slice(
          offset,
          offset + this.k
        );

        const relevantSkippedWindow = skippedWindow.slice(
          offset,
          offset + this.k
        );

        const data = this.zip(relevantSkippedWindow, relevantWindow);
        yield {
          data,
          hash: buffer[minPos],
          start,
          stop: start + data.length - 1,
        };

      } else {
        // Otherwise, the previous minimum is still in this window. Compare
        // against the new value and update minPos if necessary.
        if (buffer[bufferPos] <= buffer[minPos]) {
          minPos = bufferPos;

          const data = this.zip(
            skippedWindow.slice(-this.k),
            window.slice(-this.k)
          );

          const start = filePos
            + window.slice(0, window.length - this.k).join("").length
            + skippedWindow.slice(0, window.length - this.k).reduce((p, c) => p + c, 0);
          // console.log({ data, start, stop: start + data.length - 1 });
          yield {
            data,
            hash: buffer[minPos],
            start: start,
            stop: start + data.length - 1,
          };
        }
      }
    }
  }
}
