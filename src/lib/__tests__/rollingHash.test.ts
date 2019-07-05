import { RollingHash } from "../rollingHash";

test("hash is independant of prefix", () => {
    const hash1 = new RollingHash(3);
    const hash2 = new RollingHash(3);
    // first add a to hash1, then add bcd to both
    hash1.nextHash("a".charCodeAt(0));
    hash1.nextHash("b".charCodeAt(0));
    hash2.nextHash("b".charCodeAt(0));
    hash1.nextHash("c".charCodeAt(0));
    hash2.nextHash("c".charCodeAt(0));
    const h1 = hash1.nextHash("d".charCodeAt(0));
    const h2 = hash2.nextHash("d".charCodeAt(0));
    expect(h1).toBe(h2);
});
