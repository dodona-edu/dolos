#!/usr/bin/env node
import { CodeTokenizer } from "../lib/codeTokenizer";
import { File } from "../lib/file";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  const stdin = (await File.fromPath("/dev/stdin")).ok();
  for (const { token } of tokenizer.generateTokens(stdin.content)) {
    process.stdout.write(token);
  }
})();
