import { Tokenizer } from "../lib/tokenizer";

(async () => {
  const tokenizer = new Tokenizer("javascript");
  let resultString = "";
  for await (const [token] of tokenizer.generateTokensFromFile("samples/js/sample.js")) {
    resultString += token;
  }
  console.log(resultString);
})();
