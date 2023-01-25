import { View } from "./view";
import Sqlite from "better-sqlite3";
import { Options } from "./fileView";
import { Report } from "@dodona/dolos-lib";
import { pkg } from "../../cli";

export class SqliteView extends View {

  protected outputDestination: string;
  private db: Sqlite.Database;

  constructor(protected report: Report, options: Options) {
    super();
    this.outputDestination =
      options.outputDestination || `dolos-report-${ new Date().toISOString().replace(/[.:-]/g, "") }.sqlite3`;
    this.db = new Sqlite(this.outputDestination);
    //this.db.pragma("journal_mode=OFF");
    this.db.pragma("journal_mode=WAL");
    this.db.pragma("synchronous=OFF");
    this.db.pragma("temp_store=MEMORY");
    this.db.pragma("wal_autocheckpoint=0");
    this.db.pragma("locking_mode=EXCLUSIVE");
    this.db.pragma("foreign_keys=FALSE");
  }

  public show(): Promise<void> {
    console.log(`Writing results to sqlite database: ${this.outputDestination}`);
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
    this.db.close();
    console.log("Completed");
    return Promise.resolve();

  }

  private createTables() {
    this.db.exec(`
      CREATE TABLE files (
        id INTEGER PRIMARY KEY,
        path TEXT NOT NULL,
        content TEXT NOT NULL,
        kgram_count INTEGER NOT NULL,
        extra TEXT NOT NULL
      ) STRICT;
      
      CREATE TABLE ast (
        file INTEGER NOT NULL REFERENCES files,
        idx INTEGER NOT NULL,
        token TEXT NOT NULL,
        start_row INTEGER NOT NULL,
        start_col INTEGER NOT NULL,
        end_row INTEGER NOT NULL,
        end_col INTEGER NOT NULL
      ) STRICT;
            
      CREATE TABLE pairs (
        id INTEGER PRIMARY KEY,
        left_file INTEGER NOT NULL REFERENCES files,
        right_file INTEGER NOT NULL REFERENCES files,
        similarity REAL NOT NULL,
        total_overlap INTEGER NOT NULL,
        longest_overlap INTEGER NOT NULL,
        left_covered INTEGER NOT NULL,
        right_covered INTEGER NOT NULL
      ) STRICT;
      
      CREATE TABLE file_kgrams (
        file INTEGER NOT NULL REFERENCES files,
        kgram_hash INTEGER NOT NULL
      ) STRICT;
      
      CREATE TABLE metadata (
        version TEXT NOT NULL,
        kgram_length INTEGER NOT NULL,
        window_length INTEGER NOT NULL,
        language TEXT NOT NULL,
        language_detected INTEGER NOT NULL
      ) STRICT;
    `);
  }

  private insertFiles() {
    const insertFile = this.db.prepare(`
      INSERT INTO files (id, path, content, kgram_count, extra) VALUES (?, ?, ?, ?, ?);
    `);
    const insertAST = this.db.prepare(`
      INSERT INTO ast (file, idx, token, start_row, start_col, end_row, end_col) VALUES (?, ?, ?, ?, ?, ?, ?);
    `);
    for (const file of this.report.files) {
      insertFile.run(
        file.id,
        file.path,
        file.content,
        file.kgrams.length,
        JSON.stringify(file.extra || {})
      );
    }
    for (const file of this.report.files) {
      for (let i = 0; i < file.ast.length; i++) {
        const region = file.mapping[i];
        insertAST.run(file.id, i, file.ast[i], region.startRow, region.startCol, region.endRow, region.endCol);
      }
    }
  }

  private insertPairs() {
    const insertPair = this.db.prepare(`
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
        pair.rightCovered
      );
    }
  }

  private insertKgrams() {
    const insertFileKgram = this.db.prepare(`
      INSERT INTO file_kgrams (file, kgram_hash) VALUES (?, ?);
    `);
    for (const kgram of this.report.sharedFingerprints()) {
      for (const file of kgram.files()) {
        insertFileKgram.run([
          file.id,
          kgram.hash,
        ]);
      }
    }
  }

  private insertMetadata() {
    const metadata = this.report.metadata();
    this.db.prepare(`
      INSERT INTO metadata (version, kgram_length, window_length, language, language_detected) VALUES (?, ?, ?, ?, ?);`
    ).run(
      pkg.version,
      metadata.kgramLength,
      metadata.kgramsInWindow,
      metadata.language,
      metadata.languageDetected ? 1 : 0,
    );
  }


}
