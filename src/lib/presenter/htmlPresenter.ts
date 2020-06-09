import { Presenter } from "./presenter";
import { Analysis } from "../analyze/analysis";
import { default as express, Express, RequestHandler } from "express";
import assert from "assert";
import * as http from "http";
import path from "path";
import * as CSV from "csv-string";
import { PristineInput } from "csv-string/dist/types";

function getCSV<T>(data: T[], extractor: {[field: string]: (obj: T) => PristineInput}): RequestHandler {
  const keys: string[] = [];
  const extractors: Array<(obj: T) => PristineInput> = [];
  Object.entries(extractor).forEach(([key, extractor]) => {keys.push(key); extractors.push(extractor)});
  return ((_req, res) => {
    res.contentType("text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=intersections.csv");
    res.write(CSV.stringify(keys));
    for (const datum of data) {
      res.write(CSV.stringify(extractors.map(e => e(datum))));
    }
    res.end();
  });
}


export class HtmlPresenter extends Presenter {

  async present(analysis: Analysis): Promise<void> {
    assert(analysis.scoredIntersections);
    const app: Express = express();

    const jsonInfo = {
      options: analysis.options,
      intersections: analysis.scoredIntersections.map(s => {
        return {
          id: s.intersection.id,
          leftFileId: s.intersection.leftFile.id,
          rightFileId: s.intersection.rightFile.id,
          similarity: s.similarity,
          totalOverlap: s.overlap,
          continuousOverlap: s.longest,
          fragmentCount: s.intersection.fragmentCount
        }
      })
    };

    app.get("/data/analysis.json", (_req, res) => {
      res.json(jsonInfo);
    });

    app.get("/data/files.csv",
      getCSV(analysis.files(),
        {
          "id": f => f.id,
          "path": f => f.path,
          "content": f => f.content,
          "ast": f => f.ast }
      ));

    app.get("/data/intersections.csv",
      getCSV(analysis.scoredIntersections,
        {
          "id": s => s.intersection.id,
          "fragments": s => JSON.stringify(s.intersection.fragments().map(
            fragment => { return {
              leftSelection: fragment.leftSelection,
              rightSelection: fragment.rightSelection,
              data: fragment.mergedData,
              matches: fragment.matches.map(match => { return {
                sharedKmer: match.kmer.id,
                left: {
                  start: match.left.start,
                  stop: match.left.stop,
                  index: match.left.index,
                },
                right: {
                  start: match.right.start,
                  stop: match.right.stop,
                  index: match.right.index,
                }
              }})
            }}))
        }
      ));

    app.get("/data/sharedKmers.csv",
      getCSV(analysis.sharedKmers(), {
        "id": s => s.id,
        "hash": s => s.hash,
        "data": s => s.kmer,
        "files": s => JSON.stringify(s.files().map(f => f.id))
      }
      ));


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