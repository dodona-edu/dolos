#!/usr/bin/env node
import * as Utils from "./lib/util/utils";
import { Command } from "commander";
import { Dolos } from "./dolos";
import { Options } from "./lib/util/options";
import { TerminalPresenter } from "./lib/presenter/terminalPresenter";
import { closestMatch, error, setLogging, warning } from "./lib/util/utils";
import { WebPresenter } from "./lib/presenter/webPresenter";
import { CsvPresenter } from "./lib/presenter/csvPresenter";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const treeSitterPkg = require(path.dirname(require.resolve("tree-sitter")) + "/package.json");

const versions = [
  `Dolos v${pkg.version}`,
  `Node ${process.version}`,
  `Tree-sitter v${treeSitterPkg.version}`
];

const program = new Command();

program.version(versions.join("\n"), "-v --version", "Output the current version.")
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
      "Programming language used in the submitted files. Or 'chars' to do " +
      "a character by character comparison.",
      Options.defaultLanguage
    ),
    Options.defaultLanguage
  )
  .option(
    "-m, --maximum-fingerprint-count <integer>",
    Utils.indent(
      "The -m option sets the maximum number of times a given fingerprint may " +
      "appear before it is ignored. A code fragment that appears in many " +
      "programs is probably legitimate sharing and not the result of " +
      "plagiarism. With -m N any fingerprint appearing in more than N programs is " +
      "filtered out. This option has precedence over the -M option, " +
      "which is set to 0.9 by default."
    ),
    x => parseFloat(x)
  )
  .option(
    "-M --maximum-fingerprint-percentage <fraction>",
    Utils.indent(
      "The -M option sets how many percent of the files the fingerprint may appear in " +
      "before it is ignored. A fingerprint that appears in many programs is " +
      "probably a legitimate fingerprint and not the result of plagiarism. With -M " +
      "N any fingerprint appearing in more than N percent of the files is filtered " +
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
    "-s, --minimum-fragment-length <integer>",
    Utils.indent(
      "The minimum amount of kgrams a fragment should contain. Every fragment with less kgrams then the specified" +
      " amount is filtered out."
    ),
    x => parseFloat(x),
    Options.defaultMinFragmentLength
  )
  .option(
    "-c --compare",
    Utils.indent(
      "Print a comparison of the matching fragments even if analysing more than two " +
      "files. Only valid when the output is set to 'terminal' or 'console'."
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
    "-o, --output-destination <path>",
    Utils.indent(
      "Path where to write the output report to. " +
      "This has no effect when the output format is set to 'terminal'."
    )
  )
  .option(
    "--no-open",
    Utils.indent(
      "Do not open the web page in your browser once it is ready."
    ),
    false
  )
  .option(
    "--sort <field>",
    Utils.indent(
      "Which field to sort the pairs by. Options are: similarity, total overlap, and longest fragment", "total overlap"
    ),
    "total overlap"
  )
  .option(
    "-b, --fragment-sort <sort>",
    Utils.indent(
      "How to sort the fragments by the amount of matches, only applicable in terminal comparison output. The " +
        "options are: 'kgrams ascending', 'kgrams descending' and 'file order'",
      "file order"
    ),
    "file order"
  )
  .option(
    "-k, --kgram-length <integer>",
    Utils.indent("The length of each kgram fragment.", Options.defaultKgramLength),
    x => parseFloat(x),
    Options.defaultKgramLength
  )
  .option(
    "-w, --kgrams-in-window <integer>",
    Utils.indent(
      "The size of the window that will be used (in kgrams).",
      Options.defaultKgramsInWindow
    ),
    x => parseFloat(x),
    Options.defaultKgramsInWindow
  )
  .arguments("<paths...>")
  .action(async locations => {
    const options = program.opts();
    if(options.verbose){
      setLogging("info");
    }

    if (locations.length < 3 && options.maximumFingerprintPercentage) {
      warning("You have given a maximum fingerprint percentage (with -M), but " +
        "you are comparing less than three files so matching fingerprint will occur " +
        "in 100% of the files. You might not want to use this option.");
    }

    try {
      const dolos = new Dolos({
        kgramData: options.compare,
        kgramLength: options.kgramLength,
        kgramsInWindow: options.kgramsInWindow,
        language: options.language,
        maxFingerprintCount: options.maximumfingerprintCount,
        maxFingerprintPercentage: options.maxFingerprintPercentage,
        minFragmentLength: options.minimumFragmentLength,
        minSimilarity: options.minimumSimilarity,
        limitResults: options.limit,
        open: !options.noOpen,
        sortBy: options.sort,
        fragmentSortBy: options.fragmentSort,
      });
      const report = await dolos.analyzePaths(locations);

      const dest = options.outputDestination;
      const presenter = closestMatch(options.outputFormat, {
        "terminal": () => new TerminalPresenter(report, dolos.options, options.compare),
        "console" : () => new TerminalPresenter(report, dolos.options, options.compare),
        "csv" : () => new CsvPresenter(report, dolos.options, dest),
        "html": () => new WebPresenter(report, dolos.options, dest),
        "web": () => new WebPresenter(report, dolos.options, dest),
      });

      if(presenter == null) {
        throw new Error(`Invalid output format: ${options.format}`);
      }

      await presenter().present();
    } catch (err) {
      error(err.stack);
      process.exit(1);
    }
  })
  .parse(process.argv);
