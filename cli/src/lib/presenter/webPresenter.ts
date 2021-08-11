import { default as express, Express } from "express";
import assert from "assert";
import * as http from "http";
import { CsvPresenter } from "./csvPresenter";
import path from "path";
import open from "open";
import { Report } from "../analyze/report";
import { Options } from "../util/options";
import { Pair } from "../analyze/pair";
import { error } from "../util/utils";

export class WebPresenter extends CsvPresenter {

  private pairMap: {[key: number]: Pair} = {};

  constructor(report: Report, options: Options, destination: string) {
    super(report, options, destination);
    for(const { pair } of report.scoredPairs) {
      this.pairMap[pair.id] = pair;
    }
  }

  async present(): Promise<void> {
    assert(this.report.scoredPairs);

    const reportDir = await this.writeToDirectory();

    try {
      const webfiles = require.resolve("@dodona/dolos-web");
      const app: Express = express();
      app.use("/data", express.static(reportDir));
      app.use(express.static(path.dirname(webfiles)));
      return this.run(app);
    } catch (e) {
      if (e.code === "MODULE_NOT_FOUND") {
        error("Module '@dodona/dolos-web' was not found on your system, " +
              "but it is required to run the web view.\n" +
              "Please install it to show the results in your browser.");
      }
      throw e;
    }
  }

  async run(app: Express): Promise<void> {
    const server = http.createServer(app);
    const serverStarted: Promise<void> = new Promise((r, e) => {
      server.on("listening", r);
      server.on("error", e);
    });
    const serverStopped: Promise<void> = new Promise((r, e) => {
      server.on("close", r);
      server.on("error", e);
    });

    server.listen(this.options.localPort, "localhost");

    const url = `http://localhost:${ this.options.localPort }`;

    await serverStarted;
    console.log(`Dolos is available on ${ url }`);

    if (this.options.open) {
      // Open the URL in browser
      console.log(`Opening the web page in your browser...`);
      await open(url, { wait: false });
    }

    console.log("Press Ctrl-C to exit.");
    return serverStopped;
  }


}
