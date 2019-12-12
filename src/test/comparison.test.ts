import test from "ava";
import * as sinon from "sinon";
import { Comparison, Matches } from "../lib/comparison";
import { File } from "../lib/files/file";
import { FileGroup } from "../lib/files/fileGroup";
import { CodeTokenizer } from "../lib/tokenizers/codeTokenizer";
import { Tokenizer } from "../lib/tokenizers/tokenizer";

const files: string[] = [
  "samples/js/sample.js",
  "samples/js/another_copied_function.js",
  "samples/js/copied_function.js",
];

test("all files no filter test", async t => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: undefined,
  });
  const groups = await FileGroup.groupByFile(files);
  await comparison.addAll(groups);

  const results: Map<FileGroup, Matches<number>> =
    await comparison.compareFiles(groups);
  t.snapshot(results);
});

test("all files basefile test", async t => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: undefined,
  });
  const groups = await FileGroup.groupByFile(files);
  await comparison.addAll(groups.filter((_, index) => index !== 1));
  await comparison.addToFilterList(groups[1]);

  const results: Map<FileGroup, Matches<number>> =
    await comparison.compareFiles(groups);
  t.snapshot(results);
});

test("all files max hash count", async t => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: false,
    maxHash: 4,
  });
  const groups = await FileGroup.groupByFile(files);
  await comparison.addAll(groups);

  const results: Map<FileGroup, Matches<number>> =
    await comparison.compareFiles(groups);
  t.snapshot(results);
});

test("all files max hash percentage", async t => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });
  const groups = await FileGroup.groupByFile(files);
  await comparison.addAll(groups);

  const results: Map<FileGroup, Matches<number>> =
    await comparison.compareFiles(groups);
  t.snapshot(results);
});

test.skip("add non-existing file", async t => {
  const spy = sinon.spy(console, "error");
  const file = await File.alone("thisFileShouldNotExist.txt");

  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });

  await comparison.add(file.group);
  t.true(spy.called);
  t.true(spy.calledWith(
    `There was a problem parsing ${file}. ` +
    `Error: ENOENT: no such file or directory, open '${file}'`
  ));
  spy.restore();
});

// Mocking global objects cannot be restored somehow
test.skip("add non-existing file to filter list", async t => {
  const spy = sinon.spy(console, "error");
  const file = await File.alone("thisFileShouldNotExist.txt");

  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });
  await comparison.addToFilterList(file.group);

  t.true(spy.called);
  t.true(spy.calledWith(
    `There was a problem parsing ${file}. ` +
    `Error: ENOENT: no such file or directory, open '${file}'`
  ));
  spy.restore();
});
