/**
 * Generates a hashing object that can be used to create hashes of a
 * token string. It is based on the rolling hash used in the
 * Rabin-Karp string matching algorithm, but without the rolling
 * property.
 *
 * The hash base is chosen to be different than the one used in
 * RollingHash as to not create collisions with similar subsequent
 * tokens (e.g. hash(['abc'] should not equal hash(['a', 'b', 'c'])).
 */
export class TokenHash {
  /**
   * The modulus used in the hash calculation.
   *
   * Since we want to be able to take the product of two hashes, the product of
   * two hashes, the modulus multiplied by itself should not have more than the
   * available amount of bits of precision.
   *
   * Javascript has 53-bit precision numbers (doubles) so we pick the largest
   * prime number with 26 bits.
   */
  readonly mod: number = 33554393;

  /**
   * The base (or radix) used in the hash calculation.
   *
   * We want that even small tokens use as much bits as possible. Because we
   * assume the input token characters will mostly be less than 128, we pick
   * our base such that multiplying with an input character use as much bits
   * as possible.
   *
   * Hence this is the largest prime number such that 127 * base < mod.
   */
  readonly base: number = 747287;

  public hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash + token.charCodeAt(i)) * this.base) % this.mod;
    }
    return hash;
  }
}