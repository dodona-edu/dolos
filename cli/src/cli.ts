#!/usr/bin/env node
import * as Utils from "./lib/util/utils";
import { Command } from "commander";
import { runCommand } from "./cli/commands/run";
import { serveCommand } from "./cli/commands/serve";
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
    Utils.indent("Enable verbose logging.")
  );

program
  .addCommand(runCommand(program), { isDefault: true })
  .addCommand(serveCommand(program))
  .parse(process.argv);
