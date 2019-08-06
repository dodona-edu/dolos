import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";
import { Summary } from "./lib/Summary";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  const comparison = new Comparison(tokenizer);
  await comparison.addFiles(["samples/js/samples.js", "samples/js/sample.js"]);
  const result = await comparison.compareFiles(["samples/js/copied_function.js", "samples/js/another_copied_function.js"]);
  // result.forEach((value, key) => {
  //   process.stdout.write(`${key} = `)
  //   console.log(value);
  // });
  const summary = new Summary(result);
  summary.printSummary();
})();
