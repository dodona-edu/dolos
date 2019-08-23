import { Command } from "commander";
import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison, ComparisonFilterOptions } from "./lib/comparison";
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
    "The -M option sets how many percent of the files the code fragment may appear before it is ignored. A fragment of " +
      "code that appears in many programs is probably legitimate sharing and not the result of plagiarism. With -M N " +
      "any fragment appearing in more than N percent of the files is filtered out. " +
      "Must be a value between 0 and 1.",
    0.9,
  )
  .option("-c, --comment <string>", "Comment string that is attached to the generated report")
  .option(
    "-n, --fragment-output-limit",
    "Specifies how many matching fragment are shown in the result. All fragment are " +
      "shown then this option isn't used.",
  )
  .option(
    "-s, --minimum-lines-shortest <integer>",
    "The minimum amount of lines in the shortest code fragment in a comparison before it is shown",
    1,
  )
  .option(
    "-S, --minimum-lines-longest <integer>",
    "The minimum amount of lines in the longest code fragment in a comparison before it is shown",
    1,
  )
  .option(
    "-g, --maximum-gap-size <integer>",
    "If two fragment need to be joined, then this parameter specifies how large the gap between the two fragment may" +
      "be.",
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
  const comparisonFragmentFilterOptions: ComparisonFilterOptions = {
    filterFragmentByPercentage: program.maximumFragmentCount === undefined,
    maxFragment:
      program.maximumFragmentCount === undefined
        ? program.maximumFragmentPercentage
        : program.maximumFragmentCount,
  };

  // Compare all the file with each other.
  const comparison = new Comparison({
    tokenizer,
    filterOptions: comparisonFragmentFilterOptions,
  });

  // Compare the base file with all the other files when there is a base file.
  if (program.base) {
    comparison.addFileToFilterList(program.base);
  }

  await comparison.addFiles(locations);
  const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles(locations);

  const filterOptions: FilterOptions = {
    minimumLinesInLargestFragment: program.minimumLinesLongest,
    minimumLinesInSmallestFragment: program.minimumLinesShortest,
    fragmentOutputLimit: program.fragmentOutputLimit,
  };

  const summary = new Summary(matchesPerFile, program.MaximumGapSize, filterOptions);
  console.log(summary.toString(program.comment));
})();
