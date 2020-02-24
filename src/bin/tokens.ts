#!/usr/bin/env node
import { CodeTokenizer } from "../lib/codeTokenizer";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  for await (const { token } of tokenizer.generateTokensFromFile("/dev/stdin")) {
    process.stdout.write(token);
  }
})();
