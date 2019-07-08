import { RollingHash } from "../rollingHash";

test("hash is independant of prefix", () => {
  const hash1 = new RollingHash(3);
  const hash2 = new RollingHash(3);
  // first add a to hash1, then add bcd to both
  for (const c of "abc") { hash1.nextHash(c.charCodeAt(0)); }
  for (const c of "bc") { hash2.nextHash(c.charCodeAt(0)); }

  const h1 = hash1.nextHash("d".charCodeAt(0));
  const h2 = hash2.nextHash("d".charCodeAt(0));
  expect(h1).toBe(h2);
});

test("hash value is consistent", () => {
  const hash = new RollingHash(3);
  for (const c of "abc") { hash.nextHash(c.charCodeAt(0)); }
  expect(hash.nextHash("d".charCodeAt(0))).toBe(10093531);
});

test("hash value is consistent", () => {
  const hash = new RollingHash(3);
  for (const c of "abc") { hash.nextHash(c.charCodeAt(0)); }
  expect(hash.nextHash("d".charCodeAt(0))).toBe(10093531);
});

test("simple modulo and base is predictable", () => {
  const numbers = [3, 1, 4, 1, 5, 9, 2];
  const expectedHashes = [3, 31, 314, 3141, 1415, 4159, 1592];
  const hash = new RollingHash(4, 10, 10000);
  const hashes = [];
  for (const digit of numbers) {
    hashes.push(hash.nextHash(digit));
  }
  expect(hashes).toEqual(expectedHashes);
});
