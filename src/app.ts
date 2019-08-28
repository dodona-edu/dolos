import { Command } from "commander";
import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";
import { Matches } from "./lib/comparison.js";
import { FilterOptions, Summary } from "./lib/summary.js";

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
    "-m, --maximum-fragment-count <number>",
    "The -m option sets the maximum number of times a given fragment may appear before it is ignored. A code fragment" +
      "that appears in many programs is probably legitimate sharing and not the result of plagiarism. With -m N " +
      "any fragment appearing in more than N program is filtered out. This option has precedence over the -M option, " +
      "which is set to 0.9 by default.",
  )
  .option(
    "-M --maximum-fragment-percentage <float>",
    "The -M option sets how many percent of the files the code fragment may appear before it is ignored. A fragment " +
      "of code that appears in many programs is probably legitimate sharing and not the result of plagiarism. With " +
      "-M N any fragment appearing in more than N percent of the files is filtered out. " +
      "Must be a value between 0 and 1.",
    0.9,
  )
  .option("-c, --comment <string>", "Comment string that is attached to the generated report")
  .option(
    "-n, --file-pair-output-limit",
    "Specifies how many matching file pairs are shown in the result. All pairs are " +
      "shown then this option is omitted.",
  )
  .option(
    "-s, --minimum-fragment-length <integer>",
    "The minimum length of a fragment. Every fragment shorter than this is filtered  out.",
    1,
  )
  .option(
    "-g, --maximum-gap-size <integer>",
    "If two fragments are close to each other, they will be merged into a single fragment if the gap between them is " +
      "smaller than the given number of lines." +
      0,
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
  const tokenizer = new CodeTokenizer(program.language);

  if (locations.length < 2) {
    console.error("Need at least two locations");
    program.outputHelp();
    process.exit(1);
  }

  // Compare all the file with each other.
  const comparison = new Comparison(tokenizer, {
    filterFragmentByPercentage: program.maximumFragmentCount === undefined,
    maxFragment:
      program.maximumFragmentCount === undefined
        ? program.maximumFragmentPercentage
        : program.maximumFragmentCount,
  });

  // Compare the base file with all the other files when there is a base file.
  if (program.base) {
    comparison.addFileToFilterList(program.base);
  }

  await comparison.addFiles(locations);
  const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles(locations);

  const filterOptions: FilterOptions = {
    fragmentOutputLimit: program.filePairOutputLimit,
    minimumFragmentLength: program.minimumFragmentLength,
  };

  const summary = new Summary(matchesPerFile, program.MaximumGapSize, filterOptions);
  console.log(summary.toString(program.comment));
})();
