import test from "ava";
import { CodeTokenizerTreeSitter } from "../lib/tokenizer/codeTokenizerTreeSitter";
import { File } from "../lib/file/file";

const languageFiles = {
  "python": "samples/python/caesar.py",
  "javascript": "samples/javascript/sample.js",
  "haskell": "samples/haskell/Caesar.hs",
  "c-sharp": "samples/c-sharp/Caesar.cs",
  "java": "samples/java/Caesar.java",
  "bash": "samples/bash/caesar.sh",
  "char": "samples/char/caesar.txt",
  "c": "samples/c/caesar.c",
} as {[key: string]: string};

for (const language of CodeTokenizerTreeSitter.supportedLanguages) {
  test(`tokenizer works for ${language}`, async t => {
    const tokenizer =  new CodeTokenizerTreeSitter(language);
    t.truthy(tokenizer);

    const sampleFile:  string | undefined = languageFiles[language];

    if (sampleFile === undefined) {
      t.fail(`${language} doesn't have a sample file`);
    } else {
      const file = (await File.fromPath(sampleFile)).ok();
      const tokens = (await tokenizer.tokenizeFile(file)).tokenStream;
      t.truthy(tokens);
      t.snapshot(tokens, "stable tokenization");
    }
  });
}

test("tokenizer creation throws error for unsupported language", t => {
  t.throws(() => new CodeTokenizerTreeSitter("some string"));
});

test("registering a new installed language works", t => {
  t.is(undefined, CodeTokenizerTreeSitter.registerLanguage("python"));
});

test("registering a new invalid language throws error", t => {
  t.throws(() => CodeTokenizerTreeSitter.registerLanguage("some string"));
});

test("tokenizer with or without location is equal", async t => {
  const tokenizer = new CodeTokenizerTreeSitter("javascript");
  const file = (await File.fromPath(languageFiles["javascript"])).ok();

  const tokenized = (await tokenizer.tokenizeFile(file));

  t.snapshot(tokenized.tokenStream);
  t.snapshot(tokenized.mapping);
});
