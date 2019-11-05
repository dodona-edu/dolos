import path from "path";
import { HashFilter } from "./hashFilter";
import { NoFilter } from "./noFilter";
import { Tokenizer } from "./tokenizer";
import { WinnowFilter } from "./winnowFilter";

export type Matches<Location> = Map<string, Array<[Location, Location]>>;

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
  hashFilter?: HashFilter;
  noFilter?: NoFilter;
  maxHash?: number;
  filterHashByPercentage?: boolean;
}

export class Comparison<Location> {
  /**
   * Groups files per directory.
   * @param locations The locations you want to group.
   * @returns A map mapping a filename to it's project's root directory.
   */
  public static groupPerDirectory(files: string[]): Map<string, string> {
    const locationsFragments = files.map(filePath => filePath.split(path.sep));
    const filesGroupedPerDirectoryMap: Map<string, string[]> = new Map();
    let baseDirIndex = 0;
    let baseDir = locationsFragments[0][0];
    while (
      locationsFragments.every(filePathFragments => filePathFragments[baseDirIndex] === baseDir)
    ) {
      baseDirIndex += 1;
      baseDir = locationsFragments[0][baseDirIndex];
    }
    locationsFragments.forEach(filePathFragments => {
      let groupedFiles: string[] | undefined = filesGroupedPerDirectoryMap.get(
        filePathFragments[baseDirIndex],
      );
      if (groupedFiles === undefined) {
        groupedFiles = new Array();
        filesGroupedPerDirectoryMap.set(filePathFragments[baseDirIndex], groupedFiles);
      }
      groupedFiles.push(path.join(...filePathFragments));
    });

    const returnMap: Map<string, string> = new Map();
    for (const [directory, groupedFiles] of filesGroupedPerDirectoryMap.entries()) {
      for (const file of groupedFiles) {
        returnMap.set(file, directory);
      }
    }
    return returnMap;
  }

  /**
   * Tests if two files have the same root.
   * @param file1 The fist file you want to test.
   * @param file2 The second file you want to test.
   * @param filesMappedToRootDirectory The map mapping the files to their root.
   */
  public static sameRoot(
    file1: string,
    file2: string,
    filesMappedToRootDirectory: Map<string, string> | undefined,
  ): boolean {
    return (
      filesMappedToRootDirectory !== undefined &&
      filesMappedToRootDirectory.has(file1) &&
      filesMappedToRootDirectory.has(file2) &&
      (filesMappedToRootDirectory.get(file1) as string) ===
        (filesMappedToRootDirectory.get(file2) as string)
    );
  }
  private readonly defaultK: number = 50;
  private readonly defaultW: number = 40;
  // Maps a hash to an array of typles that are composed of the file with the same hash and the location in that file
  // where that hash is located.
  private readonly index: Map<number, Array<[string, Location]>> = new Map();
  private readonly filteredHashSet: Set<number> = new Set();
  private readonly tokenizer: Tokenizer<Location>;
  private readonly hashFilter: HashFilter;
  private readonly noFilter: NoFilter;
  private readonly maxHash: number | undefined;
  private readonly filterHashByPercentage: boolean | undefined;
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
    { hashFilter, noFilter, maxHash, filterHashByPercentage }: ComparisonOptions,
  ) {
    this.tokenizer = tokenizer;
    this.hashFilter = hashFilter || new WinnowFilter(this.defaultK, this.defaultW);
    this.noFilter = noFilter || new NoFilter(this.defaultK);
    this.maxHash = maxHash;
    this.filterHashByPercentage = filterHashByPercentage;
  }

  /**
   * Adds a list of files to the comparison index.
   *
   * @param files A list of filenames
   */
  public addFiles(files: string[]): Promise<void[]> {
    // This promise will reject if one of the underlying promises reject
    // which is not what we want. If one file is missing, the others should
    // still be added. In the future, Promise.all can be replaced by
    // Promise.allSettled, but for now the error handling makes sure they
    // are all resolved correctly.
    return Promise.all(files.map(file => this.addFile(file)));
  }

  /**
   * Add a file to the comparison index.
   *
   * @param file The file name of the file to add
   */
  public async addFile(file: string): Promise<void> {
    this.fileCount += 1;
    try {
      const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);
      for await (const { hash, location } of this.hashFilter.hashesFromString(ast)) {
        // hash and the corresponding line number //
        const match: [string, Location] = [file, mapping[location]];
        const matches = this.index.get(hash);
        if (matches) {
          matches.push(match);
        } else {
          this.index.set(hash, [match]);
        }
      }
    } catch (error) {
      console.error(`There was a problem parsing ${file}. ${error}`);
      return; // this makes sure the promise resolves instead of rejects
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
    files: string[],
    hashFilter = this.hashFilter,
    perDirectory: boolean = false,
  ): Promise<Map<string, Matches<Location>>> {
    let filesMappedToRootDirectory: Map<string, string> | undefined;
    if (perDirectory) {
      filesMappedToRootDirectory = Comparison.groupPerDirectory(files);
    }
    const matchingFiles: Map<string, Matches<Location>> = new Map();
    for (const file of files) {
      matchingFiles.set(file, await this.compareFile(file, hashFilter, filesMappedToRootDirectory));
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
    file: string,
    hashFilter = this.hashFilter,
    filesMappedToRootDirectory?: Map<string, string>,
  ): Promise<Matches<Location>> {
    // mapping file names to line number pairs (other file, this file)
    const matchingFiles: Matches<Location> = new Map();
    const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);
    for await (const { hash, location } of hashFilter.hashesFromString(ast)) {
      if (this.filteredHashSet.has(hash)) {
        continue;
      }
      const matches = this.index.get(hash);
      if (!matches || !this.filterByHashCount(matches.length)) {
        continue;
      }

      for (const [fileName, lineNumber] of matches) {
        // add the match if the match is not with the file and if the file comes first when alphabetically sorted.
        // This is done to avoid the duplicates in the following case: when file A matches with file B, file B will
        // also match with file A.
        if (fileName === file || Comparison.sameRoot(fileName, file, filesMappedToRootDirectory)) {
          continue;
        }
        const match: [Location, Location] = [lineNumber, mapping[location]];
        const lines = matchingFiles.get(fileName);
        if (lines) {
          lines.push(match);
        } else {
          matchingFiles.set(fileName, [match]);
        }
      }
    }
    return matchingFiles;
  }

  /**
   * Add a file to the filter index.
   * @param file The file name of the file you want to add.
   */
  public async addFileToFilterList(file: string): Promise<void> {
    try {
      const [ast] = await this.tokenizer.tokenizeFileWithMapping(file);
      for await (const { hash } of this.noFilter.hashesFromString(ast)) {
        this.filteredHashSet.add(hash);
      }
    } catch (error) {
      console.error(`There was a problem parsing ${file}. ${error}`);
      return; // this makes sure the promise resolves instead of rejects
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
