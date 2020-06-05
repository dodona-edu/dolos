import { Presenter } from "./presenter";
import { Analysis } from "../analyze/analysis";
import { default as express, Express } from "express";
import assert from "assert";
import * as http from "http";
import path from "path";


export class HtmlPresenter extends Presenter {

  async present(analysis: Analysis): Promise<void> {
    assert(analysis.scoredIntersections);
    const app: Express = express();

    app.use("/data/info.json", (_req, res) =>
      res.json({ count: analysis.scoredIntersections.length })
    );

    app.use(express.static(path.join(__dirname, "..", "..", "view")));

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