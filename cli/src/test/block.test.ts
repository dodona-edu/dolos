import test from "ava";
import { File } from "../lib/file/file";
import { Fingerprint } from "../lib/hashing/hashFilter";
import { PairedOccurrence } from "../lib/analyze/pairedOccurrence";
import { Block } from "../lib/analyze/block";
import { Region } from "../lib/util/region";
import { SharedKmer } from "../lib/analyze/sharedKmer";
import { CodeTokenizer } from "../lib/tokenizer/codeTokenizer";
import { WinnowFilter } from "../lib/hashing/winnowFilter";


test("block should fully reconstruct matched kmers when k > w", async t => {
  const tokenizer = new CodeTokenizer("javascript");
  const f1 = tokenizer.tokenizeFile(
    (await File.fromPath("samples/javascript/sample.js")).ok()
  );
  const f2 = tokenizer.tokenizeFile(
    (await File.fromPath("samples/javascript/sample.js")).ok()
  );

  const filter = new WinnowFilter(10, 5);

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
      new SharedKmer(h1.hash, h1.data),
    );

  const block = new Block(createPair(0, f1Hashes[0], f2Hashes[0]));
  for (let i = 1; i < f1Hashes.length; i += 1) {
    const pair = createPair(i, f1Hashes[i], f2Hashes[i]);
    block.extendWithPair(pair);
  }
  t.deepEqual(f1.ast, block.mergedData);
});

test("block should partially reconstruct matched kmers when k < w", async t => {
  const tokenizer = new CodeTokenizer("javascript");
  const f1 = tokenizer.tokenizeFile(
    (await File.fromPath("samples/javascript/sample.js")).ok()
  );
  const f2 = tokenizer.tokenizeFile(
    (await File.fromPath("samples/javascript/sample.js")).ok()
  );

  const filter = new WinnowFilter(5, 10);

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
      new SharedKmer(h1.hash, h1.data),
    );

  const block = new Block(createPair(0, f1Hashes[0], f2Hashes[0]));
  for (let i = 1; i < f1Hashes.length; i += 1) {
    const pair = createPair(i, f1Hashes[i], f2Hashes[i]);
    block.extendWithPair(pair);
  }
  for (let i = 0; i < f1.ast.length; i++) {
    if (block.mergedData[i] !== "?") {
      t.deepEqual(f1.ast[i], block.mergedData[i]);
    }
  }
});
