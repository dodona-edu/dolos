import path from "path";
import { CodeTokenizer } from "../codeTokenizer";

test("tokenizer creation works for all listed languages", () => {
  for (const language of CodeTokenizer.supportedLanguages) {
    expect(() => new CodeTokenizer(language)).not.toThrow();
  }
});

test("tokenizer creation throws error for unsupported language", () => {
  expect(() => new CodeTokenizer("some string")).toThrow();
});

test("registering a new installed language works", () => {
  expect(() => CodeTokenizer.registerLanguage("python")).not.toThrow();
});

test("registering a new invalid language throws error", () => {
  expect(() => CodeTokenizer.registerLanguage("some string")).toThrow();
});

test("tokenizer with or without location is equal", async () => {
  const tokenizer = new CodeTokenizer("javascript");
  const file = path.resolve(`samples/js/sample.js`);

  const [tokenized, mapping] = await tokenizer.tokenizeFileWithMapping(file);

  expect(tokenized).toMatchSnapshot();
  expect(mapping).toMatchSnapshot();
});
