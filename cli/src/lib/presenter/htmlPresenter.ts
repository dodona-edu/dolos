import { default as express, Express, RequestHandler } from "express";
import assert from "assert";
import * as http from "http";
import { CsvPresenter } from "./csvPresenter";
import { Writable } from "stream";
import path from "path";

function respondwithCSV(write: (out: Writable) => void): RequestHandler {
  return ((_req, res) => {
    res.contentType("text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=intersections.csv");
    write(res);
  });
}


export class HtmlPresenter extends CsvPresenter {

  async present(): Promise<void> {
    assert(this.analysis.scoredIntersections);
    const app: Express = express();

    app.get("/data/metadata.csv", respondwithCSV(o => this.writeMetadata(o)));
    app.get("/data/files.csv", respondwithCSV(o => this.writeFiles(o)));
    app.get("/data/intersections.csv", respondwithCSV(o => this.writeIntersections(o)));
    app.get("/data/sharedKmers.csv", respondwithCSV(o => this.writeKmers(o)));

    app.use(express.static(path.join(__dirname, "..", "..", "..", "..", "web", "dist")));

    return this.run(app);
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

    await serverStarted;
    console.log(`Dolos is available on http://localhost:${ this.options.localPort }`);
    console.log("Press Ctrl-C to exit.");

    return serverStopped;
  }


}