#!/usr/bin/env node
import * as Utils from "./cli/util/utils.js";
import { Command } from "commander";
import { runCommand } from "./cli/commands/run.js";
import { serveCommand } from "./cli/commands/serve.js";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

const versions = [
  `Dolos v${pkg.version}`,
  `Node ${process.version}`,
  `Tree-sitter ${pkg.dependencies["tree-sitter"]}`
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
