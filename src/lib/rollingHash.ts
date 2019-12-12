/* tslint:disable:no-bitwise */
/// <reference types="../../typings/nprime" />
import nPrime from "nprime";

export class RollingHash {
  private readonly mod: number;
  private readonly base: number;
  private readonly k: number;

  private readonly memory: number[];
  private readonly maxBase: number;

  private i = 0;
  private hash = 0;

  /**
   * Generates a rolling hash object that can be used to create hashes of a
   * sliding window of values as defined by the Rabin-Karp string matching
   * algorithm.
   *
   * @param k The size of the window/length of the string of which the hashes
   * are calculated.
   * @param base The base to be used for the hash function. By default, a prime
   * number around 2^13 is used.
   * @param mod The modulus to be used for the hash function. By default, a
   * prime number just over 2^25 is used.
   */
  constructor(k: number, base?: number, mod?: number) {
    this.k = k;
    this.mod = mod || nPrime.next(1 << 25);
    this.base = base || nPrime.next(Math.ceil(Math.sqrt(this.mod)));

    this.memory = new Array(k).fill(0);
    this.maxBase = this.mod - this.modPow(this.base, this.k, this.mod);
  }

  /**
   * Calculates a new hash based on the previous hash, and the new byte value
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
