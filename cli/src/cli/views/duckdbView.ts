import { View } from "./view";
import { Database, Connection  } from "duckdb-async";
import { Options } from "./fileView";
import { Report } from "@dodona/dolos-lib";
import { pkg } from "../../cli";

export class DuckdbView extends View {

  protected outputDestination: string;

  constructor(protected report: Report, options: Options) {
    super();
    this.outputDestination =
      options.outputDestination || `dolos-report-${ new Date().toISOString().replace(/[.:-]/g, "") }.duckdb`;
  }

  public async show(): Promise<void> {
    const db = await Database.create(this.outputDestination);
    const conn = await db.connect();
    console.log(`Writing results to DuckDB database: ${this.outputDestination}`);
    console.log("Creating tables");
    await this.createTables(conn);
    console.log("Inserting files");
    await this.insertFiles(conn);
    console.log("Inserting pairs");
    await this.insertPairs(conn);
    console.log("Inserting kgrams");
    await this.insertKgrams(conn);
    console.log("Inserting metadata");
    await this.insertMetadata(conn);
    await db.close();
    console.log("Completed");
    return Promise.resolve();

  }

  private createTables(conn: Connection): Promise<void> {
    return conn.exec(`
      CREATE TABLE files (
        id INTEGER PRIMARY KEY,
        path TEXT NOT NULL,
        content TEXT NOT NULL,
        kgram_count INTEGER NOT NULL,
        extra TEXT NOT NULL
      );
      
      CREATE TABLE ast (
        file INTEGER NOT NULL REFERENCES files(id),
        idx INTEGER NOT NULL,
        token TEXT NOT NULL,
        start_row INTEGER NOT NULL,
        start_col INTEGER NOT NULL,
        end_row INTEGER NOT NULL,
        end_col INTEGER NOT NULL
      );
            
      CREATE TABLE pairs (
        id INTEGER PRIMARY KEY,
        left_file INTEGER NOT NULL REFERENCES files(id),
        right_file INTEGER NOT NULL REFERENCES files(id),
        similarity REAL NOT NULL,
        total_overlap INTEGER NOT NULL,
        longest_overlap INTEGER NOT NULL,
        left_covered INTEGER NOT NULL,
        right_covered INTEGER NOT NULL
      );
      
      CREATE TABLE file_kgrams (
        file INTEGER NOT NULL REFERENCES files(id),
        kgram_hash INTEGER NOT NULL
      );
      
      CREATE TABLE metadata (
        version TEXT NOT NULL,
        kgram_length INTEGER NOT NULL,
        window_length INTEGER NOT NULL,
        language TEXT NOT NULL,
        language_detected INTEGER NOT NULL
      );
    `);
  }

  private async insertFiles(conn: Connection): Promise<void> {
    const insertFile = await conn.prepare(`
      INSERT INTO files (id, path, content, kgram_count, extra) VALUES (?, ?, ?, ?, ?);
    `);
    const insertAST = await conn.prepare(`
      INSERT INTO ast (file, idx, token, start_row, start_col, end_row, end_col) VALUES (?, ?, ?, ?, ?, ?, ?);
    `);
    for (const file of this.report.files) {
      await insertFile.run(
        file.id,
        file.path,
        file.content,
        file.kgrams.length,
        JSON.stringify(file.extra || {}),
      );
      for (let i = 0; i < file.ast.length; i++) {
        const region = file.mapping[i];
        await insertAST.run(file.id, i, file.ast[i], region.startRow, region.startCol, region.endRow, region.endCol);
      }
    }
  }

  private async insertPairs(conn: Connection) {
    const insertPair = await conn.prepare(`
      INSERT INTO pairs (id, left_file, right_file, similarity, total_overlap, longest_overlap, left_covered, right_covered) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);
    for (const pair of this.report.allPairs()) {
      await insertPair.run(
        pair.id,
        pair.leftFile.id,
        pair.rightFile.id,
        pair.similarity,
        pair.overlap,
        pair.longest,
        pair.leftCovered,
        pair.rightCovered,
      );
    }
  }

  private async insertKgrams(conn: Connection) {
    const insertFileKgram = await conn.prepare(`
      INSERT INTO file_kgrams (file, kgram_hash) VALUES (?, ?);
    `);
    for (const kgram of this.report.sharedFingerprints()) {
      for (const file of kgram.files()) {
        await insertFileKgram.run(
          file.id,
          kgram.hash,
        );
      }
    }
  }

  private async insertMetadata(conn: Connection) {
    const metadata = this.report.metadata();
    await conn.exec(`
      INSERT INTO metadata (version, kgram_length, window_length, language, language_detected) VALUES (?, ?, ?, ?, ?);`,
      pkg.version,
      metadata.kgramLength,
      metadata.kgramsInWindow,
      metadata.language,
      metadata.languageDetected ? 1 : 0,
    );
  }


}
