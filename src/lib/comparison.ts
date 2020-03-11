import { HashFilter } from "./hashFilter";
import { Intersection } from "./intersection";
import { Match } from "./match";
import { Options } from "./options";
import { Result } from "./result";
import { Selection } from "./selection";
import { Tokenizer } from "./tokenizer";
import { WinnowFilter } from "./winnowFilter";

type Hash = number;
type File = string;
export type Analysis = Array<Intersection<Match<Selection>>>;

interface FilePart {
  file: File;
  location: Selection;
  data: string;
}

export class Comparison {
  private readonly kmerLength: number;
  private readonly kmersInWindow: number;
  private readonly index: Map<Hash, Array<FilePart>> = new Map();
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
  public addFiles(files: File[]): Promise<Array<Result<void>>> {
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
  public async addFile(file: File): Promise<Result<void>> {
    return Result.tryAwait(async () => {
      const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);

      for await (
        const { data, hash, start, stop }
        of this.hashFilter.hashesFromString(ast)
      ) {

        const location = Selection.merge(mapping[start], mapping[stop]);
        const part: FilePart = {
          file,
          data,
          location,
        };

        // look if the index already contains the given hash
        const matchingParts = this.index.get(hash);

        if (matchingParts) {
          // if it does, append it to the list of parts
          matchingParts.push(part);
        } else {
          // if it doesn't, create a new list
          this.index.set(hash, [part]);
        }
      }
    });
  }

  /**
   * Compare a list of files to the index. A map will be returned containing for
   * each file in the input a list of matching files. This list of matching
   * files is also represented as a map, mapping the filename to the position of
   * the match in both files.
   *
   * @param files A list of filenames to query
   * @param hashFilter An optional HashFilter. By default the HashFilter of the
   * Comparison object will be used.
   */
  public async compareFiles(
    files: File[],
    hashFilter = this.hashFilter
  ): Promise<Analysis> {
    const intersections = [];
    for (const file of files) {
      intersections.push(...await this.compareFile(file, hashFilter));
    }
    return intersections;
  }

  /**
   * Compare a file to the index. A map will be returned containing the filename
   * of the matching file, along with a list of matching position between the
   * two files.
   *
   * @param file The file to query
   * @param hashFilter An optional HashFilter. By default the HashFilter of the
   * Comparison object will be used.
   * @return a promise of a list of Intersection objects. An Intersection object
   * represents the common hashes (matches) between two files.
   */
  public async compareFile(
    file: File,
    hashFilter = this.hashFilter
  ): Promise<Analysis> {

    const matchingFiles: Map<File, Intersection<Match<Selection>>> = new Map();
    const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);

    for await (
      const { hash, start, stop, data } of hashFilter.hashesFromString(ast)
    ) {

      const matches = this.index.get(hash);

      if (matches) { // a match exists in our index
        for (const matchingPart of matches) {

          // Find or create an Intersection object
          let intersection = matchingFiles.get(matchingPart.file);
          if (!intersection) {
            intersection = new Intersection(file, matchingPart.file);
            matchingFiles.set(matchingPart.file, intersection);
          }

          const location = Selection.merge(mapping[start], mapping[stop]);

          // Add a new match to the intersection object
          intersection.matches.push(
            new Match(
              location,
              data,
              matchingPart.location,
              matchingPart.data,
              hash
            )
          );
        }
      }
    }

    const intersections = Array.of(...matchingFiles.values());
    intersections.forEach(i => i.matches.sort((a, b) => Selection.compare(a.leftLocation, b.leftLocation)));
    return intersections;
  }
}
