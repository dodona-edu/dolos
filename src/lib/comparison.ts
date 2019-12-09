import File from "./files/file";
import FileGroup from "./files/fileGroup";
import { HashFilter } from "./filters/hashFilter";
import { NoFilter } from "./filters/noFilter";
import { WinnowFilter } from "./filters/winnowFilter";
import { Options } from "./options";
import Result from "./result";
import { Tokenizer } from "./tokenizers/tokenizer";

export type Matches<Location> = Map<File, Array<[Location, Location]>>;

/**
 * @param hashFilter An optional HashFilter to filter the hashes returned by
 * the rolling hash function.
 * @param noFilter A NoFilter used to generate hashes for blacklisted files.
 * @param filterHashByPercentage Defines if the fragment should be filtered by percentage or by an absolute value.
 * If this option is used [[maxHash]] must also be defined. Otherwise this option will be ignored.
 * @param maxHash The maximum fragment. How this will be used depends on the value of
 * [[filterHashByPercentage]]. If it is used as a percentage then the number should be between 0 and 1. If you want
 *  to use it as an absolute value then a number between 0 and the amount of files given would be the most useful.
 * If this option is used [[filterHashByPercentage]] must also be defined. Otherwise this options will be ignored.
 */
export interface ComparisonOptions {
  maxHash?: number;
  kmerLength?: number;
  kmersInWindow?: number;
  filterHashByPercentage?: boolean;
}

export class Comparison<Location> {

  // Maps a hash to an array of typles that are composed of the file with the same hash and the location in that file
  // where that hash is located.
  private readonly index: Map<number, Array<[File, Location]>> = new Map();
  private readonly filteredHashSet: Set<number> = new Set();
  private readonly tokenizer: Tokenizer<Location>;
  private readonly hashFilter: HashFilter;
  private readonly noFilter: NoFilter;
  private readonly maxHash: number | undefined;
  private readonly filterHashByPercentage: boolean | undefined;
  private readonly kmerLength: number;
  private readonly kmersInWindow: number;
  private fileCount: number = 0;

  /**
   * Creates a Comparison object with a given Tokenizer and optional HashFilter.
   * If no HashFilter is given, a new WinnowFilter with k-mer length 50 and windows
   * size 40 will be used.
   *
   * After creation, first add files to the index which can then be queried.
   *
   * @param tokenizer A tokenizer for the correct programming language
   * @param fragmentOptions The options used to filter based on the fragment count. For a more detailed explanation see
   * [[ComparisonOptions]]. If this options is not used then no filtering will occur.
   */
  constructor(
    tokenizer: Tokenizer<Location>,
    copts: ComparisonOptions,
  ) {
    this.tokenizer = tokenizer;
    this.kmerLength = copts.kmerLength || Options.defaultKmerLength;
    this.kmersInWindow = copts.kmersInWindow || Options.defaultKmersInWindow;
    this.hashFilter = new WinnowFilter(this.kmerLength, this.kmersInWindow);
    this.noFilter = new NoFilter(this.kmerLength);
    this.maxHash = copts.maxHash;
    this.filterHashByPercentage = copts.filterHashByPercentage;
  }

  /**
   * Adds a list of files to the comparison index.
   *
   * @param files A list of filenames
   */
  public async addAll(groups: FileGroup[]): Promise<void> {
    // This promise will reject if one of the underlying promises reject
    // which is not what we want. If one file is missing, the others should
    // still be added. In the future, Promise.all can be replaced by
    // Promise.allSettled, but for now the error handling makes sure they
    // are all resolved correctly.
    Promise.all(groups.map(this.add));
  }

  /**
   * Add a file to the comparison index.
   *
   * @param file The file name of the file to add
   */
  public add(group: FileGroup): void {
    for (const file of group.files) {
      this.fileCount += 1;
      const tokens = this.tokenizer.tokenizeFileWithMapping(file);
      tokens.map(async ([ast, mapping]) => {
        for await (const { hash, location } of this.hashFilter.hashesFromString(ast)) {
          // hash and the corresponding line number //
          const match: [File, Location] = [file, mapping[location]];
          const matches = this.index.get(hash);
          if (matches) {
            matches.push(match);
          } else {
            this.index.set(hash, [match]);
          }
        }
      });
    }
  }

  /**
   * Compare a list of files to the index. A map will be returned containing for each
   * file in the input a list of matching files. This list of matching files is also
   * represented as a map, mapping the filename to the position of the match in both files.
   *
   * @param files A list of filenames to query
   * @param hashFilter An optional HashFilter. By default the HashFilter of the Comparison
   * @param perDirectory Wether or not the files should be grouped together. Any files grouped together won't be
   * compared with other files from that same group. If a file has no group then it will compared no matter what.
   * object will be used.
   */
  public async compareFiles(
    groups: FileGroup[],
    hashFilter = this.hashFilter,
  ): Promise<Map<File, Matches<Location>>> {
    const matchingFiles: Map<File, Matches<Location>> = new Map();
    for (const group of groups) {
      for (const file of group.files) {
        const match = await this.compareFile(file, hashFilter);
        if (match.isOk()) {
          matchingFiles.set(file, match.ok());
        }
      }
    }
    return matchingFiles;
  }

  /**
   * Compare a file to the index. A map will be returned containing the filename
   * of the matching file, along with a list of matching position between the two files.
   *
   * @param file The file to query
   * @param hashFilter An optional HashFilter. By default the HashFilter of the Comparison
   * object will be used.
   * @param filesMappedToRootDirectory A map containing all the files mapped to the root of their respective project.
   * When two files have the same root they won't be compared. When a file does not have a root it will be compared
   * no matter what.
   */
  public async compareFile(
    file: File,
    hashFilter = this.hashFilter,
  ): Promise<Result<Matches<Location>>> {
    // mapping file names to line number pairs (other file, this file)
    const matchingFiles: Matches<Location> = new Map();
    const tokens = this.tokenizer.tokenizeFileWithMapping(file);
    return Result.settled(tokens.map(async ([ast, mapping]) => {
      for await (const { hash, location } of hashFilter.hashesFromString(ast)) {
        if (this.filteredHashSet.has(hash)) {
          continue;
        }
        const matches = this.index.get(hash);
        if (!matches || !this.filterByHashCount(matches.length)) {
          continue;
        }

        for (const [otherFile, lineNumber] of matches) {
          // add the match if the match is not with the file and if the file comes first when alphabetically sorted.
          // This is done to avoid the duplicates in the following case: when file A matches with file B, file B will
          // also match with file A.
          if (file.group === otherFile.group) {
            continue;
          }

          const match: [Location, Location] = [lineNumber, mapping[location]];
          const lines = matchingFiles.get(otherFile);
          if (lines) {
            lines.push(match);
          } else {
            matchingFiles.set(otherFile, [match]);
          }
        }
      }
      return matchingFiles;
    }));
  }

  /**
   * Add a file to the filter index.
   * @param file The file name of the file you want to add.
   */
  public async addToFilterList(group: FileGroup): Promise<void> {
    for (const file of group.files) {
      const tokens = await this.tokenizer.tokenizeFileWithMapping(file);
      tokens.map(async ([ast]) => {
        for await (const { hash } of this.noFilter.hashesFromString(ast)) {
          this.filteredHashSet.add(hash);
        }
      });
    }
  }

  /**
   *
   * @param hashCount The amount of times a certain hash has appeared
   * @returns true if is value is acceptable under the options given in the contructor or when the options are not
   * defined.
   */
  private filterByHashCount(hashCount: number): boolean {
    if (this.maxHash === undefined || this.filterHashByPercentage === undefined) {
      return true;
    } else if (this.filterHashByPercentage) {
      return hashCount / this.fileCount <= this.maxHash;
    } else {
      return hashCount <= this.maxHash;
    }
  }
}
