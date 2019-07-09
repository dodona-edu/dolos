import { Comparison } from "./lib/comparison";
import { Tokenizer } from "./lib/tokenizer";

(async () => {
  const tokenizer = new Tokenizer("javascript");
  const comparison = new Comparison(tokenizer);
  await comparison.addFile("samples/js/sample.js");
  const result = await comparison.compare("samples/js/copied_function.js");
  console.log(result);
})();
