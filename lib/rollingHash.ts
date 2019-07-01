/* tslint:disable:no-bitwise */
import nPrime from "nprime";

export default class RollingHash {
    private readonly mod: number = nPrime.next(1 << 25);
    private readonly base: number = nPrime.next(Math.ceil(Math.sqrt(this.mod)));
    private readonly k: number;

    private readonly memory: number[];
    private readonly maxBase: number;

    private i: number = 0;
    private hash: number = 0;

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
        this.base = base ? base : this.base;
        this.mod = mod ? mod : this.mod;

        this.memory = new Array(k).fill(0);
        this.maxBase = this.mod - this.modPow(this.base, this.k, this.mod);
    }

    /**
     * Calculates a new hash based on the previous hash, and the new byte value
     *
     * @param b The next byte
     */
    public nextHash(b: number): number {
        this.hash = (this.base * this.hash + b + this.maxBase * this.memory[this.i]) % this.mod;
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
        let y: number = 1;
        while (exp > 1) {
            if (exp & 1) {
                y = (base * y) % mod;
            }
            base = (base * base) % mod;
            exp >>= 1;
        }
        return (base * y) % mod;
    }
}
