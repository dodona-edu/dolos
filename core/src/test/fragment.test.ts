import test from "ava";
import * as fs from "fs";
import { File } from "../file/file.js";
import { TokenizedFile } from "../file/tokenizedFile.js";
import { WinnowFilter } from "../hashing/winnowFilter.js";
import { Fingerprint } from "../hashing/hashFilter.js";
import { PairedOccurrence } from "../algorithm/pairedOccurrence.js";
import { Region } from "../util/region.js";
import { SharedFingerprint } from "../algorithm/sharedFingerprint.js";
import { Fragment } from "../algorithm/fragment.js";

function createTokenizedSampleFile(): TokenizedFile {
  const json = JSON.parse(fs.readFileSync("./src/test/fixtures/sample.tokenized.json", "utf8"));
  const file = new File(json.path, json.content);
  return new TokenizedFile(file, json.tokens, json.mapping);
}


test("fragment should fully reconstruct matched kgrams when k > w", t => {

  const f1 = createTokenizedSampleFile();
  const f2 = createTokenizedSampleFile();

  const filter = new WinnowFilter(10, 5, true);

  const f1Hashes = [];
  for (const hash of filter.fingerprints(f1.tokens)) {
    f1Hashes.push(hash);
  }
  const f2Hashes = [];
  for (const hash of filter.fingerprints(f2.tokens)) {
    f2Hashes.push(hash);
  }
  t.is(f1Hashes.length, f2Hashes.length);

  const createPair = (i: number, h1: Fingerprint, h2: Fingerprint): PairedOccurrence =>
    new PairedOccurrence(
      {
        index: i,
        start: h1.start,
        stop: h1.stop,
        location: Region.merge(f1.mapping[h1.start], f1.mapping[h1.stop]),
        data: h1.data,
      },
      {
        index: i,
        start: h2.start,
        stop: h2.stop,
        location: Region.merge(f2.mapping[h2.start], f2.mapping[h2.stop]),
        data: h2.data,
      },
      new SharedFingerprint(h1.hash, h1.data),
    );

  const fragment = new Fragment(createPair(0, f1Hashes[0], f2Hashes[0]));
  for (let i = 1; i < f1Hashes.length; i += 1) {
    const pair = createPair(i, f1Hashes[i], f2Hashes[i]);
    fragment.extendWith(pair);
  }
  t.deepEqual(f1.tokens, fragment.mergedData);
});

test("fragment should partially reconstruct matched kgrams when k < w", t => {
  const f1 = createTokenizedSampleFile();
  const f2 = createTokenizedSampleFile();

  const filter = new WinnowFilter(5, 10, true);

  const f1Hashes = [];
  for (const hash of filter.fingerprints(f1.tokens)) {
    f1Hashes.push(hash);
  }
  const f2Hashes = [];
  for (const hash of filter.fingerprints(f2.tokens)) {
    f2Hashes.push(hash);
  }
  t.is(f1Hashes.length, f2Hashes.length);

  const createPair = (i: number, h1: Fingerprint, h2: Fingerprint): PairedOccurrence =>
    new PairedOccurrence(
      {
        index: i,
        start: h1.start,
        stop: h1.stop,
        location: Region.merge(f1.mapping[h1.start], f1.mapping[h1.stop]),
        data: h1.data,
      },
      {
        index: i,
        start: h2.start,
        stop: h2.stop,
        location: Region.merge(f2.mapping[h2.start], f2.mapping[h2.stop]),
        data: h2.data,
      },
      new SharedFingerprint(h1.hash, h1.data),
    );

  const fragment = new Fragment(createPair(0, f1Hashes[0], f2Hashes[0]));
  for (let i = 1; i < f1Hashes.length; i += 1) {
    const pair = createPair(i, f1Hashes[i], f2Hashes[i]);
    fragment.extendWith(pair);
  }
  for (let i = 0; i < f1.tokens.length; i++) {
    if (fragment.mergedData?.[i] !== "?") {
      t.deepEqual(f1.tokens[i], fragment.mergedData?.[i]);
    }
  }
});
