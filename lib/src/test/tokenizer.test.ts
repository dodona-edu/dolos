import test from "ava";
import { File } from "@dodona/dolos-core";
import { LanguagePicker } from "../lib/language.js";
import { readPath } from "../lib/reader.js";

const languageFiles = {
  "bash": "../samples/bash/caesar.sh",
  "c": "../samples/c/caesar.c",
  "c-sharp": "../samples/c-sharp/Caesar.cs",
  "char": "../samples/char/caesar.txt",
  "cpp": "../samples/cpp/caesar.cpp",
  "elm": "../samples/elm/Caesar.elm",
  "java": "../samples/java/Caesar.java",
  "javascript": "../samples/javascript/sample.js",
  "python": "../samples/python/caesar.py",
  "php": "../samples/php/caesar.php",
  "tsx": "../samples/tsx/sample.tsx",
  "typescript": "../samples/typescript/caesar.ts",
} as {[key: string]: string};

for (const [languageName, languageFile] of Object.entries(languageFiles)) {
  test(`LanguagePicker can find ${languageName} correctly by name`, async t => {
    const language = await new LanguagePicker().findLanguage(languageName);
    t.truthy(language, `language detection failed for name: '${languageName}'`);
    t.deepEqual(language.name, languageName);
  });

  test(`LanguagePicker can detect ${languageName} correctly by extension`, async t => {
    const file = (await readPath(languageFile)).ok();
    const language = new LanguagePicker().detectLanguage([file]);
    t.truthy(language, `language detection failed for name: '${languageName}'`);
    t.deepEqual(language.name, languageName);
  });


  test(`tokenizer works for ${languageName}`, async t => {
    const file = (await readPath(languageFile)).ok();
    const language = new LanguagePicker().detectLanguage([file]);

    const tokenizer = await language.createTokenizer();
    t.truthy(tokenizer);

    const { tokens } = tokenizer.tokenizeFile(file);
    t.truthy(tokens);
    t.snapshot(tokens, "stable tokenization");
  });
}

test("language picker should trow an error for non-existing language", async t => {
  await t.throwsAsync(() => new LanguagePicker().findLanguage("non-existing-language"));
});

test("language picker should throw an error for unknown extension", t => {
  t.throws(() => new LanguagePicker().detectLanguage([new File("unknown.extension", "")]));
});

test("language picker should detect most common language", t => {
  const files = [new File("file.py", ""), new File("otherfile.py", ""), new File("file.js", "")];
  const detected = new LanguagePicker().detectLanguage(files);
  t.deepEqual(detected.name, "python");
});
