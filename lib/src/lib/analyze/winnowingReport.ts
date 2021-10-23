import assert from "assert";
import { Pair } from "./pair";
import { DefaultMap } from "../util/defaultMap";
import { File } from "../file/file";
import { TokenizedFile } from "../file/tokenizedFile";
import { PairedOccurrence, ASTRegion } from "./pairedOccurrence";
import { Range } from "../util/range";
import { Options } from "../util/options";
import { SharedWinnowingFingerprint } from "./sharedWinnowingFingerprint";
import { closestMatch } from "../util/utils";
import { SharedFingerprint } from "../outputFormat/exchangeData";
import { Report } from "./report";
import { AstFileNullable } from "../outputFormat/astFile";

type Hash = number;

export interface ScoredPairs {
  pair: Pair;
  overlap: number;
  longest: number;
  similarity: number;
}

export interface Occurrence {
  file: TokenizedFile;
  side: ASTRegion;
}

export class WinnowingReport implements Report {

  // computed list of scored pairs,
  // only defined after finished() is called
  private scored?: Array<ScoredPairs>;

  // collection of all shared fingerprints
  private fingerprints: Map<Hash, SharedWinnowingFingerprint> = new Map();

  private readonly fileSet: Set<AstFileNullable>;

  constructor(
    public readonly options: Options,
    files: AstFileNullable[],
  ) {
    this.fileSet = new Set(files);
  }

  public addOccurrences(hash: Hash, ...parts: Array<Occurrence>): void {
    assert(parts.length > 0);
    let fingerprint = this.fingerprints.get(hash);
    if(!fingerprint) {
      fingerprint = new SharedWinnowingFingerprint(hash, parts[0].side.data);
      this.fingerprints.set(hash, fingerprint);
    }
    fingerprint.addAll(parts);
  }

  /**
   * Finish the report and apply postprocessing steps.
   * @param hashWhitelist: a list of all allowed hash values
   */
  public finish(hashWhitelist?: Set<Hash>): void {
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

    let ints = this.build(hashWhitelist);

    ints = ints.map(pair => {
      pair.removeSmallerThan(this.options.minFragmentLength);
      pair.squash();
      return pair;
    });

    ints = ints.filter(i => i.fragmentCount > 0);

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
    return Array.of(...this.fingerprints.values()).map(swf => ({
      id: swf.id,
      fingerprint: swf.hash,
      fileIds: swf.files().map(f => f.id),
      data: swf.kgram?.join(" ") || null
    }));
  }

  /**
   * Combining all shared fingerprints and build pairs
   * @param hashWhitelist: a list of all allowed hash values
   */
  private build(hashWhitelist?: Set<Hash>): Array<Pair> {
    const pairs:
      DefaultMap<TokenizedFile, Map<TokenizedFile, Pair>>
      = new DefaultMap(() => new Map());

    let maxFiles: number;
    if (this.options.maxFingerprintCount != null) {
      maxFiles = this.options.maxFingerprintCount;
    } else if (this.options.maxFingerprintPercentage != null) {
      maxFiles = this.options.maxFingerprintPercentage * this.fileSet.size;
    } else {
      maxFiles = this.fileSet.size;
    }

    let filteredFingerprints = Array
      .of(...this.fingerprints.values())
      .filter(k => k.files().length <= maxFiles);

    if(hashWhitelist) {
      filteredFingerprints = filteredFingerprints
        .filter(k => hashWhitelist.has(k.hash));
    }

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

          let pair = pairs.get(first.file).get(second.file);
          if (!pair) {
            pair = new Pair(first.file, second.file);
            pairs.get(first.file).set(second.file, pair);
          }

          const match = new PairedOccurrence(first.side, second.side, fingerprint);
          pair.addPair(match);
        }
      }
    }

    // flatten nested map
    return Array.of(...pairs.values())
      .map(m => Array.of(...m.values()))
      .flat();
  }

  public get files(): Array<AstFileNullable> {
    return Array.of(...this.fileSet);
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
      longest: pair.longestFragment(),
      similarity: (leftCovered + rightCovered) / (leftTotal + rightTotal)
    };
  }
}
