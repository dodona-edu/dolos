import * as util from "util";
import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";

util.inspect.defaultOptions.depth = null;

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  const comparison = new Comparison(tokenizer);
  await comparison.addFiles(["samples/javascript/sample.js"]);
  const result = await comparison.compareFile("samples/javascript/copied_function.js");
  console.dir(result);
})();
