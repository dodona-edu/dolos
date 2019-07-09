import { Tokenizer } from "../tokenizer";

test("tokenizer creation works for all listed languages", () => {
  for (const language of Tokenizer.supportedLanguages) {
    expect(() => new Tokenizer(language)).not.toThrow();
  }
});

test("tokenizer creation throws error for unsupported language", () => {
  expect(() => new Tokenizer("some string")).toThrow();
});

test("registering a new installed language works", () => {
  expect(() => Tokenizer.registerLanguage("python")).not.toThrow();
});

test("registering a new invalid language throws error", () => {
  expect(() => Tokenizer.registerLanguage("some string")).toThrow();
});

test("tokenizer with or without location is equal", async () => {
  const tokenizer = new Tokenizer("javascript");
  const file = __filename;

  let tokenized = "";
  for await (const [character] of tokenizer.mappedTokenizeFile(file)) {
    tokenized += character;
  }

  expect(tokenized).toEqual(await tokenizer.tokenizeFile(file));
});
