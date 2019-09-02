import { Tokenizer } from "../tokenizer";
import { CodeTokenizer } from "../codeTokenizer";
import { Comparison, Matches } from "../comparison";
const files: string[] = [
    "samples/js/sample.js",
    "samples/js/another_copied_function.js",
    "samples/js/copied_function.js",
];

test("all files no filter test", async () => {
    const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
    const comparison: Comparison<number> = new Comparison(
        tokenizer, {filterHashByPercentage: undefined}
    )
    await comparison.addFiles(files);

    const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
    expect(results).toMatchSnapshot();
});

test("all files basefile test", async () => {
    const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
    const comparison: Comparison<number> = new Comparison(
        tokenizer, {filterHashByPercentage: undefined}
    )
    await comparison.addFiles(files.filter((_, index) => index !== 1));
    await comparison.addFileToFilterList(files[1]);

    const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
    expect(results).toMatchSnapshot();
});

test("all files max hash count", async () => {
    const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
    const comparison: Comparison<number> = new Comparison(
        tokenizer, {filterHashByPercentage: false, maxHash: 4}
    )
    await comparison.addFiles(files);

    const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
    expect(results).toMatchSnapshot();
});

test("all files max hash percentage", async () => {
    const tokenizer: Tokenizer<number> = new CodeTokenizer("javascript");
    const comparison: Comparison<number> = new Comparison(
        tokenizer, {filterHashByPercentage: true, maxHash: 0.4}
    )
    await comparison.addFiles(files);

    const results: Map<string, Matches<number>> = await comparison.compareFiles(files);
    expect(results).toMatchSnapshot();
});