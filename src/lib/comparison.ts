import { HashFilter } from "./hashFilter";
import { Tokenizer } from "./tokenizer";
import { WinnowFilter } from "./winnowFilter";
import { NoFilter } from "./noFilter";

export type Matches<Location> = Map<string, Array<[Location, Location]>>;

export class Comparison<Location> {
  private readonly defaultK: number = 50;
  private readonly defaultW: number = 40;
  // Maps a hash to an array of typles that are composed of the file with the same hash and the location in that file
  // where that hash is located.
  private readonly index: Map<number, Array<[string, Location]>> = new Map();
  private readonly filteredHashSet: Set<number> = new Set();
  private readonly tokenizer: Tokenizer<Location>;
  private readonly hashFilter: HashFilter;
  private readonly noFilter: NoFilter;
  private fileCount: number = 0;
  private readonly maxPassage: number | undefined;
  private readonly filterPassageByPercentage: boolean;

  /**
   * Creates a Comparison object with a given Tokenizer and optional HashFilter.
   * If no HashFilter is given, a new WinnowFilter with k-mer length 50 and windows
   * size 40 will be used.
   *
   * After creation, first add files to the index which can then be queried.
   *
   * @param tokenizer A tokenizer for the correct programming language
   * @param hashFilter An optional HashFilter to filter the hashes returned by
   * the rolling hash function.
   * @param noFilter A NoFilter used to generate hashes for blacklisted files.
   */
  constructor(tokenizer: Tokenizer<Location>, hashFilter?: HashFilter, noFilter?: NoFilter, maxPassage?: number, filterPassageByPercentage: boolean = true) {
    this.tokenizer = tokenizer;
    this.hashFilter = hashFilter ? hashFilter : new WinnowFilter(this.defaultK, this.defaultW);
    this.noFilter = noFilter ? noFilter : new NoFilter(this.defaultK);
    this.maxPassage = maxPassage;
    this.filterPassageByPercentage = filterPassageByPercentage;
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
   * object will be used.
   */
  public async compareFiles(
    files: string[],
    hashFilter = this.hashFilter,
  ): Promise<Map<string, Matches<Location>>> {
    const matchingFiles: Map<string, Matches<Location>> = new Map();
    for (const file of files) {
      matchingFiles.set(file, await this.compareFile(file, hashFilter));
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
   */
  public async compareFile(file: string, hashFilter = this.hashFilter): Promise<Matches<Location>> {
    // mapping file names to line number pairs (other file, this file)
    const matchingFiles: Matches<Location> = new Map();
    const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);
    for await (const { hash, location } of hashFilter.hashesFromString(ast)) {
      if(!this.filteredHashSet.has(hash)) {
        const matches = this.index.get(hash);
        if ( matches && this.filterByPassageCount(matches.length)) {
          for (const [fileName, lineNumber] of matches) {
            // add the match if the match is not with the file.
            if (fileName !== file ) {
              const match: [Location, Location] = [lineNumber, mapping[location]];
              const lines = matchingFiles.get(fileName);
              if (lines) {
                lines.push(match);
              } else {
                matchingFiles.set(fileName, [match]);
              }
            }
          }
        }

      }
    }
    return matchingFiles;
  }

  //TODO documentation
  private filterByPassageCount(passageCount: number): boolean {
    if(!this.maxPassage) {
      return true;
    } else if(this.filterPassageByPercentage) {
      return passageCount / this.fileCount <= this.maxPassage;
    } else {
      return passageCount <= this.maxPassage;
    }
  }

  /**
   * Add a file to the filter index.
   * @param file The file name of the file you want to add.
   */
  public async addFileToFilterList(file: string): Promise<void> {
    try {
      const [ast,] = await this.tokenizer.tokenizeFileWithMapping(file);
      for await (const { hash } of this.noFilter.hashesFromString(ast)) {
        this.filteredHashSet.add(hash);
      }
    } catch (error) {
      console.error(`There was a problem parsing ${file}. ${error}`);
      return; // this makes sure the promise resolves instead of rejects
    }
  }
}
