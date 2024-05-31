import { View } from "./view.js";
import { stringify } from "csv-stringify";
import { Writable } from "stream";
import { createWriteStream, promises as fs } from "fs";
import {
  Report,
  Pair,
  SharedFingerprint,
  FileEntry
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
      options.outputDestination || this.createName();
  }

  private createName(): string {
    const dashedName = this.report.name.replace(/ /g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const timestamp = new Date().toISOString().replace(/[.:-]/g, "");
    return `dolos-report-${ timestamp }-${ dashedName }`;
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

  public writekgrams(out: Writable): void {
    writeCSVto<SharedFingerprint>(
      out,
      this.report.sharedFingerprints(),
      {
        "id": s => s.id,
        "hash": s => s.hash,
        "ignored": s => s.ignored ? "true" : "false",
        "data": s => s.kgram?.join(" ") || null,
        "files": s => JSON.stringify(s.files().map(f => f.id))
      });
  }

  public writeFiles(out: Writable): void {
    writeCSVto<FileEntry>(
      out,
      this.report.entries().concat(this.report.ignoredEntries()),
      {
        "id": f => f.file.id,
        "ignored": f => f.isIgnored ? "true" : "false",
        "path": f => f.file.path,
        "content": f => f.file.content,
        "amountOfKgrams": f => f.kgrams.length,
        "ast": f => JSON.stringify(f.file.tokens),
        "mapping": f => JSON.stringify(f.file.mapping),
        "extra": f => JSON.stringify(f.file.extra)
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
    if (await fs.stat(dirName).catch(() => false)) {
      throw new Error(`Directory ${dirName} already exists. Please specify a different output destination.`);
    }
    await fs.mkdir(dirName, { recursive: true });

    console.log(`Writing results to directory: ${dirName}`);
    this.writeMetadata(createWriteStream(`${dirName}/metadata.csv`));
    console.log("Metadata written.");
    this.writePairs(createWriteStream(`${dirName}/pairs.csv`));

    console.log("Pairs written.");

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
