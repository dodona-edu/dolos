import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  const comparison = new Comparison(tokenizer);
  await comparison.addFiles(["samples/js/samples.js", "samples/js/sample.js"]);
  const result = await comparison.compareFile("samples/js/copied_function.js");
  console.log(result);
})();
