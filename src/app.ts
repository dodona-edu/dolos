import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";
import { Summary } from "./lib/Summary";
import fs from 'fs';

(async () => {
  const tokenizer = new CodeTokenizer("python");
  const comparison = new Comparison(tokenizer);
  let path = 'samples/python/snowball-numbers/';
  
  let files = fs.readdirSync(path);
  await comparison.addFiles([path + files[0], path + files[1]]);

  let arr = [];
  for (const key of Array(5).keys()) {
    arr.push(path + files[key + 2]);
  }
  console.log(arr);
  const result = await comparison.compareFiles(arr);

  // await comparison.addFiles(["samples/js/samples.js", "samples/js/sample.js"]);
  // const result = await comparison.compareFiles(["samples/js/another_copied_function.js", "samples/js/copied_function.js" ]);
  const summary = new Summary(result);
  summary.printSummary();
})();
