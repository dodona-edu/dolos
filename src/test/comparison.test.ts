import test from "ava";
import * as sinon from "sinon";
import { Comparison, Matches } from "../lib/comparison";
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
  await comparison.addFiles(files);

  const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
  t.snapshot(results);
});

test("all files basefile test", async t => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: undefined,
  });
  await comparison.addFiles(files.filter((_, index) => index !== 1));
  await comparison.addFileToFilterList(files[1]);

  const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
  t.snapshot(results);
});

test("all files max hash count", async t => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: false,
    maxHash: 4,
  });
  await comparison.addFiles(files);

  const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
  t.snapshot(results);
});

test("all files max hash percentage", async t => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });
  await comparison.addFiles(files);

  const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
  t.snapshot(results);
});

test.skip("add non-existing file", async t => {
  const spy = sinon.spy(console, "error");
  const file: string = "thisFileShouldNotExist.txt";

  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });

  await comparison.addFile(file);
  t.true(spy.called);
  t.true(spy.calledWith(
    `There was a problem parsing ${file}. Error: ENOENT: no such file or directory, open '${file}'`,
  ));
  spy.restore();
});

// Mocking global objects cannot be restored somehow
test.skip("add non-existing file to filter list", async t => {
  const spy = sinon.spy(console, "error");
  const file: string = "thisFileShouldNotExist.txt";

  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });
  await comparison.addFileToFilterList(file);

  t.true(spy.called);
  t.true(spy.calledWith(
    `There was a problem parsing ${file}. Error: ENOENT: no such file or directory, open '${file}'`,
  ));
  spy.restore();
});

test("grouping files test", t => {
  const testFiles: string[] = [
    "samples/js/assignment1/student3/tempName/childClass.js",
    "samples/js/assignment1/student3/tempName/hello.js",
    "samples/js/assignment1/student3/tempName/subDir/subsubClass.js",
    "samples/js/assignment1/student3/another_copied_function.js",
    "samples/js/assignment1/student3/main.js",
    "samples/js/assignment1/student2/helperClasses/childClass.js",
    "samples/js/assignment1/student2/main.js",
    "samples/js/assignment1/student2/copied_function.js",
    "samples/js/assignment1/student1/sample.js",
    "samples/js/assignment1/student1/main.js",
    "samples/js/assignment1/student1/subDirectory/childClass.js",
  ];

  const groupedFiles: Map<string, string> = Comparison.groupPerDirectory(testFiles);
  t.is(testFiles.length, groupedFiles.size);

  for (const [fileName, groupRoot] of Array.from(groupedFiles.entries())) {
    t.is(true, fileName.includes(groupRoot));
  }
});
