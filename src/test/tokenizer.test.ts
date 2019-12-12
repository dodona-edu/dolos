import test from "ava";
import { File } from "../lib/files/file";
import { CodeTokenizer } from "../lib/tokenizers/codeTokenizer";

const languageFiles = {
  "python": "samples/python/caesar.py",
  "javascript": "samples/javascript/sample.js",
  "haskell": "samples/haskell/Caesar.hs",
  "c-sharp": "samples/c-sharp/Caesar.cs"
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any



test("tokenizer works for all listed languages", async t => {
  for (const language of CodeTokenizer.supportedLanguages) {
    const tokenizer =  new CodeTokenizer(language);
    t.truthy(tokenizer);

    const sampleFile:  string | undefined = languageFiles[language];

    if (sampleFile === undefined) {
      t.fail("we should have a sample file for each supported language " +
        `(${language} has none)`);
    } else {
      const file = await File.alone(sampleFile);
      const tokens = await tokenizer.tokenizeFile(file);
      t.truthy(tokens);
      t.snapshot(tokens, "stable tokens");
    }
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
  const file = await File.alone("samples/js/sample.js");

  const [tokenized, mapping] =
    (await tokenizer.tokenizeFileWithMapping(file)).ok();

  t.snapshot(tokenized);
  t.snapshot(mapping);
});
