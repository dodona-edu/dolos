import nPrime from "nprime";

const k = 20;
const mod = nPrime.next(1 << 25);
const base = nPrime.next(Math.ceil(Math.sqrt(mod)));
console.error(base, mod);

/**
 * Modular exponentiation without overflowing.
 * Code based on the pseudocode at 
 * https://en.wikipedia.org/wiki/Modular_exponentiation#Pseudocode
 * @param base the base
 * @param exp the exponent
 * @param mod the modulus
 */
function modPow (base: number, exp: number, mod: number) : number {
    let y = 1;
    while (exp > 1) {
        if (exp & 1) y = (base * y) % mod;
        base = (base * base) % mod;
        exp >>= 1;
    }
    return (base * y) % mod;
}

const nextHash = (() => {
    const memory = new Array(k).fill(0);
    const maxBase = mod - modPow(base, k, mod);

    let i = 0;
    let hash = 0;
    return (b: number) => {
        hash = (base * hash + b + maxBase * memory[i]) % mod;
        memory[i] = b;
        i = (i + 1) % k;
        return hash;
    };
})();

process.stdin.on("data", data => {
    let s = "";
    data.forEach((b: number) => {
        s += nextHash(b) + "\n";
    });
    console.log(s);
});