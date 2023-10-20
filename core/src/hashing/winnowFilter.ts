import { Fingerprint, HashFilter } from "./hashFilter.js";
import { RollingHash } from "./rollingHash.js";

export class WinnowFilter extends HashFilter {
  private readonly k: number;
  private readonly windowSize: number;

  /**
   * Generates a Winnow object with given window size and kgram size. The
   * winnowing algorithm will reduce the number of hashing values returned by the
   * hashing function. It will at least return 1 hashing for every window (i.e. for
   * every windowSize characters).
   *
   * @param k The kgram size of which hashes are calculated
   * @param windowSize The window size
   * @param kgramData Whether to output kgram content in fingerprints.
   */
  constructor(k: number, windowSize: number, kgramData = false) {
    super(kgramData);
    this.k = k;
    this.windowSize = windowSize;
  }

  /**
   * Returns an async iterator that yields fingerprints containing a hashing and its
   * corresponding kgram position. Can be called successively on multiple files.
   *
   * Code based on pseudocode from
   * http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
   *
   * @param tokens The list of tokens to process.
   */
  public fingerprints(tokens: string[]): Array<Fingerprint> {
    const hash = new RollingHash(this.k);
    let window: string[] = [];
    let filePos: number = -1 * this.k;
    let bufferPos = 0;
    let minPos = 0;
    const buffer: number[] = new Array(this.windowSize).fill(Number.MAX_SAFE_INTEGER);
    const fingerprints: Array<Fingerprint> = [];

    // At the end of each iteration, minPos holds the position of the rightmost
    // minimal hashing in the current window.
    // yield([x,pos]) is called only the first time an instance of x is selected
    for (const [hashedToken, token] of this.hashTokens(tokens)) {
      filePos++;
      window = window.slice(-this.k + 1);
      window.push(token);
      if (filePos < 0) {
        hash.nextHash(hashedToken);
        continue;
      }
      bufferPos = (bufferPos + 1) % this.windowSize;
      buffer[bufferPos] = hash.nextHash(hashedToken);
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

        fingerprints.push({
          data: this.kgramData ? tokens.slice(start, start + this.k) : null,
          hash: buffer[minPos],
          start,
          stop: start + this.k - 1,
        });

      } else {
        // Otherwise, the previous minimum is still in this window. Compare
        // against the new value and update minPos if necessary.
        if (buffer[bufferPos] <= buffer[minPos]) {
          minPos = bufferPos;
          const start = filePos + ((minPos - bufferPos - this.windowSize) % this.windowSize);

          fingerprints.push({
            data: this.kgramData ? tokens.slice(start, start + this.k) : null,
            hash: buffer[minPos],
            start,
            stop: start + this.k - 1,
          });
        }
      }
    }
    return fingerprints;
  }
}
