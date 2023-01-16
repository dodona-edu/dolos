import assert from "assert";
import { Pair } from "./pair";
import { TokenizedFile } from "../file/tokenizedFile";
import { DolosOptions, Options } from "../util/options";
import { SharedFingerprint } from "./sharedFingerprint";
import { SemanticData } from "./SemanticAnalyzer";
import { Language } from "../util/language";
import {closestMatch} from "../util/utils";

type Hash = number;

export interface Metadata extends DolosOptions {
  languageDetected: boolean;
}

export class Report {
  // maximum amount of files a kgram can occur in a file before it is ignored
  private readonly kgramMaxFileOccurrences: number;

  public semanticData?: SemanticData;

  private fingerprints: Array<SharedFingerprint>;

  private pairs: Array<Pair> = [];

  constructor(
    public readonly options: Options,
    public readonly language: Language | null,
    public readonly files: TokenizedFile[],
    fingerprints: Map<Hash, SharedFingerprint>
  ) {

    if (this.options.maxFingerprintCount != null) {
      this.kgramMaxFileOccurrences = this.options.maxFingerprintCount;
    } else if (this.options.maxFingerprintPercentage != null) {
      this.kgramMaxFileOccurrences = this.options.maxFingerprintPercentage * this.files.length;
    } else {
      this.kgramMaxFileOccurrences = this.files.length;
    }

    this.fingerprints = Array.from(fingerprints.values())
      .filter((k: SharedFingerprint) => k.fileCount() <= this.kgramMaxFileOccurrences);
  }


  public getPair(file1: TokenizedFile, file2: TokenizedFile): Pair {

    assert(file1.shared.size > 0, `file1 (${file1.path}) does not seem to be analyzed yet.`);
    assert(file2.shared.size > 0, `file2 (${file2.path}) does not seem to be analyzed yet.`);
    return new Pair(file1, file2);
  }

  public allPairs(): Array<Pair> {
    if (this.pairs.length === 0) {
      for (let i = 0; i < this.files.length; i++) {
        for (let j = i + 1; j < this.files.length; j++) {
          this.pairs.push(this.getPair(this.files[i], this.files[j]));
        }
      }

      type SortFn = (a: Pair, b: Pair) => number;
      const sortfn = closestMatch<SortFn>(this.options.sortBy, {
        "total overlap": (a, b) => b.overlap - a.overlap,
        "longest fragment": (a, b) => b.longest - a.longest,
        "similarity": (a, b) => b.similarity - a.similarity,
      });

      if(sortfn === null) {
        throw new Error(`${this.options.sortBy} is not a valid field to sort on`);
      }

      this.pairs.sort(sortfn);
    }
    return this.pairs;
  }



  public setSemanticData(data: SemanticData) {
    this.semanticData = data;
  }

  public sharedFingerprints(): Array<SharedFingerprint> {
    return Array.from(this.fingerprints.values());
  }

  public metadata(): Metadata {
    return {
      ...this.options.asObject(),
      language: this.language?.name ?? null,
      languageDetected: this.options.language == undefined,
    };
  }
}
