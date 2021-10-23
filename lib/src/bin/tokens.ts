#!/usr/bin/env node
import { CodeTokenizerTreeSitter } from "../lib/tokenizer/codeTokenizerTreeSitter";
import { File } from "../lib/file/file";

(async () => {
  const tokenizer = new CodeTokenizerTreeSitter("javascript");
  const stdin = (await File.fromPath("/dev/stdin")).ok();
  for (const { token } of tokenizer.generateTokens(tokenizer.toTokenizableFile(stdin))) {
    process.stdout.write(token);
  }
})();
