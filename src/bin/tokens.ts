import File from "../lib/files/file";
import { CodeTokenizer } from "../lib/tokenizers/codeTokenizer";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  let resultString = "";
  const file = await File.alone("samples/js/sample.js");
  for await (const { token } of tokenizer.generateTokensFromFile(file)) {
    resultString += token;
  }
  console.log(resultString);
})();
