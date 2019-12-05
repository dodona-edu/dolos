import test from "ava";
import * as path from "path";
import { CodeTokenizer } from "../lib/tokenizers/codeTokenizer";

test("tokenizer creation works for all listed languages", t => {
  for (const language of CodeTokenizer.supportedLanguages) {
    t.truthy(new CodeTokenizer(language));
  }
});

test("tokenizer creation throws error for unsupported language", t => {
  t.throws(() => new CodeTokenizer("some string"));
});

test("registering a new installed language works", t => {
  t.is(undefined, CodeTokenizer.registerLanguage("python"));
});

test("registering a new invalid language throws error", t => {
  t.throws(() => CodeTokenizer.registerLanguage("some string"));
});

test("tokenizer with or without location is equal", async t => {
  const tokenizer = new CodeTokenizer("javascript");
  const file = path.resolve(`samples/js/sample.js`);

  const [tokenized, mapping] = await tokenizer.tokenizeFileWithMapping(file);

  t.snapshot(tokenized);
  t.snapshot(mapping);
});
