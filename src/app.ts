#!/usr/bin/env node
import { Command } from "commander";
import { Comparison } from "./lib/comparison";
import { Matches } from "./lib/comparison.js";
import { FilterOptions, Summary } from "./lib/summary.js";
import { CodeTokenizer } from "./lib/tokenizers/codeTokenizer";
import * as Utils from "./lib/utils";

const indentLength: number = 43;
const maxLineLength: number = (process.stdout.columns as number) - indentLength;
const program = new Command();
let locations: string[] = [];

function indentHelp(helpText: string): string {
  const lines: string[] = [];
  let currentLine: string = "";
  for (const word of helpText.split(" ")) {
    if (currentLine.length + word.length < maxLineLength) {
      if (currentLine.length === 0) {
        currentLine = word;
      } else {
        currentLine += " " + word;
      }
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  return lines.join("\n".padEnd(indentLength, " "));
}

// Initial program description and version
program.version("0.0.1").description("Plagiarism detection for programming exercises");

// TODO propper indentation with nodejs tty writeStream.columns
program
  .option(
    "-l, --language <language>",
    indentHelp("Programming language used in the submitted files."),
    "javascript",
  )
  .option(
    "-b, --base <base>",
  indentHelp(
    "Specifies a base file. Matches with code from this file will never be reported in the output. A typical base " +
      "file is the supplied code for an exercise. When this option is used in conjunction with the -d flag then the " +
      "location given is interpreted as a directory and all files that are a child of that directory will" +
      "be used as a base file. When this is the case an path to the directory is need from the current working " +
      "directory. The name of the directory won't be enough.",
  ))
  .option("-d, --directory", "Specifies that submission are per directory, not by file. ")
  .option(
    "-m, --maximum-hash-count <integer>",
    indentHelp("The -m option sets the maximum number of times a given hash may appear before it is ignored. A code fragment" +
      "that appears in many programs is probably legitimate sharing and not the result of plagiarism. With -m N " +
      "any hash appearing in more than N program is filtered out. This option has precedence over the -M option, " +
      "which is set to 0.9 by default."),
    x => parseInt(x, 10),
  )
  .option(
    "-M --maximum-hash-percentage <float>",
    indentHelp("The -M option sets how many percent of the files the hash may appear before it is ignored. A hash " +
      "that appears in many programs is probably legitimate sharing and not the result of plagiarism. With " +
      "-M N any hash appearing in more than N percent of the files is filtered out. " +
      "Must be a value between 0 and 1."),
    x => parseFloat(x),
    0.9,
  )
  .option("-c, --comment <string>", indentHelp("Comment string that is attached to the generated report"))
  .option(
    "-n, --file-pair-output-limit",
    indentHelp(
      "Specifies how many matching file pairs are shown in the result. All pairs are " +
        "shown then this option is omitted.",
    ),
  )
  .option(
    "-s, --minimum-fragment-length <integer>",
    indentHelp("The minimum length of a fragment. Every fragment shorter than this is filtered  out."),
    x => parseInt(x, 10),
    2,
  )
  .option(
    "-g, --maximum-gap-size <integer>",
    indentHelp("If two fragments are close to each other, they will be merged into a single fragment if the gap between them is " +
      "smaller than the given number of lines."),
    x => parseInt(x, 10),
    0,
  )
  .option(
    "-o, --output-format <format>",
    indentHelp("Specifies what format the output should be, current options are: terminal/console, json, html."),
    "terminal",
  )
  .option(
    "-v, --cluster-cut-off-value <integer>",
    indentHelp("The minimum amount of lines needed before two files will be clustered together"),
    x => parseInt(x, 10),
    13,
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
    console.error(Utils.colour("FgRed", "Need at least two locations"));
    program.outputHelp(helpText => {
      console.error(helpText);
      return "";
    });
    process.exit(1);
  }

  // Compare all the file with each other.
  const comparison = new Comparison(tokenizer, {
    filterHashByPercentage: program.maximumHashCount === undefined,
    maxHash: program.maximumHashCount || program.maximumHashPercentage,
  });

  // Compare the base file with all the other files when there is a base file.
  if (program.base) {
    if (program.directory) {
      let index = locations.length - 1;
      while (index > 0) {
        if (locations[index].startsWith(program.base)) {
          await comparison.addFileToFilterList(locations[index]);
          locations.splice(index, 1);
        }
        index -= 1;
      }
    } else {
      await comparison.addFileToFilterList(program.base);
    }
  }

  await comparison.addFiles(locations);
  const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles(
    locations,
    undefined,
    program.directory !== undefined,
  );

  const filterOptions: FilterOptions = {
    fragmentOutputLimit: program.filePairOutputLimit,
    minimumFragmentLength: program.minimumFragmentLength,
  };

  // @ts-ignore
  const optionsArray: Array<[string, string | number]> = [
    ["-l", program.language],
    ["-b", program.base],
    ["-m", program.maximumHashCount],
    ["-M", program.maximumHashPercentage],
    ["-c", program.comment],
    ["-n", program.filePairOutputLimit],
    ["-s", program.minimumFragmentLength],
    ["-g", program.maximumGapSize],
    ["-o", program.outputFormat],
    ["-v", program.clusterCutOffValue],
  ].filter(([, optionValue]) => optionValue !== undefined);

  for (const [flag, value] of optionsArray.values()) {
    if (typeof value === "number" && isNaN(value)) {
      console.error(Utils.colour("FgRed", `${flag} must have a valid numeric value\n`));
      program.outputHelp(helpText => {
        console.error(helpText);
        return "";
      });
      process.exit(2);
    }
  }

  const summary = new Summary(
    matchesPerFile,
    program.maximumGapSize,
    filterOptions,
    program.clusterCutOffValue,
  );
  let outputString: string = "";
  switch (program.outputFormat.toLowerCase()) {
    case "terminal":
    case "console":
      outputString = summary.toString(program.comment, true, optionsArray);
      break;
    case "json":
      outputString = summary.toJSON(program.comment, optionsArray);
      break;
    case "html":
      outputString = summary.toHTML(program.comment, optionsArray);
      break;
    default:
      console.error("Output format not recognized");
      process.exit(3);
  }
  console.log(outputString);
})();
