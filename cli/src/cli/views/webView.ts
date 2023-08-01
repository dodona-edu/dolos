import { FileView, Options as FVOptions } from "./fileView.js";
import runServer, { Options as ServerOptions } from "../server.js";
import { Report } from "@dodona/dolos-lib";

/**
 * This {@link View} will launch a webserver which hosts a web application to
 * display results of an analysis written to CSV-files using the
 * {@link FileView}.
 */
export class WebView extends FileView {

  constructor(report: Report, private options: ServerOptions & FVOptions) {
    super(report, options);
  }

  async show(): Promise<void> {
    const reportDir = await this.writeToDirectory();
    setTimeout(async () => await runServer(reportDir, this.options), 1000);
  }
}
