import { CodeTokenizer } from "../lib/codeTokenizer";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  let resultString = "";
  for await (const { token } of tokenizer.generateTokensFromFile("samples/js/sample.js")) {
    resultString += token;
  }
  console.log(resultString);
})();
