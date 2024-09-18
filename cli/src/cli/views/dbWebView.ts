import { FileView, Options as FVOptions } from "./fileView.js";
import runServer, { Options as ServerOptions } from "../server.js";
import { Report } from "@dodona/dolos-lib";
import {DbView} from "./dbView.js";

/**
 * This {@link View} will launch a webserver which hosts a web application to
 * display results of an analysis written to CSV-files using the
 * {@link FileView}.
 */
export class DbWebView extends DbView {

  constructor(report: Report, private options: ServerOptions & FVOptions) {
    super(report, options);
  }

  async show(): Promise<void> {
    const reportDir = await this.writeToDb();
    const start = Date.now();
    const done = () => {
      const stop = Date.now();
      console.log(`Shown in ${stop - start}ms`);
    }
    setTimeout(async () => await runServer(reportDir, this.options, done), 1000);
  }
}
