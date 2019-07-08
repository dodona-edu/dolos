import { Tokenizer } from "../tokenizer";

test("tokenizer creation works for all listed languages", () => {
  for (const language of Tokenizer.supportedLanguages) {
    expect(() => new Tokenizer(language)).not.toThrow();
  }
});

test("tokenizer creation throws error for unsupported language", () => {
  expect(() => new Tokenizer("some string")).toThrow();
});
