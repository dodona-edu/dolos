import test from "ava";
import { TokenHash } from "../hashing/tokenHash.js";
import { RollingHash } from "../hashing/rollingHash.js";

test("same tokens should result in the same hash", t => {
  const s1 = "abc";
  const s2 = "abc";
  const hasher1 = new TokenHash();
  const hasher2 = new TokenHash();

  t.deepEqual(hasher1.hashToken(s1), hasher2.hashToken(s2));
});

test("tokens with same characters should result in different hash", t => {
  const s1 = "abc";
  const s2 = "bac";
  const hasher1 =  new TokenHash();
  const hasher2 =  new TokenHash();

  t.notDeepEqual(hasher1.hashToken(s1), hasher2.hashToken(s2));
});

test("no collissions when having same characters in different tokens with RollingHash", t => {
  const tokens = [
    ["abc"],
    ["a", "bc"],
    ["ab", "c"],
    ["a", "b", "c"]
  ];
  const hasher = new TokenHash();
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i; j < tokens.length; j++) {
      if (i != j) {
        const r1 = new RollingHash(3);
        const r2 = new RollingHash(3);
        let h1, h2;
        for (let k = 0; k < tokens[i].length; k++) {
          h1 = r1.nextHash(hasher.hashToken(tokens[i][k]));
        }
        for (let k = 0; k < tokens[j].length; k++) {
          h2 = r2.nextHash(hasher.hashToken(tokens[j][k]));
        }
        t.notDeepEqual(h1, h2);
      }
    }
  }
});

test("hashes should be stable", t => {
  const data = "Alright, but apart from the sanitation, the medicine, " +
    "education, wine, public order, irrigation, roads, the fresh-water " +
    "system, and public health, what have the Romans ever done for us?";

  const hasher = new TokenHash();
  const hashes = data.split(" ").map(word => hasher.hashToken(word));
  t.snapshot(hashes);
});
