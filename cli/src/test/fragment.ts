import test from "ava";
import { File } from "../lib/file/file";
import { Hash } from "../lib/hashing/hashFilter";
import { PairedOccurrence } from "../lib/analyze/pairedOccurrence";
import { Hunk } from "../lib/analyze/hunk";
import { Region } from "../lib/util/region";
import { SharedKmer } from "../lib/analyze/sharedKmer";
import { CodeTokenizer } from "../lib/tokenizer/codeTokenizer";
import { WinnowFilter } from "../lib/hashing/winnowFilter";


test("fragment should reconstruct matched kmers", async t => {
  const tokenizer = new CodeTokenizer("javascript");
  const f1 = tokenizer.tokenizeFile(
    (await File.fromPath("samples/javascript/sample.js")).ok()
  );
  const f2 = tokenizer.tokenizeFile(
    (await File.fromPath("samples/javascript/sample.js")).ok()
  );

  const filter = new WinnowFilter(50, 40);

  const f1Hashes = [];
  for await (const hash of filter.hashesFromString(f1.ast)) {
    f1Hashes.push(hash);
  }
  const f2Hashes = []
  for await (const hash of filter.hashesFromString(f2.ast)) {
    f2Hashes.push(hash);
  }
  t.is(f1Hashes.length, f2Hashes.length);

  const createMatch = (i: number, h1: Hash, h2: Hash): PairedOccurrence =>
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

  const fragment = new Hunk(createMatch(0, f1Hashes[0], f2Hashes[0]));
  for (let i = 1; i < f1Hashes.length; i += 1) {
    fragment.extendWithMatch(createMatch(i, f1Hashes[i], f2Hashes[i]));
  }

  t.is(f1.ast.slice(0, -9), fragment.mergedData);
});
