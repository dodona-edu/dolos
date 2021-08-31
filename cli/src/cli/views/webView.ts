import { FileView, Options as FVOptions } from "./fileView";
import runServer, { Options as ServerOptions } from "../server";
import { Report } from "../../lib/analyze/report";

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
    await runServer(reportDir, this.options);
  }
}