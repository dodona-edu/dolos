import { HashFilter } from "../hashing/hashFilter.js";
import { Range } from "../util/range.js";
import { Region } from "../util/region.js";
import { WinnowFilter } from "../hashing/winnowFilter.js";
import { TokenizedFile } from "..//file/tokenizedFile.js";
import { SharedFingerprint } from "./sharedFingerprint.js";
import { ASTRegion } from "./pairedOccurrence.js";
import { Pair } from "./pair.js";
import { assert, assertDefined, closestMatch } from "../util/utils.js";

export type Hash = number;

export interface FileEntry {
  file: TokenizedFile;
  kgrams: Array<Range>,
  shared: Set<SharedFingerprint>,
  ignored: Set<SharedFingerprint>;
}

export interface Occurrence {
  file: TokenizedFile;
  side: ASTRegion;
}

export interface FingerprintIndexOptions {
  maxFingerprintCount?: number;
  maxFingerprintPercentage?: number;
}

export class FingerprintIndex {
  private readonly hashFilter: HashFilter;
  private readonly files: Map<number, FileEntry>;
  private readonly ignored: Map<number, FileEntry>;
  private readonly index: Map<Hash, SharedFingerprint>;
  private readonly ignoredFileFingerprints: Set<SharedFingerprint>;

  /**
   * Creates a Fingerprint Index which is able to compare files with each other
   * based on their winnowed fingerprints (kgrams of tokens).
   *
   */
  constructor(
    private readonly kgramLength: number,
    private readonly kgramsInWindow: number,
    kgramData?: boolean,
    private maxFingerprintFileCount = Number.MAX_SAFE_INTEGER,
  ) {
    this.hashFilter = new WinnowFilter(this.kgramLength, this.kgramsInWindow, kgramData);
    this.files = new Map<number, FileEntry>();
    this.ignored = new Map<number, FileEntry>();
    this.index = new Map<Hash, SharedFingerprint>();
    this.ignoredFileFingerprints = new Set<SharedFingerprint>();
  }

  public addIgnoredFile(tokenizedFile: TokenizedFile): void {
    assert(!this.ignored.has(tokenizedFile.id), `This file has already been ignored: ${tokenizedFile.file.path}`);
    this.addFileToIndex(tokenizedFile, true);
  }

  public getMaxFingerprintFileCount(): number {
    return this.maxFingerprintFileCount;
  }

  public updateMaxFingerprintFileCount(maxFingerprintFileCount: number | undefined): void {
    if (maxFingerprintFileCount == this.maxFingerprintFileCount) {
      return;
    }
    this.maxFingerprintFileCount = maxFingerprintFileCount || Number.MAX_SAFE_INTEGER;
    for (const shared of this.index.values()) {
      if (!this.ignoredFileFingerprints.has(shared)) {
        if (shared.fileCount() > this.maxFingerprintFileCount && !shared.ignored) {
          this.ignoreSharedFingerprint(shared);
        } else if (shared.fileCount() <= this.maxFingerprintFileCount && shared.ignored) {
          this.unIgnoreSharedFingerprint(shared);
        }
      }
    }
  }

  public addFiles(tokenizedFiles: TokenizedFile[]): Map<Hash, SharedFingerprint> {

    for (const f of tokenizedFiles) {
      assert(!this.files.has(f.id), `This file has already been analyzed: ${f.file.path}`);
    }

    for (const file of tokenizedFiles) {
      this.addFileToIndex(file);
    }

    return this.index;
  }

  private addFileToIndex(file: TokenizedFile, template = false): void {
    const entry: FileEntry = {
      file,
      kgrams: [],
      shared: new Set<SharedFingerprint>(),
      ignored: new Set<SharedFingerprint>()
    };

    this.files.set(file.id, entry);

    let kgram = 0;
    for (
      const { data, hash, start, stop  }
      of this.hashFilter.fingerprints(file.tokens)
    ) {

      // add kgram to file
      entry.kgrams.push(new Range(start, stop));

      // sanity check
      assert(
        Region.isInOrder(
          file.mapping[start],
          file.mapping[stop]
        )
        // If we end our kgram on a ')', the location of the opening token is used.
        // However, the location of this token in the file might be before
        // the location of the starting token of the kmer
        // For example: the last token of every ast is ')', closing the program.
        // The location of this token is always (0, 0), since the program root is the first token.
        // In this way, the 'end' token is before any other token in the AST.
        || file.tokens[stop] === ")" ,
        `Invalid ordering:
             expected ${file.mapping[start]}
             to start be before the end of ${file.mapping[stop]}`
      );

      const location = Region.merge(
        file.mapping[start],
        file.mapping[stop]
      );

      const part: Occurrence = {
        file,
        side: { index: kgram, start, stop, data, location }
      };

      // look if the index already contains the given hashing
      let shared: SharedFingerprint | undefined = this.index.get(hash);

      if (!shared) {
        // if the hashing does not yet exist in the index, add it
        shared = new SharedFingerprint(hash, data);
        this.index.set(hash, shared);
      }

      shared.add(part);
      if (template || shared.fileCount() > this.maxFingerprintFileCount) {
        this.ignoreSharedFingerprint(shared);
      } else {
        entry.shared.add(shared);
      }

      kgram += 1;
    }
  }

  private ignoreSharedFingerprint(shared: SharedFingerprint): void {
    shared.ignored = true;
    for (const other of shared.files()) {
      const otherEntry = this.files.get(other.id)!;
      otherEntry.shared.delete(shared);
      otherEntry.ignored.add(shared);
    }
  }

  private unIgnoreSharedFingerprint(shared: SharedFingerprint): void {
    shared.ignored = false;
    for (const other of shared.files()) {
      const otherEntry = this.files.get(other.id)!;
      otherEntry.ignored.delete(shared);
      otherEntry.shared.add(shared);
    }
  }

  public sharedFingerprints(): Array<SharedFingerprint> {
    return Array.from(this.index.values());
  }

  public entries(): Array<FileEntry> {
    return Array.from(this.files.values());
  }

  public getPair(file1: TokenizedFile, file2: TokenizedFile): Pair {
    const entry1 = this.files.get(file1.id);
    const entry2 = this.files.get(file2.id);
    assertDefined(entry1, `File ${file1.path} not found in index`);
    assertDefined(entry2, `File ${file2.path} not found in index`);
    return new Pair(entry1, entry2);
  }

  public allPairs(sortBy?: string): Array<Pair> {
    const pairs = [];
    const entries = Array.from(this.files.values());
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        pairs.push(new Pair(entries[i], entries[j]));
      }
    }

    if (sortBy) {
      type SortFn = (a: Pair, b: Pair) => number;
      const sortfn = closestMatch<SortFn>(sortBy || "similarity", {
        "total overlap": (a, b) => b.overlap - a.overlap,
        "longest fragment": (a, b) => b.longest - a.longest,
        similarity: (a, b) => b.similarity - a.similarity,
      });

      assertDefined(sortfn, `${sortBy} is not a valid field to sort on`);

      pairs.sort(sortfn);
    }
    return pairs;
  }
}
