#!/usr/bin/env node
import { CodeTokenizer } from "../lib/tokenizer/codeTokenizer";
import { File } from "../lib/file/file";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  const stdin = (await File.fromPath("/dev/stdin")).ok();
  for (const { token } of tokenizer.generateTokens(stdin.content)) {
    process.stdout.write(token);
  }
})();
