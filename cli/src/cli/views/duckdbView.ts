import { View } from "./view";
import { Database, Connection, DuckDbError, Callback } from "duckdb";
import { Options } from "./fileView";
import { Report } from "@dodona/dolos-lib";
import { pkg } from "../../cli";

export class DuckdbView extends View {

  protected outputDestination: string;
  private db: Database;
  private conn: Connection;

  private callback: Callback<void> = (err: DuckDbError | null, _res: void) => {
    if (err !== null) {
      console.error(err);
    }
  };

  constructor(protected report: Report, options: Options) {
    super();
    this.outputDestination =
      options.outputDestination || `dolos-report-${ new Date().toISOString().replace(/[.:-]/g, "") }.duckdb`;
    this.db = new Database(this.outputDestination);
    this.conn = this.db.connect();
  }

  public show(): Promise<void> {
    console.log(`Writing results to DuckDB database: ${this.outputDestination}`);
    console.log("Creating tables");
    this.createTables();
    console.log("Inserting files");
    this.insertFiles();
    console.log("Inserting pairs");
    this.insertPairs();
    console.log("Inserting kgrams");
    this.insertKgrams();
    console.log("Inserting metadata");
    this.insertMetadata();
    this.db.close(this.callback);
    console.log("Completed");
    return Promise.resolve();

  }

  private createTables() {
    this.conn.exec(`
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
    `, [], this.callback);
  }

  private insertFiles() {
    const insertFile = this.conn.prepare(`
      INSERT INTO files (id, path, content, kgram_count, extra) VALUES (?, ?, ?, ?, ?);
    `);
    const insertAST = this.conn.prepare(`
      INSERT INTO ast (file, idx, token, start_row, start_col, end_row, end_col) VALUES (?, ?, ?, ?, ?, ?, ?);
    `);
    for (const file of this.report.files) {
      insertFile.run(
        file.id,
        file.path,
        file.content,
        file.kgrams.length,
        JSON.stringify(file.extra || {}),
        this.callback
      );
      for (let i = 0; i < file.ast.length; i++) {
        const region = file.mapping[i];
        insertAST.run(file.id, i, file.ast[i], region.startRow, region.startCol, region.endRow, region.endCol, this.callback);
      }
    }
  }

  private insertPairs() {
    const insertPair = this.conn.prepare(`
      INSERT INTO pairs (id, left_file, right_file, similarity, total_overlap, longest_overlap, left_covered, right_covered) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);
    for (const pair of this.report.allPairs()) {
      insertPair.run(
        pair.id,
        pair.leftFile.id,
        pair.rightFile.id,
        pair.similarity,
        pair.overlap,
        pair.longest,
        pair.leftCovered,
        pair.rightCovered,
        this.callback
      );
    }
  }

  private insertKgrams() {
    const insertFileKgram = this.conn.prepare(`
      INSERT INTO file_kgrams (file, kgram_hash) VALUES (?, ?);
    `);
    for (const kgram of this.report.sharedFingerprints()) {
      for (const file of kgram.files()) {
        insertFileKgram.run(
          file.id,
          kgram.hash,
          this.callback
        );
      }
    }
  }

  private insertMetadata() {
    const metadata = this.report.metadata();
    this.conn.prepare(`
      INSERT INTO metadata (version, kgram_length, window_length, language, language_detected) VALUES (?, ?, ?, ?, ?);`
    ).run(
      pkg.version,
      metadata.kgramLength,
      metadata.kgramsInWindow,
      metadata.language,
      metadata.languageDetected ? 1 : 0,
      this.callback
    );
  }


}
