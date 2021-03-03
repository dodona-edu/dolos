/* tslint:disable:no-bitwise */

export class RollingHash {
  protected readonly mod: number;
  protected readonly base: number;
  protected readonly k: number;

  protected readonly memory: number[];
  protected readonly maxBase: number;

  protected i = 0;
  protected hash = 0;

  /**
   * Generates a rolling hashing object that can be used to create hashes of a
   * sliding window of values as defined by the Rabin-Karp string matching
   * algorithm.
   *
   * @param k The size of the window/length of the string of which the hashes
   * are calculated.
   */
  constructor(k: number) {
    this.k = k;
    this.mod = 33554467;
    this.base = 5801;
    this.maxBase = this.mod - this.modPow(this.base, this.k, this.mod);
    this.memory = new Array(this.k).fill(0);
  }

  /**
   * Calculates a new hashing based on the previous hashing, and the new byte value
   *
   * @param b The next byte
   */
  public nextHash(b: number): number {
    this.hash =
      (this.base * this.hash + b + this.maxBase * this.memory[this.i])
      % this.mod;
    this.memory[this.i] = b;
    this.i = (this.i + 1) % this.k;
    return this.hash;
  }

  /**
   * Modular exponentiation without overflowing.
   * Code based on the pseudocode at
   * https://en.wikipedia.org/wiki/Modular_exponentiation#Pseudocode
   *
   * @param base the base
   * @param exp the exponent
   * @param mod the modulus
   */
  private modPow(base: number, exp: number, mod: number): number {
    let y = 1;
    let b = base;
    let e = exp;
    while (e > 1) {
      if (e & 1) {
        y = (b * y) % mod;
      }
      b = (b * b) % mod;
      e >>= 1;
    }
    return (b * y) % mod;
  }
}
