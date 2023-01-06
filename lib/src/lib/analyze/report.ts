import assert from "assert";
import { Pair } from "./pair";
import { File } from "../file/file";
import { TokenizedFile } from "../file/tokenizedFile";
import { PairedOccurrence, ASTRegion } from "./pairedOccurrence";
import { Range } from "../util/range";
import { DolosOptions, Options } from "../util/options";
import { SharedFingerprint } from "./sharedFingerprint";
import { closestMatch } from "../util/utils";
import { NodeStats } from "./SemanticAnalyzer";
import { Language } from "../util/language";

type Hash = number;

export interface ScoredPairs {
  pair: Pair;
  overlap: number;
  longest: number;
  similarity: number;
  leftCovered: number;
  rightCovered: number;
}

export interface Occurrence {
  file: TokenizedFile;
  side: ASTRegion;
}

export interface SemanticResult {
  left: number,
  right: number,
  childrenTotal: number,
  ownNodes: Array<number>
  childrenMatch: number;
}

export interface Metadata extends DolosOptions {
  languageDetected: boolean;
}

export interface EncodedSemanticResult extends SemanticResult {
  occurrences: Array<number>;
}

export interface DecodedSemanticResult extends SemanticResult {
  occurrences: Set<number>;
}

export class Report {

  // computed list of scored pairs,
  // only defined after finished() is called
  private scored?: Array<ScoredPairs>;

  // collection of all shared fingerprints
  private fingerprints: Map<Hash, SharedFingerprint> = new Map();


  public occurrences: Occurrence[][] = [];
  public results: Map<number, Map<number, NodeStats[]>> = new Map();
  public semanticResults: Array<EncodedSemanticResult> = [];

  constructor(
    public readonly options: Options,
    public readonly language: Language | null,
    public files: TokenizedFile[],
  ) {
  }

  public addOccurrences(hash: Hash, parts: Array<Occurrence>): void {
    assert(parts.length > 0);
    let fingerprint = this.fingerprints.get(hash);
    if(!fingerprint) {
      fingerprint = new SharedFingerprint(hash, parts[0].side.data);
      this.fingerprints.set(hash, fingerprint);
    }
    fingerprint.addAll(parts);
  }

  /**
   * Finish the report and apply postprocessing steps.
   */
  public finish(): void {
    assert(this.scored !== null, "this report is already finished");

    type SortFn = (a: ScoredPairs, b: ScoredPairs) => number;
    const sortfn = closestMatch<SortFn>(this.options.sortBy, {
      "total overlap": (a, b) => b.overlap - a.overlap,
      "longest fragment": (a, b) => b.longest - a.longest,
      "similarity": (a, b) => b.similarity - a.similarity,
    });

    if(sortfn === null) {
      throw new Error(`${this.options.sortBy} is not a valid field to sort on`);
    }

    let ints = this.build();

    ints = ints.map(pair => {
      pair.removeSmallerThan(this.options.minFragmentLength);
      pair.squash();
      return pair;
    });

    ints = ints.filter(i => i.fragmentCount > 0);

    this.semanticResults = this.encodeSemanticResults(this.results);

    this.scored = ints.map(i => this.calculateScore(i));

    this.scored = this.scored.filter(s =>
      s.similarity >= this.options.minSimilarity
    );

    this.scored.sort(sortfn);

    if(this.options.limitResults) {
      console.error(`Limiting to ${ this.options.limitResults } results.`);
      this.scored = this.scored.slice(0, this.options.limitResults);
    }

    Object.freeze(this);
  }

  public get scoredPairs(): Array<ScoredPairs> {
    if(this.scored) {
      return this.scored;
    } else {
      throw new Error("This report is not finished yet, " +
                      "but scoredPairs() was called");
    }
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

  /**
   * Combining all shared fingerprints and build pairs
   */
  private build(): Array<Pair> {
    const pairs: Map<string, Pair> = new Map();

    let maxFiles: number;
    if (this.options.maxFingerprintCount != null) {
      maxFiles = this.options.maxFingerprintCount;
    } else if (this.options.maxFingerprintPercentage != null) {
      maxFiles = this.options.maxFingerprintPercentage * this.files.length;
    } else {
      maxFiles = this.files.length;
    }

    const filteredFingerprints = Array.from(this.fingerprints.values())
      .filter(k => k.files().length <= maxFiles);

    // create pairs
    for (const fingerprint of filteredFingerprints) {
      const parts = fingerprint.parts().sort((a, b) => File.compare(a.file, b.file));
      for (let i = 0; i < parts.length; i += 1) {
        const first = parts[i];
        for (let j = i + 1; j < parts.length; j += 1) {
          const second = parts[j];
          if (first.file === second.file) {
            // ignore pairedOccurrences within the same file (internal duplication)
            continue;
          }

          const key = `${first.file.id}-${second.file.id}`;
          let pair = pairs.get(key);
          if (!pair) {
            pair = new Pair(first.file, second.file);
            pairs.set(key, pair);
          }

          const match = new PairedOccurrence(first.side, second.side, fingerprint);
          pair.addPair(match);
        }
      }
    }

    // flatten nested map
    return Array.from(pairs.values());
  }

  private calculateScore(pair: Pair): ScoredPairs {
    const fragments = pair.fragments();
    const leftCovered = Range.totalCovered(fragments.map(f => f.leftkgrams));
    const rightCovered = Range.totalCovered(fragments.map(f => f.rightkgrams));
    const leftTotal = pair.leftFile.kgrams.length;
    const rightTotal = pair.rightFile.kgrams.length;
    return {
      pair: pair,
      overlap: leftCovered + rightCovered,
      longest: pair.longestFragment,
      similarity: (leftCovered + rightCovered) / (leftTotal + rightTotal),
      leftCovered,
      rightCovered
    };
  }

  private encodeSemanticResults(results: Map<number, Map<number, NodeStats[]>>): EncodedSemanticResult[] {
    const encodedResults: EncodedSemanticResult[] = [];

    for(const [id1, map] of results.entries()) {
      for(const [id2, nodestats] of map.entries()) {
        const filtered = nodestats
          .filter(n => n.childrenTotal > this.options.semanticMatchLength);
        if(filtered.length === 0)
          continue;


        for(const nodeStat of filtered) {
          encodedResults.push({
            left: id1,
            right: id2,
            childrenTotal: nodeStat.childrenTotal,
            occurrences: Array.from(nodeStat.occurrences),
            ownNodes: nodeStat.ownNodes,
            childrenMatch: nodeStat.childrenMatch.get(id2) || 0,
          });

        }
      }
    }

    return encodedResults;
  }
}
