import test from "ava";
import { File } from "../lib/file/file";
import { Fingerprint } from "../lib/hashing/hashFilter";
import { PairedOccurrence } from "../lib/analyze/pairedOccurrence";
import { Fragment } from "../lib/analyze/fragment";
import { Region } from "../lib/util/region";
import { SharedFingerprint } from "../lib/analyze/sharedFingerprint";
import { WinnowFilter } from "../lib/hashing/winnowFilter";
import {LanguagePicker} from "../lib/util/language";


test("fragment should fully reconstruct matched kgrams when k > w", async t => {
  const tokenizer = new LanguagePicker().findLanguage("javascript").createTokenizer();
  const f1 = tokenizer.tokenizeFile(
    (await File.fromPath("../samples/javascript/sample.js")).ok()
  );
  const f2 = tokenizer.tokenizeFile(
    (await File.fromPath("../samples/javascript/sample.js")).ok()
  );

  const filter = new WinnowFilter(10, 5, true);

  const f1Hashes = [];
  for await (const hash of filter.fingerprints(f1.ast)) {
    f1Hashes.push(hash);
  }
  const f2Hashes = [];
  for await (const hash of filter.fingerprints(f2.ast)) {
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
  t.deepEqual(f1.ast, fragment.mergedData);
});

test("fragment should partially reconstruct matched kgrams when k < w", async t => {
  const tokenizer = new LanguagePicker().findLanguage("javascript").createTokenizer();
  const f1 = tokenizer.tokenizeFile(
    (await File.fromPath("../samples/javascript/sample.js")).ok()
  );
  const f2 = tokenizer.tokenizeFile(
    (await File.fromPath("../samples/javascript/sample.js")).ok()
  );

  const filter = new WinnowFilter(5, 10, true);

  const f1Hashes = [];
  for await (const hash of filter.fingerprints(f1.ast)) {
    f1Hashes.push(hash);
  }
  const f2Hashes = [];
  for await (const hash of filter.fingerprints(f2.ast)) {
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
  for (let i = 0; i < f1.ast.length; i++) {
    if (fragment.mergedData?.[i] !== "?") {
      t.deepEqual(f1.ast[i], fragment.mergedData?.[i]);
    }
  }
});
