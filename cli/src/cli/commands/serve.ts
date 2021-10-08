import { Command } from "commander";
import { promises as fs, constants } from "fs";
import * as path from "path";
import runServer, { DEFAULT_PORT } from "../server";
import * as Utils from "../../lib/util/utils";
import { tryCatch, error, setLogging } from "../../lib/util/utils";

export function serveCommand(program: Command): Command {
  return new Command("serve")
    .description("Serve the contents of an analysis.")
    .argument("<path>", "Path to the result of an analysis.")
    .option(
      "--no-open",
      Utils.indent(
        "Do not open the web page in your browser once it is ready."
      )
    )
    .option(
      "-p --port <port>",
      Utils.indent(
        "TCP port to host the webserver on."
      ),
      x => parseInt(x),
      DEFAULT_PORT
    )
    .action((reportDir, options) => serve(reportDir, { ...options, ...program.opts() }));
}

interface ServeOptions {
  open: boolean;
  port: number;
  verbose: boolean;
}

export async function serve(reportDir: string, options: ServeOptions): Promise<void> {
  if (options.verbose) {
    setLogging("info");
  }

  tryCatch(options.verbose, async () => {
    try {
      for (const file of ["files.csv", "kgrams.csv", "metadata.csv", "pairs.csv", "fragments"]) {
        await fs.access(path.join(reportDir, file), constants.R_OK);
      }
    } catch (e) {
      if(e instanceof Error) {
        error(e.message);
      }
      throw new Error(`The given path '${reportDir}' does not seem like a Dolos report.`);
    }
    await runServer(reportDir, options);
  });
}
