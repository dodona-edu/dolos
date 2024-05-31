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
  kgrams: Array<Range>;
  shared: Set<SharedFingerprint>;
  ignored: Set<SharedFingerprint>;
  isIgnored: boolean;
}

export interface Occurrence {
  file: TokenizedFile;
  side: ASTRegion;
}

export class FingerprintIndex {
  // HashFilter transforms tokens into (a selection of) hashes
  private readonly hashFilter: HashFilter;
  // A map of file id to FileEntry object that has been analysed
  private readonly files: Map<number, FileEntry>;
  // A map of file id to FileEntry object that is ignored (e.g. template code)
  private readonly ignoredFiles: Map<number, FileEntry>;
  // A map of hashes to their Shared Fingerprints (which keep track of the files they are in)
  private readonly index: Map<Hash, SharedFingerprint>;
  // A set of ignored hashes (either manually added, or through the ignored files, NOT because of maxFileCount)
  private readonly ignoredHashes: Set<number>;

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
    this.ignoredFiles = new Map<number, FileEntry>();
    this.index = new Map<Hash, SharedFingerprint>();
    this.ignoredHashes = new Set<number>();
  }

  public addIgnoredFile(file: TokenizedFile): void {
    assert(!this.ignoredFiles.has(file.id), `This file has already been ignored: ${file.file.path}`);
    const entry: FileEntry = {
      file,
      kgrams: [],
      isIgnored: true,
      shared: new Set<SharedFingerprint>(),
      ignored: new Set<SharedFingerprint>()
    };

    this.ignoredFiles.set(file.id, entry);
    this.addEntry(entry);
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
      if (!this.ignoredHashes.has(shared.hash)) {
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
      const entry: FileEntry = {
        file,
        kgrams: [],
        isIgnored: false,
        shared: new Set<SharedFingerprint>(),
        ignored: new Set<SharedFingerprint>()
      };

      this.files.set(file.id, entry);
      this.addEntry(entry);
    }

    return this.index;
  }

  private addEntry(entry: FileEntry): void {
    const file = entry.file;
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
      if (entry.isIgnored || shared.fileCount() > this.maxFingerprintFileCount || this.ignoredHashes.has(hash)) {
        this.ignoreSharedFingerprint(shared);
      } else {
        entry.shared.add(shared);
      }

      kgram += 1;
    }
  }

  public addIgnoredHashes(hashes: Array<Hash>): void {
    for (const hash of hashes) {
      this.ignoredHashes.add(hash);
      const shared = this.index.get(hash);
      if (shared) {
        this.ignoreSharedFingerprint(shared);
      }
    }
  }

  private ignoreSharedFingerprint(shared: SharedFingerprint): void {
    shared.ignored = true;
    for (const other of shared.files()) {
      if (!this.ignoredFiles.has(other.id)) {
        const otherEntry = this.files.get(other.id)!;
        otherEntry.shared.delete(shared);
        otherEntry.ignored.add(shared);
      }
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

  public ignoredEntries(): Array<FileEntry> {
    return Array.from(this.ignoredFiles.values());
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
