import { Command } from "commander";
import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";
import { Matches } from "./lib/comparison.js";
import { Summary } from "./lib/summary.js";
import { SummaryFilter } from "./lib/summaryFilter.js";

let locations: string[] = [];
const program = new Command();

// Initial program description and version
program.version("0.0.1").description("Plagiarism detection for programming exercises");

program
  .option(
    "-l, --language <language>",
    "Programming language used in the submitted files.",
    "javascript",
  )
  .option(
    "-b, --base <base>",
    "Specifies a base file. Matches with code from this file will never be reported in the output. A typical base " +
      "file is the supplied code for an exercise.",
  )
  .option(
    "-m, --maximum <number>",
    "The -m options sets the maximum number of time a given passage may appear before it is ignored. A passage of " +
      "code that appears in many programs is probably legitimate sharing and not the result of plagiarism. With -m N " +
      "any passage appearing in more that N program is filtered out. Using this option will overwrite the -M option.",
  )
  .option(
    "-M --maximum-percentage <float>",
    "Maximum percentage a passage may appear before it is ignored. The percentage is calculated using the amount of " +
      "different groups there are. So with the -d options the amount of directories is used where normally the " +
      "amount of files is used. Must be a value between 1 and 0.",
    0.9,
  )
  .option("-c, --comment <string>", "Comment string that is attached to the generated report")
  .option("-n, --file-amount", "Specifies how many matching pairs are shown in the result")
  .option(
    "-s, --minimum-lines <integer>",
    "The minimum amount of lines in the longest code passage in a before it is shown",
    0,
  )
  .option(
    "-g, --maximum-gap-size <integer>",
    "If two passages need to be joined, then this parameter specifies how large the gap between the two passages may" +
      "be.",
    0,
  )
  .option(
    "-z, --zero-based-lines",
    "Specifies whether or not you want lines to be zero based",
    false,
  )
  .arguments("<locations...>")
  .action(filesArgs => {
    locations = filesArgs;
  });

program.on("--help", () => {
  console.log(`
Examples:
Gives dolos all the files in the current directory and tells dolos that they are in javascript
  $ dolos -l javascript *.js

Specifies the gap size.
  $ dolos *.js -g 0");
  [[[0, 2], [9, 11]], [[4, 5], [13, 14]]]");
  $ dolos *.js -g 1");
  [[[0, 5], [9, 14]]]");
    `);
});

program.parse(process.argv);

(async () => {
  let groupAmount: number;
  const tokenizer = new CodeTokenizer(program.language);

  if (locations.length < 2) {
    console.error("Need at least two locations");
    program.outputHelp();
    process.exit(1);
  }

  // If each file is a separate program then count the amount of files.
  groupAmount = locations.length;

  // Compare all the file with each other.
  const comparison = new Comparison(tokenizer);

  // Compare the base file with all the other files when there is a base file.
  if (program.base) {
    comparison.addFileToFilterList(program.base);
  }

  await comparison.addFiles(locations);
  const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles(locations);

  const summaryFilter: SummaryFilter = new SummaryFilter(
    0,
    program.minimumLines,
    program.maximum || program.maximumPercentage,
    program.maximum === undefined ? groupAmount : undefined,
  );

  const summary = new Summary(
    matchesPerFile,
    summaryFilter,
    program.MaximumGapSize,
    program.comment,
    program.fileAmount,
  );
  console.log(summary.toString(program.zeroBasedLines));
})();
