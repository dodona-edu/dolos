import test from "ava";
import { Comparison } from "../lib/analyze/comparison";
import { CodeTokenizer } from "../lib/tokenizer/codeTokenizer";
import { Options } from "../lib/util/options";
import { Tokenizer } from "../lib/tokenizer/tokenizer";
import { File } from "../lib/file/file";

const samples: string[] = [
  "samples/javascript/sample.js",
  "samples/javascript/another_copied_function.js",
  "samples/javascript/copied_function.js",
];

test("all files no hashing test", async t => {
  const tokenizer: Tokenizer = new CodeTokenizer("javascript");
  const comparison: Comparison = new Comparison(tokenizer);
  const files = (await File.readAll(samples)).ok();
  const results = await comparison.compareFiles(files);
  t.snapshot(results);
});


test("all files max hashing count", async t => {
  const tokenizer: Tokenizer = new CodeTokenizer("javascript");
  const comparison: Comparison = new Comparison(tokenizer, new Options({
    maxHashCount: 4,
  }));
  const files = (await File.readAll(samples)).ok();
  const results = await comparison.compareFiles(files);
  t.snapshot(results);
});

test("all files max hashing percentage", async t => {
  const tokenizer: Tokenizer = new CodeTokenizer("javascript");
  const comparison: Comparison = new Comparison(tokenizer, new Options({
    maxHashPercent: 0.4,
  }));
  const files = (await File.readAll(samples)).ok();
  const results = await comparison.compareFiles(files);
  t.snapshot(results);
});
