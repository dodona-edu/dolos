import { View } from "./view.js";
import { Database } from "duckdb-async";
import { promises as fs } from "fs";
import {
  Report,
  Region,
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
    await db.exec(`
        CREATE TABLE pairs (
            id INTEGER,
            leftFileId INTEGER,
            leftFilePath STRING,
            rightFileId INTEGER,
            rightFilePath STRING,
            similarity FLOAT,
            totalOverlap INTEGER,
            longestFragment INTEGER,
            leftCovered INTEGER,
            rightCovered INTEGER
       );
    `);
    const stmt = await db.prepare(`INSERT INTO pairs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const pair of this.report.allPairs()) {
      await stmt.run(
        pair.id,
        pair.leftFile.id,
        pair.leftFile.path,
        pair.rightFile.id,
        pair.rightFile.path,
        pair.similarity,
        pair.overlap,
        pair.longest,
        pair.leftCovered,
        pair.rightCovered
      );
    }
    stmt.finalize();
  }

  /*public async writePairs(db: Database): Promise<void> {
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
  }*/


  public async writeKgrams(db: Database): Promise<void> {
    const fingerprints = this.report.sharedFingerprints();
    await db.exec(`
        CREATE TABLE kgrams (
            id INTEGER,
            hash INT8,
            ignored BOOLEAN,
            data STRING,
            files INTEGER[],
       );
    `);
    const stmt = await db.prepare(`INSERT INTO kgrams VALUES (?, ?, ?, ?, ?)`);
    for (const fingeprint of fingerprints) {
      await stmt.run(
        fingeprint.id,
        fingeprint.hash,
        fingeprint.ignored,
        fingeprint.kgram?.join(" ") || null,
        JSON.stringify(fingeprint.files().map(f => f.id))
      );
    }
    stmt.finalize();
  }

  public async writeFiles(db: Database): Promise<void> {
    const entries = this.report.entries().concat(this.report.ignoredEntries());
    await db.exec(`
        CREATE TABLE files (
            id INTEGER,
            ignored BOOLEAN,
            path STRING,
            content STRING,
            amountOfKgrams INTEGER,
            ast STRING[],
            mapping SMALLINT[],
            extra STRING
       );
    `);
    const stmt = await db.prepare(`INSERT INTO files VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const entry of entries) {
      await stmt.run(
        entry.file.id,
        entry.isIgnored,
        entry.file.path,
        entry.file.content,
        entry.kgrams.length,
        JSON.stringify(entry.file.tokens),
        JSON.stringify(Region.toUInt16(entry.file.mapping)),
        ""
      );
    }
    stmt.finalize();
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
