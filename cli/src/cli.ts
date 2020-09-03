#!/usr/bin/env node
import * as Utils from "./lib/util/utils";
import { Command } from "commander";
import { Dolos } from "./dolos";
import { Options } from "./lib/util/options";
import { TerminalPresenter } from "./lib/presenter/terminalPresenter";
import { closestMatch, error, setLogging, warning } from "./lib/util/utils";
import { WebPresenter } from "./lib/presenter/webPresenter";
import { CsvPresenter } from "./lib/presenter/csvPresenter";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json");
const program = new Command();


program.version(pkg.version, "-v --version", "Output the current version.")
  .description("Plagiarism detection for programming exercises");

program
  .option(
    "-V, --verbose",
    Utils.indent("Enable verbose logging."),
    false
  )
  .option(
    "-l, --language <language>",
    Utils.indent(
      "Programming language used in the submitted files.",
      Options.defaultLanguage
    ),
    Options.defaultLanguage
  )
  .option(
    "-m, --maximum-hashing-count <integer>",
    Utils.indent(
      "The -m option sets the maximum number of times a given hash may " +
      "appear before it is ignored. A code fragment that appears in many " +
      "programs is probably legitimate sharing and not the result of " +
      "plagiarism. With -m N any hashing appearing in more than N programs is " +
      "filtered out. This option has precedence over the -M option, " +
      "which is set to 0.9 by default."
    ),
    x => parseFloat(x)
  )
  .option(
    "-M --maximum-hashing-percentage <fraction>",
    Utils.indent(
      "The -M option sets how many percent of the files the hash may appear " +
      "before it is ignored. A hash that appears in many programs is " +
      "probably legitimate hash and not the result of plagiarism. With -M " +
      "N any hashing appearing in more than N percent of the files is filtered " +
      "out. Must be a value between 0 and 1. This option is ignored when " +
      "comparing only two files, because each match appear in 100% of the " +
      "files",
    ),
    x => parseFloat(x),
  )
  .option(
    "-L, --limit <integer>",
    Utils.indent(
      "Specifies how many matching file pairs are shown in the result. " +
      "All pairs are shown when this option is omitted."
    ),
    x => parseFloat(x)
  )
  .option(
    "-s, --minimum-block-length <integer>",
    Utils.indent(
      "The minimum amount of paired occurrences (=matches) that are contained within this block. " +
        "Every block shorter than this is filtered out."
    ),
    x => parseFloat(x),
    Options.defaultMinBlockLength
  )
  .option(
    "-c --compare",
    Utils.indent(
      "Print a comparison of the matching blocks even if analysing more than two " +
      "files. Only valid when the output is set to 'terminal'."
    )
  )
  .option(
    "-S, --minimum-similarity <fraction>",
    Utils.indent(
      "The minimum similarity between two files. " +
      "Must be a value between 0 and 1",
      Options.defaultMinSimilarity,
    ),
    x => parseFloat(x),
  )
  .option(
    "-f, --output-format <format>",
    Utils.indent(
      "Specifies what format the output should be in, current options are: " +
      "terminal/console, csv, html/web.", "terminal"
    ),
    "terminal"
  )
  .option(
    "--sort <field>",
    Utils.indent(
      "Which field to sort the results by. Options are: similarity, continuous and total", "total"
    ),
    "total"
  )
  .option(
    "-k, --kmer-length <integer>",
    Utils.indent("The length of each k-mer fragment.", Options.defaultKmerLength),
    x => parseFloat(x),
    Options.defaultKmerLength
  )
  .option(
    "-w, --kmers-in-window <integer>",
    Utils.indent(
      "The size of the window that will be used (in kmers).",
      Options.defaultKmerLength
    ),
    x => parseFloat(x),
    Options.defaultKmerLength
  )
  .arguments("<locations...>")
  .action(async locations => {
    if(program.verbose){
      setLogging("info");
    }

    if (locations.length < 3 && program.maximumHashPercentage) {
      warning("You have given a maximum hash percentage (with -M), but " +
        "you are comparing less than three files so matching hash will occur " +
        "in 100% of the files. You might not want to use this option.");
    }

    try {
      const dolos = new Dolos({
        kmerLength: program.kmerLength,
        kmersInWindow: program.kmersInWindow,
        language: program.language,
        maxHashCount: program.maximumHashCount,
        maxHashPercentage: program.maxHashPercentage,
        minBlockLength: program.minimumBlockLength,
        minSimilarity: program.minimumSimilarity,
        limitResults: program.limit,
        sortBy: program.sort,
      });
      const report = await dolos.analyzePaths(locations);

      const presenter = closestMatch(program.outputFormat, {
        "terminal": () => new TerminalPresenter(report, dolos.options, program.compare),
        "console" : () => new TerminalPresenter(report, dolos.options, program.compare),
        "csv" : () => new CsvPresenter(report, dolos.options),
        "html": () => new WebPresenter(report, dolos.options),
        "web": () => new WebPresenter(report, dolos.options),
      });

      if(presenter == null) {
        throw new Error(`Invalid output format: ${program.format}`);
      }

      await presenter().present();
    } catch (err) {
      error(err.stack);
      process.exit(1);
    }
  })
  .parse(process.argv);
