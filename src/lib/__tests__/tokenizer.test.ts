import { Tokenizer } from "../tokenizer";

test("tokenizer creation works for all listed languages", () => {
  for (const language of Tokenizer.supportedLanguages) {
    expect(() => new Tokenizer(language)).not.toThrow();
  }
});

test("tokenizer creation throws error for unsupported language", () => {
  expect(() => new Tokenizer("some string")).toThrow();
});

test("tokenizer with or without location is equal", async () => {
  const tokenizer = new Tokenizer("javascript");
  const file = __filename;

  let tokenized = "";
  for await (const [character] of tokenizer.mappedTokenize(file)) {
    tokenized += character;
  }

  expect(tokenized).toEqual(await tokenizer.tokenize(file));
});
