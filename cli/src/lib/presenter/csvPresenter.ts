import { Presenter } from "./presenter";
import csvStringify from "csv-stringify";
import { Writable } from "stream";
import { createWriteStream, promises as fs } from "fs";

export function writeCSVto<T>(
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

export class CsvPresenter extends Presenter {

  public writeIntersections(out: Writable): void {
    writeCSVto(
      out,
      this.analysis.scoredIntersections,
      {
        "id": s => s.intersection.id,
        "leftFileId": s => s.intersection.leftFile.id,
        "rightFileId": s => s.intersection.rightFile.id,
        "similarity": s => s.similarity,
        "totalOverlap": s => s.overlap,
        "continuousOverlap": s => s.longest,
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
            };})
          };}))
      });
  }

  public writeKmers(out: Writable): void {
    writeCSVto(
      out,
      this.analysis.sharedKmers(),
      {
        "id": s => s.id,
        "hash": s => s.hash,
        "data": s => s.kmer,
        "files": s => JSON.stringify(s.files().map(f => f.id))
      });
  }

  public writeFiles(out: Writable): void {
    writeCSVto(
      out,
      this.analysis.files(),
      {
        "id": f => f.id,
        "path": f => f.path,
        "content": f => f.content,
        "ast": f => f.ast
      });
  }

  public writeMetadata(out: Writable): void {
    const metaData = this.analysis.options.asObject();
    writeCSVto(
      out,
      Object.entries(metaData),
      {
        "property": ([k, _v]) => k,
        "value": ([_k, v]) => v,
      });
  }

  async present(): Promise<void> {
    const dirName = `dolos-analysis-${ new Date().toISOString() }`;
    await fs.mkdir(dirName);

    console.log(`Writing results to directory: ${dirName}`);
    this.writeMetadata(createWriteStream(`${dirName}/metadata.csv`));
    console.log("Metadata written.");
    this.writeIntersections(createWriteStream(`${dirName}/intersections.csv`));
    console.log("Intersections written.");
    this.writeKmers(createWriteStream(`${dirName}/sharedKmers.csv`));
    console.log("SharedKmers written.");
    this.writeFiles(createWriteStream(`${dirName}/files.csv`));
    console.log("Files written.");
    console.log("Completed");
  }

}