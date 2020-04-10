import test from "ava";
import { File } from "../lib/file/file";
import { Hash } from "../lib/hashing/hashFilter";
import { Match } from "../lib/analyze/match";
import { Fragment } from "../lib/analyze/fragment";
import { Selection } from "../lib/util/selection";
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

  const createMatch = (i: number, h1: Hash, h2: Hash): Match<Selection> =>
    new Match(
      i,
      Selection.merge(f1.mapping[h1.start], f1.mapping[h1.stop]),
      h1.data,
      i,
      Selection.merge(f2.mapping[h2.start], f2.mapping[h2.stop]),
      h2.data,
      h1.hash
    );

  const fragment = new Fragment(createMatch(0, f1Hashes[0], f2Hashes[0]));
  for (let i = 1; i < f1Hashes.length; i += 1) {
    fragment.extend(createMatch(i, f1Hashes[i], f2Hashes[i]));
  }

  t.is(f1.ast.slice(0, -9), fragment.mergedData);
});
