import { TokenizedFile, FingerprintIndex, Pair, SharedFingerprint, FileEntry } from "@dodona/dolos-core";
import { DolosOptions, Options } from "./options.js";
import { Language } from "./language.js";

export interface Metadata extends DolosOptions {
  languageDetected: boolean;
  createdAt: string;
  warnings: string[];
}

export class Report {
  // maximum amount of files a kgram can occur in a file before it is ignored
  private readonly kgramMaxFileOccurrences: number;

  private pairs: Array<Pair> = [];
  private fingerprints: Array<SharedFingerprint> = [];

  public readonly name: string;
  public readonly createdAt: string = new Date().toISOString();

  constructor(
    public readonly options: Options,
    public readonly language: Language | null,
    public readonly files: TokenizedFile[],
    public readonly index: FingerprintIndex,
    name?: string,
    public readonly warnings: string[] = [],
  ) {
    if (this.options.maxFingerprintCount != null) {
      this.kgramMaxFileOccurrences = this.options.maxFingerprintCount;
    } else if (this.options.maxFingerprintPercentage != null) {
      this.kgramMaxFileOccurrences = this.options.maxFingerprintPercentage * this.files.length;
    } else {
      this.kgramMaxFileOccurrences = this.files.length;
    }

    if (this.options.reportName) {
      this.name = this.options.reportName;
    } else {
      this.name = name || `${this.files.length} ${ this.language?.name } files`;
    }

    this.fingerprints = Array.from(index.sharedFingerprints()).filter(
      (k: SharedFingerprint) => k.fileCount() <= this.kgramMaxFileOccurrences,
    );
  }

  public getPair(file1: TokenizedFile, file2: TokenizedFile): Pair {
    return this.index.getPair(file1, file2);
  }

  public allPairs(): Array<Pair> {
    if (this.pairs.length === 0) {
      this.pairs = this.index.allPairs(this.options.sortBy);
    }
    return this.pairs;
  }

  public sharedFingerprints(): Array<SharedFingerprint> {
    return Array.from(this.fingerprints.values());
  }

  public entries(): Array<FileEntry> {
    return this.index.entries();
  }

  public metadata(): Metadata {
    return {
      ...this.options.asObject(),
      reportName: this.options.reportName ?? this.name,
      createdAt: this.createdAt,
      language: this.language?.name ?? null,
      languageDetected: this.options.language == undefined,
      warnings: this.warnings,
    };
  }
}
