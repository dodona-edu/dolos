import { View } from "./view";
import { stringify } from "csv-stringify";
import { Writable } from "stream";
import { createWriteStream, promises as fs } from "fs";
import {
  Report,
  ScoredPairs,
  SharedFingerprint,
  TokenizedFile
} from "@dodona/dolos-lib";

function writeCSVto<T>(
  out: Writable,
  data: T[],
  extractor: {[field: string]: (obj: T) => string | number | null}
): void {

  const csv = stringify();
  csv.pipe(out);

  const keys: string[] = [];
  const extractors: Array<(obj: T) => string | number | null> = [];
  for (const [key, extract] of Object.entries(extractor)) {
    keys.push(key);
    extractors.push(extract);
  }

  csv.write(keys);
  for(const datum of data) {
    csv.write(extractors.map(e => e(datum)));
  }
  csv.end();
}

export interface Options {
  outputDestination?: string;
}

export class FileView extends View {

  protected outputDestination: string;

  constructor(protected report: Report, options: Options) {
    super();
    this.outputDestination =
      options.outputDestination || `dolos-report-${ new Date().toISOString().replace(/[.:-]/g, "") }`;
  }

  public writePairs(out: Writable): void {
    writeCSVto<ScoredPairs>(
      out,
      this.report.scoredPairs,
      {
        "id": s => s.pair.id,
        "leftFileId": s => s.pair.leftFile.id,
        "leftFilePath": s => s.pair.leftFile.path,
        "rightFileId": s => s.pair.rightFile.id,
        "rightFilePath": s => s.pair.rightFile.path,
        "similarity": s => s.similarity,
        "totalOverlap": s => s.overlap,
        "longestFragment": s => s.longest,
        "leftCovered": s => s.leftCovered,
        "rightCovered": s => s.rightCovered
      });
  }

  public writekgrams(out: Writable): void {
    writeCSVto<SharedFingerprint>(
      out,
      this.report.sharedFingerprints(),
      {
        "id": s => s.id,
        "hash": s => s.hash,
        "data": s => s.kgram?.join(" ") || null,
        "files": s => JSON.stringify(s.files().map(f => f.id))
      });
  }

  public writeFiles(out: Writable): void {
    writeCSVto<TokenizedFile>(
      out,
      this.report.files(),
      {
        "id": f => f.id,
        "path": f => f.path,
        "content": f => f.content,
        "amountOfKgrams": f => f.kgrams.length,
        "ast": f => JSON.stringify(f.ast),
        "mapping": f => JSON.stringify(f.mapping),
        "extra": f => JSON.stringify(f.extra)
      });
  }

  public writeMetadata(out: Writable): void {
    const metaData = this.report.metadata();
    writeCSVto<[string, string]>(
      out,
      Object.entries(metaData),
      {
        "property": ([k ]) => k,
        "value": ([, v]) => v == null ? "null" : v.toString(),
        "type": ([, v]) => typeof v
      });
  }

  public writeSemantic(out: Writable): void {

    out.write(
      JSON.stringify({
        semanticMapResults: this.report.semanticResults,
        occurrences: this.report.occurrences.map(o => o.map(f => f.file.id)),
      })
    );
  }

  async writeToDirectory(): Promise<string> {
    const dirName = this.outputDestination;
    await fs.mkdir(dirName, { recursive: true });

    console.log(`Writing results to directory: ${dirName}`);
    this.writeMetadata(createWriteStream(`${dirName}/metadata.csv`));
    console.log("Metadata written.");
    this.writePairs(createWriteStream(`${dirName}/pairs.csv`));

    console.log("Pairs written.");
    if(this.report.options.semantic) {
      this.writeSemantic(createWriteStream(`${dirName}/semantic.json`));
      console.log("Semantic output written.");
    }

    this.writekgrams(createWriteStream(`${dirName}/kgrams.csv`));
    console.log("Kgrams written.");
    this.writeFiles(createWriteStream(`${dirName}/files.csv`));
    console.log("Files written.");
    console.log("Completed");
    return dirName;
  }

  async show(): Promise<void> {
    await this.writeToDirectory();
  }

}
