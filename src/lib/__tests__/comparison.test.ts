import { Comparison, Matches } from "../comparison";
import { CodeTokenizer } from "../tokenizers/codeTokenizer";
import { Tokenizer } from "../tokenizers/tokenizer";
const files: string[] = [
  "samples/js/sample.js",
  "samples/js/another_copied_function.js",
  "samples/js/copied_function.js",
];

test("all files no filter test", async () => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: undefined,
  });
  await comparison.addFiles(files);

  const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
  expect(results).toMatchSnapshot();
});

test("all files basefile test", async () => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: undefined,
  });
  await comparison.addFiles(files.filter((_, index) => index !== 1));
  await comparison.addFileToFilterList(files[1]);

  const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
  expect(results).toMatchSnapshot();
});

test("all files max hash count", async () => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: false,
    maxHash: 4,
  });
  await comparison.addFiles(files);

  const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
  expect(results).toMatchSnapshot();
});

test("all files max hash percentage", async () => {
  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });
  await comparison.addFiles(files);

  const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
  expect(results).toMatchSnapshot();
});

test("add non-existing file", async () => {
  const mock = jest.fn();
  console.error = mock;
  const file: string = "thisFileShouldNotExist.txt";

  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });
  await comparison.addFile(file);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(
    `There was a problem parsing ${file}. Error: ENOENT: no such file or directory, open '${file}'`,
  );
  jest.resetAllMocks();
});

test("add non-existing file to filter list", async () => {
  const mock = jest.fn();
  console.error = mock;
  const file: string = "thisFileShouldNotExist.txt";

  const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
  const comparison: Comparison<number> = new Comparison(tokenizer, {
    filterHashByPercentage: true,
    maxHash: 0.4,
  });
  await comparison.addFileToFilterList(file);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(
    `There was a problem parsing ${file}. Error: ENOENT: no such file or directory, open '${file}'`,
  );
  jest.resetAllMocks();
});

test("grouping files test", () => {
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
  expect(groupedFiles.size).toBe(testFiles.length);

  for (const [fileName, groupRoot] of Array.from(groupedFiles.entries())) {
    expect(fileName.includes(groupRoot)).toBe(true);
  }
});
