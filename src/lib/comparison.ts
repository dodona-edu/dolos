import { HashFilter } from "./hashFilter";
import { Intersection } from "./intersection";
import { Match } from "./match";
import { Options } from "./options";
import { Selection } from "./selection";
import { Tokenizer } from "./tokenizer";
import { WinnowFilter } from "./winnowFilter";

export class Comparison {
  private readonly kmerLength: number;
  private readonly kmersInWindow: number;
  private readonly index: Map<number, Array<[string, Selection, string]>> = new Map();
  private readonly tokenizer: Tokenizer<Selection>;
  private readonly hashFilter: HashFilter;

  /**
   * Creates a Comparison object with a given Tokenizer , an optional Options
   * object, and an optional HashFilter.
   *
   * If no HashFilter is given, a new WinnowFilter is created with values geven
   * by the Options (or the default Options).
   *
   * After creation, first add files to the index which can then be queried.
   *
   * @param tokenizer A tokenizer for the correct programming language
   * @param hashFilter An optional HashFilter to filter the hashes returned by
   * the rolling hash function.
   */
  constructor(
    tokenizer: Tokenizer<Selection>,
    options: Options = new Options(),
    hashFilter?: HashFilter
  ) {
    this.tokenizer = tokenizer;
    this.kmerLength = options.kmerLength;
    this.kmersInWindow = options.kmersInWindow;
    this.hashFilter =
      hashFilter
      ? hashFilter
      : new WinnowFilter(this.kmerLength, this.kmersInWindow);
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
    try {
      const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);
      for await (const { data, hash, location } of this.hashFilter.hashesFromString(ast)) {
        // hash and the corresponding line number
        const match: [string, Selection, string] = [file, mapping[location], data];
        const matches = this.index.get(hash);
        if (matches) {
          matches.push(match);
        } else {
          this.index.set(hash, [match]);
        }
      }
    } catch (error) {
      console.error(`There was a problem parsing ${file}.`);
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
  ): Promise<Array<Intersection<Match<Selection>>>> {
    const intersections = [];
    for (const file of files) {
      intersections.push(...await this.compareFile(file, hashFilter));
    }
    return intersections;
  }

  /**
   * Compare a file to the index. A map will be returned containing the filename
   * of the matching file, along with a list of matching position between the two files.
   *
   * @param file The file to query
   * @param hashFilter An optional HashFilter. By default the HashFilter of the Comparison
   * object will be used.
   */
  public async compareFile(
    file: string,
    hashFilter = this.hashFilter,
  ): Promise<Array<Intersection<Match<Selection>>>> {

    const matchingFiles: Map<string, Intersection<Match<Selection>>> = new Map();
    const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);

    for await (const { hash, location, data } of hashFilter.hashesFromString(ast)) {
      const matches = this.index.get(hash);

      if (matches) {
        for (const [matchFile, matchSelection, matchData] of matches) {

          const match = new Match(
            mapping[location],
            data,
            matchSelection,
            matchData,
            hash,
          );

          // Find or create Intersection object
          let intersection = matchingFiles.get(matchFile);
          if (!intersection) {
            intersection = new Intersection(file, matchFile);
            matchingFiles.set(matchFile, intersection);
          }

          intersection.matches.push(match);
        }
      }
    }
    const intersections = Array.of(...matchingFiles.values());
    intersections.forEach(i => i.matches.sort((a, b) => Selection.compare(a.leftLocation, b.leftLocation)));
    return intersections;
  }
}
