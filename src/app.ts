import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";
import { Summary } from "./lib/summary";
import { SummaryFilter } from "./lib/summaryFilter";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  const comparison = new Comparison(tokenizer);

  await comparison.addFiles(["samples/js/another_copied_function.js"]);
  const result = await comparison.compareFiles([
    "samples/js/sample.js",
    "samples/js/copied_function.js",
  ]);
  const summaryFilter = new SummaryFilter(1, 1);
  const summary = new Summary(result, summaryFilter);
  console.log(summary.toString());
})();
