import commander from "commander";
import { Matches } from "./lib/comparison.js"
// import fs from "fs";

import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";
import { Summary } from "./lib/summary.js";
// import { Visualize } from "./lib/visualize";
// import { stringLiteral } from "@babel/types";

const packageJson = require("../package.json");

const program = new commander.Command();

// Initial program description and version
program.version(packageJson.version).description("Plagiarism detection for programming exercises");


let locations: Array<string> = [];

program
  .option("-l, --language <language>", "language used in the compared programs", "javascript")
  .option("-d, --directory", "specifies that submission are per directory, not by file")
  .option(
    "-b, --base <base>",
    `this option specifies a base file, any code that also appears in the base file is not shown. A typical base file 
     is the supplied code for an exercise`,
  )
  .option(
    "-m, --maximum <number>",
    "maximum number of times a given passage may appear before it is ignored",
    10,
  )
  .option("-c, --comment <string>", "comment string that is attached to the generated report")
  .option("-n, --minimum-lines <integer>", "the minimum amount of lines in a range before it is shown", 2)
  .option(
    "-g, --maximum-gap-size <integer>",
    "the maximum allowed amount of lines between two ranges that are not part of the ranges them selves",
    0,
  )
  .arguments("<locations...>")
  .action((filesArgs) => {
    locations = filesArgs;
  })

// TODO examples
program.on("--help", () => {
  console.log("");
  console.log("Examples:");
  console.log(
    "  $ dolos -l javascript *.js",
    "gives dolos all the files in the current directory and tells that tells dolos that they are in javascript",
  );
  console.log("  $ dolos *.js -g 0");
  console.log("  [[[0, 2], [9, 11]], [[4, 5], [13, 14]]]");
  console.log("  $ dolos *.js -g 1");
  console.log("  [[[0, 5], [9, 14]]]");
});

program.parse(process.argv);

(async () => {
    if(locations.length < 2){
        console.error('need at least two locations');
        process.exit(1);
    } 
    const tokenizer = new CodeTokenizer(program.language);

    let results: Map<string, Matches<number>> = new Map();
    while(locations.length > 1){
      const location: string = locations.shift() as string; //will not be undefined
      const comparison = new Comparison(tokenizer);
      await comparison.addFile(location);
      const result = await comparison.compareFiles(locations);
      const summary = new Summary(result, program.minimumLines, program.gapSize);
      console.log(summary.toString());
      results = new Map([...results, ...result]);
    }

})();
// sourceFile: "samples/js/copied_function.js", result visualizer.getSourceFile()
