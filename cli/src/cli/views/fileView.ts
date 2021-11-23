import { View } from "./view";
import csvStringify from "csv-stringify";
import { Writable } from "stream";
import { createWriteStream, promises, promises as fs } from "fs";
import { Fragment, Pair, Report } from "@dodona/dolos-lib";

function writeCSVto<T>(
  out: Writable,
  data: T[],
  extractor: {[field: string]: (obj: T) => string | number | null}
): void {

  const csv = csvStringify();
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

  private convertFragmentsToJSON(fragments: Fragment[]): string {
    return JSON.stringify(fragments.map( fragment => {
      return {
        leftSelection: fragment.leftSelection,
        rightSelection: fragment.rightSelection,
        data: fragment.mergedData,
        pairedOccurrences: fragment.pairs.map(pair => {
          return {
            sharedFingerprint: pair.fingerprint.id,
            left: {
              start: pair.left.start,
              stop: pair.left.stop,
              index: pair.left.index,
            },
            right: {
              start: pair.right.start,
              stop: pair.right.stop,
              index: pair.right.index,
            }
          };
        })
      };
    }), null, 2);
  }

  public async writeFragments(out: promises.FileHandle, pair: Pair): Promise<void> {
    await out.write(this.convertFragmentsToJSON(pair.fragments()));
  }

  public writePairs(out: Writable): void {
    writeCSVto(
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
      });
  }

  public writekgrams(out: Writable): void {
    writeCSVto(
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
    writeCSVto(
      out,
      this.report.files(),
      {
        "id": f => f.id,
        "path": f => f.path,
        "content": f => f.content,
        "ast": f => JSON.stringify(f.ast),
        "mapping": f => JSON.stringify(f.mapping),
        "amountOfKgrams": f => f.kgrams.length,
        "extra": f => JSON.stringify(f.extra)
      });
  }

  public writeMetadata(out: Writable): void {
    const metaData = this.report.options.asObject();
    writeCSVto(
      out,
      Object.entries(metaData),
      {
        "property": ([k ]) => k,
        "value": ([, v]) => v,
        "type": ([, v]) => typeof v
      });
  }

  async writeToDirectory(writeFragments = false): Promise<string> {
    const dirName = this.outputDestination;
    await fs.mkdir(dirName, { recursive: true });

    console.log(`Writing results to directory: ${dirName}`);
    this.writeMetadata(createWriteStream(`${dirName}/metadata.csv`));
    console.log("Metadata written.");
    this.writePairs(createWriteStream(`${dirName}/pairs.csv`));
    console.log("Pairs written.");
    if (writeFragments) {

      await fs.mkdir(`${dirName}/fragments`);
      for (const pair of this.report.scoredPairs) {
        const id = pair.pair.id;
        const file = await fs.open(`${dirName}/fragments/${id}.json`, "w");
        await this.writeFragments(file, pair.pair);
        await file.close();
      }
      console.log("Fragments written");

    }
    this.writekgrams(createWriteStream(`${dirName}/kgrams.csv`));
    console.log("kgrams written.");
    this.writeFiles(createWriteStream(`${dirName}/files.csv`));
    console.log("Files written.");
    console.log("Completed");
    return dirName;
  }

  async show(): Promise<void> {
    await this.writeToDirectory(true);
  }

}
