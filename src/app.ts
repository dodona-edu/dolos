import { Comparison } from "./lib/comparison";
import { Tokenizer } from "./lib/tokenizer";

(async () => {
  const tokenizer = new Tokenizer("javascript");
  const comparison = new Comparison(tokenizer);
  await comparison.addFiles(["samples/js/samples.js", "samples/js/sample.js"]);
  const result = await comparison.compareFile("samples/js/copied_function.js");
  console.log(result);
})();
