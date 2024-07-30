import { View } from "./view.js";
import { Database } from "duckdb-async";
import * as arrow from "apache-arrow";
import { promises as fs } from "fs";
import {
  Region,
  Report,
} from "@dodona/dolos-lib";


export interface Options {
  outputDestination?: string;
}

export class DbView extends View {

  protected outputDestination: string;

  constructor(protected report: Report, options: Options) {
    super();
    this.outputDestination =
      options.outputDestination || this.createName();
  }

  private createName(): string {
    const dashedName = this.report.name.replace(/ /g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const timestamp = new Date().toISOString().replace(/[.:-]/g, "");
    return `dolos-report-${ timestamp }-${ dashedName }.db`;
  }

  public async writePairs(db: Database): Promise<void> {
    const pairs = this.report.allPairs().map(pair => {
      return {
        id: pair.id,
        leftFileId: pair.leftFile.id,
        leftFilePath: pair.leftFile.path,
        rightFileId: pair.rightFile.id,
        rightFilePath: pair.rightFile.path,
        similarity: pair.similarity,
        totalOverlap: pair.overlap,
        longestFragment: pair.longest,
        leftCovered: pair.leftCovered,
        rightCovered: pair.rightCovered
      };
    });

    const table = arrow.tableFromJSON(pairs);

    await db.register_buffer("arrow_pairs", [arrow.tableToIPC(table)], true);
    await db.exec("CREATE TABLE pairs AS SELECT * FROM arrow_pairs");
  }

  public async writeKgrams(db: Database): Promise<void> {
    const fingerprints = this.report.sharedFingerprints();

    const table = arrow.tableFromArrays({
      id: new Uint32Array(fingerprints.map(f => f.id)),
      hash: new BigUint64Array(fingerprints.map(f => BigInt(f.hash))),
      ignored: fingerprints.map(f => f.ignored),
      data: fingerprints.map(f => f.kgram?.join(" ") || ""),
      files: fingerprints.map(f => JSON.stringify(f.files().map(f => f.id)))
    });


    await db.register_buffer("arrow_kgrams", [arrow.tableToIPC(table)], true);
    await db.exec("CREATE TABLE kgrams AS SELECT id, hash, ignored, data, list_transform(files->'$[*]', f -> f::INTEGER) AS files FROM arrow_kgrams");
  }

  public async writeFiles(db: Database): Promise<void> {
    const entries = this.report.entries().concat(this.report.ignoredEntries());

    const table = arrow.tableFromArrays({
      id: new Uint32Array(entries.map(e => e.file.id)),
      ignored: entries.map(e => e.isIgnored),
      path: entries.map(e => e.file.path),
      content: entries.map(e => e.file.content),
      kgramCount: new Uint32Array(entries.map(e => e.kgrams.length)),
      ast: entries.map(e => JSON.stringify(e.file.tokens)),
      mapping: entries.map(e => JSON.stringify(Region.toUInt16(e.file.mapping))),
    });

    await db.register_buffer("arrow_files", [arrow.tableToIPC(table)], true);
    await db.exec(`
        CREATE TABLE files
            AS SELECT
                   id,
                   path,
                   content,
                   kgramCount,
                   list_transform(ast->'$[*]', s->s::STRING) AS ast,
                   list_transform(mapping->'$[*]', m -> m::INT2) AS mapping
            FROM arrow_files
    `);
  }

  public async writeMetadata(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE metadata (
            key STRING,
            value STRING,
            type STRING
       );
    `);
    const stmt = await db.prepare(`INSERT INTO metadata VALUES (?, ?, ?)`);
    for (const [key, value] of Object.entries(this.report.metadata())) {
      await stmt.run(
        key,
        value == null ? "null" : value.toString(),
        typeof value
      );
    }
    stmt.finalize();
  }

  async writeToDb(): Promise<string> {
    const dbName = this.outputDestination;
    if (await fs.stat(dbName).catch(() => false)) {
      throw new Error(`File ${dbName} already exists. Please specify a different output destination.`);
    }
    const db = await Database.create(dbName);
    await db.exec('INSTALL arrow; LOAD arrow; BEGIN TRANSACTION;');

    console.log(`Writing results to database: ${dbName}`);
    await this.writeMetadata(db);
    console.log("Metadata written.");
    await this.writePairs(db);

    console.log("Pairs written.");

    await this.writeKgrams(db);
    console.log("Kgrams written.");
    await this.writeFiles(db);
    console.log("Files written.");

    await db.exec('COMMIT;');
    console.log("Completed");
    await db.close();
    return dbName;
  }

  async show(): Promise<void> {
    await this.writeToDb();
  }

}
