import test from "ava";
import { CodeTokenizer } from "../lib/tokenizers/codeTokenizer";

test("tokenizer creation works for all supported languages", t => {
  for (const language of CodeTokenizer.supportedLanguages) {
    const tokenizer = new CodeTokenizer(language);
    t.false(tokenizer === undefined || tokenizer === null);
  }
});
