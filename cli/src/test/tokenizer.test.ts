import test from "ava";
import { CodeTokenizer } from "../lib/tokenizer/codeTokenizer";
import { File } from "../lib/file/file";

const languageFiles = {
  "python": "samples/python/caesar.py",
  "javascript": "samples/javascript/sample.js",
  "haskell": "samples/haskell/Caesar.hs",
  "c-sharp": "samples/c-sharp/Caesar.cs",
  "java": "samples/java/Caesar.java",
  "bash": "samples/bash/caesar.sh",
} as {[key: string]: string};

for (const language of CodeTokenizer.supportedLanguages) {
  test(`tokenizer works for ${language}`, async t => {
    const tokenizer =  new CodeTokenizer(language);
    t.truthy(tokenizer);

    const sampleFile:  string | undefined = languageFiles[language];

    if (sampleFile === undefined) {
      t.fail(`${language} doesn't have a sample file`);
    } else {
      const file = (await File.fromPath(sampleFile)).ok();
      const tokens = (await tokenizer.tokenizeFile(file)).ast;
      t.truthy(tokens);
      t.snapshot(tokens, "stable tokenization");
    }
  });
}

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
  const file = (await File.fromPath(languageFiles["javascript"])).ok();

  const tokenized = (await tokenizer.tokenizeFile(file));

  t.snapshot(tokenized.ast);
  t.snapshot(tokenized.mapping);
});
