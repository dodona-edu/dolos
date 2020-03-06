import test from "ava";
import * as sinon from "sinon";
import { Comparison } from "../lib/comparison";
import { CodeTokenizer } from "../lib/codeTokenizer";
import { Options } from "../lib/options";
import { Tokenizer } from "../lib/tokenizer";
import { Selection } from "../lib/selection";

const files: string[] = [
  "samples/javascript/sample.js",
  "samples/javascript/another_copied_function.js",
  "samples/javascript/copied_function.js",
];

test("all files no filter test", async t => {
  const tokenizer: Tokenizer<Selection> = new CodeTokenizer("javascript");
  const comparison: Comparison = new Comparison(tokenizer);
  await comparison.addFiles(files);

  const results = await comparison.compareFiles(files);
  t.snapshot(results);
});


test("all files max hash count", async t => {
  const tokenizer: Tokenizer<Selection> = new CodeTokenizer("javascript");
  const comparison: Comparison = new Comparison(tokenizer, new Options({
    maxHashCount: 4,
  }));
  await comparison.addFiles(files);

  const results = await comparison.compareFiles(files);
  t.snapshot(results);
});

test("all files max hash percentage", async t => {
  const tokenizer: Tokenizer<Selection> = new CodeTokenizer("javascript");
  const comparison: Comparison = new Comparison(tokenizer, new Options({
    maxHashPercent: 0.4,
  }));
  await comparison.addFiles(files);

  const results = await comparison.compareFiles(files);
  t.snapshot(results);
});

test.skip("add non-existing file", async t => {
  const spy = sinon.spy(console, "error");
  const file = "thisFileShouldNotExist.txt";

  const tokenizer: Tokenizer<Selection> = new CodeTokenizer("javascript");
  const comparison: Comparison = new Comparison(tokenizer, new Options({
    maxHashPercent: 0.4,
  }));

  await comparison.addFile(file);
  t.true(spy.called);
  t.true(spy.calledWith(
    `There was a problem parsing ${file}. ` +
    `Error: ENOENT: no such file or directory, open '${file}'`
  ));
  spy.restore();
});
