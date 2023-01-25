import { View } from "./view";
import { stringify } from "csv-stringify";
import { Writable } from "stream";
import { createWriteStream, promises as fs } from "fs";
import {
  Report,
  Pair,
  Region,
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
    writeCSVto<Pair>(
      out,
      this.report.allPairs(),
      {
        "id": p => p.id,
        "leftFileId": p => p.leftFile.id,
        "leftFilePath": p => p.leftFile.path,
        "rightFileId": p => p.rightFile.id,
        "rightFilePath": p => p.rightFile.path,
        "similarity": p => p.similarity,
        "totalOverlap": p => p.overlap,
        "longestFragment": p => p.longest,
        "leftCovered": p => p.leftCovered,
        "rightCovered": p => p.rightCovered
      });
  }

  public writeFiles(out: Writable): void {
    writeCSVto<TokenizedFile>(
      out,
      this.report.files,
      {
        "id": f => f.id,
        "path": f => f.path,
        "content": f => f.content,
        "amountOfKgrams": f => f.kgrams.length,
        "extra": f => JSON.stringify(f.extra)
      });
  }

  public writeAST(out: Writable): void {
    writeCSVto<[string, Region, number]>(
      out,
      this.report.files.flatMap(file => file.ast.map((token, i): [string, Region, number] => [token, file.mapping[i], file.id])),
      {
        "file": a => a[2],
        "token": a => a[0],
        "start_row": a => a[1].startRow,
        "start_col": a => a[1].startCol,
        "end_row": a => a[1].endRow,
        "end_col": a => a[1].endCol,
      });
  }


  public writeKgrams(out: Writable): void {
    writeCSVto<Array<number>>(out,
      this.report.sharedFingerprints().flatMap(fingerprint => fingerprint.files().map(file => [fingerprint.hash, file.id])),
      {
        "kgram_hash": a => a[0],
        "file": a => a[1],
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

  async writeToDirectory(): Promise<string> {
    const dirName = this.outputDestination;
    await fs.mkdir(dirName, { recursive: true });

    console.log(`Writing results to directory: ${dirName}`);
    this.writeMetadata(createWriteStream(`${dirName}/metadata.csv`));
    console.log("Metadata written.");
    this.writePairs(createWriteStream(`${dirName}/pairs.csv`));

    console.log("Pairs written.");

    this.writeKgrams(createWriteStream(`${dirName}/kgrams.csv`));
    console.log("Kgrams written.");
    this.writeFiles(createWriteStream(`${dirName}/files.csv`));
    console.log("Files written.");
    this.writeAST(createWriteStream(`${dirName}/ast.csv`));
    console.log("AST written.");
    console.log("Completed");
    return dirName;
  }

  async show(): Promise<void> {
    await this.writeToDirectory();
  }

}
