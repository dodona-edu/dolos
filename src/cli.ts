#!/usr/bin/env node
import { Command } from "commander";
import { Dolos } from "./dolos";
import { Options } from "./lib/options";
import * as Utils from "./lib/utils";

// tslint:disable-next-line: no-var-requires
const pkg = require("../package.json");
const program = new Command();

const indentLength: number = 42;
const maxLineLength: number = (process.stdout.columns as number) - indentLength;
const defaultLength: number = 12; // " (default: )"

/**
 * Indent the lines of helpText with an indent size of indentLength. Every line will be at most maxLineLength.
 * All the lines (except the first one) will be indented with indentLength, which is the same indent size used by commander.js.
 * If a default value is present, it's length will be accounted for at the end of the helpText.
 * @param helpText the text to be indented
 * @param defaultValue the default value used, will be appended as "(default: [value])" by commander.js after the helpText
 */
function indent(helpText: string, defaultValue: any = undefined): string {
  const lines: string[] = [];
  let currentLine: string = "";
  for (const word of helpText.split(" ")) {
    if (currentLine.length + word.length < maxLineLength - 10) {
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
  if(defaultValue !== undefined){
    const defaultValueLength: number = typeof defaultValue === 'string'? defaultValue.toString().length + 2 : defaultValue.toString().length;
    if((currentLine.length + defaultLength + defaultValueLength) >= maxLineLength -1){
      currentLine += "\n".padEnd(indentLength - 1, " ");
    }
  }
  lines.push(currentLine);

  return lines.join("\n".padEnd(indentLength, " "));
}

program.version(pkg.version)
       .description("Plagiarism detection for programming exercises");

program
  .option(
    "-l, --language <language>",
    indent("Programming language used in the submitted files.", Options.defaultLanguage),
    Options.defaultLanguage,
  )
  .option(
    "-b, --base <base>",
  indent(
    "Specifies a base file. Matches with code from this file will never be reported in the output. A typical base " +
      "file is the supplied code for an exercise. When this option is used in conjunction with the -d flag then the " +
      "location given is interpreted as a directory and all files that are a child of that directory will" +
      "be used as a base file. When this is the case, a path to the directory is needed from the current working " +
      "directory. The name of the directory won't be enough.",
  ))
  .option("-d, --directory", indent("Specifies that submision are per directory, not by file. "))
  .option(
    "-m, --maximum-hash-count <integer>",
    indent("The -m option sets the maximum number of times a given hash may appear before it is ignored. A code fragment" +
      "that appears in many programs is probably legitimate sharing and not the result of plagiarism. With -m N " +
      "any hash appearing in more than N programs is filtered out. This option has precedence over the -M option, " +
      "which is set to 0.9 by default."),
    x => parseInt(x, 10),
  )
  .option(
    "-M --maximum-hash-percentage <float>",
    indent("The -M option sets how many percent of the files the hash may appear before it is ignored. A hash " +
      "that appears in many programs is probably legitimate sharing and not the result of plagiarism. With " +
      "-M N any hash appearing in more than N percent of the files is filtered out. " +
      "Must be a value between 0 and 1.", Options.defaultMaxHashPercentage),
    x => parseFloat(x),
    Options.defaultMaxHashPercentage,
  )
  .option("-c, --comment <string>", indent("Comment string that is attached to the generated report"))
  .option(
    "-n, --file-pair-output-limit",
    indent(
      "Specifies how many matching file pairs are shown in the result. All pairs are " +
        "shown when this option is omitted.",
    ),
  )
  .option(
    "-s, --minimum-fragment-length <integer>",
    indent("The minimum length of a fragment. Every fragment shorter than this is filtered out.", Options.defaultMinFragmentLength),
    x => parseInt(x, 10),
    Options.defaultMinFragmentLength,
  )
  .option(
    "-g, --maximum-gap-size <integer>",
    indent("If two fragments are close to each other, they will be merged into a single fragment if the gap between them is " +
      "smaller than the given number of lines.", Options.defaultMaxGapSize),
    x => parseInt(x, 10),
    Options.defaultMaxGapSize,
  )
  .option(
    "-o, --output-format <format>",
    indent("Specifies what format the output should be in, current options are: terminal/console, json, html.", "terminal"),
    "terminal",
  )
  .option(
    "-v, --cluster-cut-off-value <integer>",
    indent("The minimum amount of lines needed before two files will be clustered together", Options.defaultClusterMinMatches),
    x => parseInt(x, 10),
    Options.defaultClusterMinMatches,
  )
  .option(
    "-k, --kmer-length <integer>",
    indent("The length of each k-mer fragment.", Options.defaultKmerLength),
    x => parseInt(x, 10),
    Options.defaultKmerLength,
  )
  .option(
    "-w, --kmers-in-window <integer>",
    indent("The size of the window that will be used (in kmers).", Options.defaultKmerLength),
    x => parseInt(x, 10),
    Options.defaultKmerLength,
  )
  .arguments("<locations...>")
  .action(async locations => {
    try {
      const dolos = new Dolos({
        base: program.base,
        clusterMinMatches: program.clusterCutOffValue,
        comment: program.comment,
        directory: program.directory,
        kmerLength: program.kmerLength,
        kmersInWindow: program.kmersInWindow,
        language: program.language,
        maxGapSize: program.maxGapSize,
        maxHashCount: program.maximumHashCount,
        maxHashPercent: program.maximumHashPercentage,
        maxMatches: program.filePairOutputLimit,
        minFragmentLength: program.minimumFragmentLength,
      });
      const matches = await dolos.analyze(locations);
      const output = dolos.output(matches, program.outputFormat);
      console.log(output);
    } catch (error) {
      console.error(Utils.colour("red", error.message));
      program.outputHelp(helpText => {
        console.error(helpText);
        return "";
      });
      process.exit(1);
    }
  })
  .parse(process.argv);
