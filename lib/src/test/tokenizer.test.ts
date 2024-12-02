import test from "ava";
import { File, Region } from "@dodona/dolos-core";
import { LanguagePicker } from "../lib/language.js";
import { readPath } from "../lib/reader.js";

const languageFiles = {
  "bash": "../samples/bash/caesar.sh",
  "c": "../samples/c/caesar.c",
  "c-sharp": "../samples/c-sharp/Caesar.cs",
  "char": "../samples/char/caesar.txt",
  "cpp": "../samples/cpp/caesar.cpp",
  "elm": "../samples/elm/Caesar.elm",
  "groovy": "../samples/groovy/caesar.groovy",
  "go": "../samples/go/Caesar.go",
  "java": "../samples/java/Caesar.java",
  "javascript": "../samples/javascript/sample.js",
  "python": "../samples/python/caesar.py",
  "php": "../samples/php/caesar.php",
  "modelica": "../samples/modelica/sample.mo",
  "ocaml": "../samples/ocaml/Caesar.ml",
  "r": "../samples/r/caesar.R",
  "rust": "../samples/rust/caesar.rs",
  "scala": "../samples/scala/Caesar.scala",
  "sql": "../samples/sql/sample.sql",
  "tsx": "../samples/tsx/sample.tsx",
  "typescript": "../samples/typescript/caesar.ts",
  "verilog": "../samples/verilog/module.v"
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

test("should be able to use external tree-sitter parsers (tree-sitter-json)", async t => {
  const file = (await readPath("./package.json")).ok();
  const language = await (new LanguagePicker().findLanguage("json"));

  const tokenizer = await language.createTokenizer();
  t.truthy(tokenizer);

  const { tokens } = tokenizer.tokenizeFile(file);
  t.truthy(tokens);
});

test("should be able to parse larger files", async t => {
  const file = new File("long.js", "var test = 1;\n".repeat(10000));
  const language = await (new LanguagePicker().findLanguage("javascript"));

  const tokenizer = await language.createTokenizer();
  t.truthy(tokenizer);

  const { tokens } = tokenizer.tokenizeFile(file);
  t.truthy(tokens);
});

test("should be able to correctly tokenize a variable", async t => {
  const file = new File("long.js", "var test = 1;");
  const language = await (new LanguagePicker().findLanguage("javascript"));
  const tokenizer = await language.createTokenizer();

  const { tokens, mapping } = tokenizer.tokenizeFile(file);
  t.is(tokens.join(""), "(program(variable_declaration(variable_declarator(identifier)(number))))");
  t.is(mapping.length, 15);
  t.deepEqual([
    new Region(0, 0, 0, 0),
    new Region(0, 0, 0, 0),
    new Region(0, 0, 0, 4),
    new Region(0, 0, 0, 4),
    new Region(0, 4, 0, 4),
    new Region(0, 4, 0, 4),
    new Region(0, 4, 0, 8),
    new Region(0, 4, 0, 8),
    new Region(0, 4, 0, 8),
    new Region(0, 11, 0, 12),
    new Region(0, 11, 0, 12),
    new Region(0, 11, 0, 12),
    new Region(0, 4, 0, 4),
    new Region(0, 0, 0, 4),
    new Region(0, 0, 0, 0)
  ], mapping);
});

test("should be able to correctly tokenize a loop", async t => {
  const file = new File("long.js", "let i = 0;\nwhile (i < 10) {\n  i += 1;\n}");
  const language = await (new LanguagePicker().findLanguage("javascript"));

  const tokenizer = await language.createTokenizer();
  const { tokens, mapping } = tokenizer.tokenizeFile(file);
  t.is(tokens.join(""), "(program(lexical_declaration(variable_declarator(identifier)(number)))" +
      "(while_statement(parenthesized_expression(binary_expression(identifier)(number)))" +
      "(statement_block(expression_statement(augmented_assignment_expression(identifier)(number))))))");
  t.is(mapping.length, 45);
  t.deepEqual( [
    new Region (0,0,0,0),
    new Region (0,0,0,0),
    new Region (0,0,0,4),
    new Region (0,0,0,4),
    new Region (0,4,0,4),
    new Region (0,4,0,4),
    new Region (0,4,0,5),
    new Region (0,4,0,5),
    new Region (0,4,0,5),
    new Region (0,8,0,9),
    new Region (0,8,0,9),
    new Region (0,8,0,9),
    new Region (0,4,0,4),
    new Region (0,0,0,4),
    new Region (1,0,1,6),
    new Region (1,0,1,6),
    new Region (1,6,1,7),
    new Region (1,6,1,7),
    new Region (1,7,1,7),
    new Region (1,7,1,7),
    new Region (1,7,1,8),
    new Region (1,7,1,8),
    new Region (1,7,1,8),
    new Region (1,11,1,13),
    new Region (1,11,1,13),
    new Region (1,11,1,13),
    new Region (1,7,1,7),
    new Region (1,6,1,7),
    new Region (1,15,2,2),
    new Region (1,15,2,2),
    new Region (2,2,2,2),
    new Region (2,2,2,2),
    new Region (2,2,2,2),
    new Region (2,2,2,2),
    new Region (2,2,2,3),
    new Region (2,2,2,3),
    new Region (2,2,2,3),
    new Region (2,7,2,8),
    new Region (2,7,2,8),
    new Region (2,7,2,8),
    new Region (2,2,2,2),
    new Region (2,2,2,2),
    new Region (1,15,2,2),
    new Region (1,0,1,6),
    new Region (0,0,0,0),
  ],mapping
  );
});


test("tokens should contain comments when includeComments is true", async t => {
  const file = new File("comments.js", "let i = 0;\nwhile (i < 10) { // comment\n  i += 1;\n}");
  const language = await (new LanguagePicker().findLanguage("javascript"));

  const tokenizer = await language.createTokenizer({ includeComments: true });
  const { tokens } = tokenizer.tokenizeFile(file);
  t.true(tokens.includes("comment"));
});
