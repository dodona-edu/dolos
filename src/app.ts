import { Tokenizer } from "./lib/tokenizer";

(async () => {
  const tokenizer = new Tokenizer("javascript");
  const ast = await tokenizer.tokenizeFile("samples/js/sample.js");
  console.log(ast);
})();
