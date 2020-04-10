import assert from "assert";
import { HashFilter } from "../hashing/hashFilter";
import { Match } from "./match";
import { Options } from "../util/options";
import { Range } from "../util/range";
import { Selection } from "../util/selection";
import { Tokenizer } from "../tokenizer/tokenizer";
import { WinnowFilter } from "../hashing/winnowFilter";
import { File } from "../file/file";
import { TokenizedFile } from "../file/tokenizedFile";
import { Analysis } from "./analysis";

type Hash = number;

interface FilePart {
  file: TokenizedFile;
  kmer: number;
  location: Selection;
  data: string;
}

export class Comparison {
  private readonly kmerLength: number;
  private readonly kmersInWindow: number;
  private readonly index: Map<Hash, Array<FilePart>> = new Map();
  private readonly tokenizer: Tokenizer;
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
   * @param hashFilter An optional HashFilter to hashing the hashes returned by
   * the rolling hashing function.
   */
  constructor(
    tokenizer: Tokenizer,
    private readonly options: Options = new Options(),
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
   * Compare a list of files with each other and the files already stored in the
   * index. The compared files are also added to the index.
   *
   * @param files: the file objects which need to be compared to the index
   * and each other. The file hashes will be added to the index.
   * @param hashFilter: an optional HashFilter. By default the HashFilter of the
   * Comparison object will be used.
   * @return an Analysis object, which is a list of Intersections
   * (containing all the matches between two files).
   */
  public async compareFiles(
    files: File[],
    hashFilter = this.hashFilter
  ): Promise<Analysis> {

    const analysis = new Analysis(this.options);

    for (const file of files.map(f => this.tokenizer.tokenizeFile(f))) {

      let kmer = 0;
      for await (
        const { data, hash, start, stop  }
        of hashFilter.hashesFromString(file.ast)
      ) {

        // add kmer to file
        file.kmers.push(new Range(start, stop));

        // sanity check
        assert(
          Selection.isInOrder(
            file.mapping[start],
            file.mapping[stop]
          ),
          `Invallid ordering:
            expected ${file.mapping[start]}
            to start be before the end of ${file.mapping[stop]}`
        );

        const location = Selection.merge(
          file.mapping[start],
          file.mapping[stop]
        );

        const part: FilePart = { kmer, file, data, location };

        // look if the index already contains the given hashing
        const matches = this.index.get(hash);

        if (matches) {
          // the hashing exists in out index, look which files we've matched
          for (const match of matches) {

            // don't add a match if we've matched ourselves,
            // but this is internal duplication (e.g. code reuse)
            if(match.file === file) {
              continue;
            }

            if (match.file.path === file.path) {
              console.dir(match.file);
              console.dir(file);
              throw new Error("wop");
            }

            // add the match to the analysis
            analysis.addMatch(
              file,
              match.file,
              new Match(
                kmer,
                location,
                data,
                match.kmer,
                match.location,
                match.data,
                hash
              )
            );
          }

          // finally, add our matching part to the index
          matches.push(part);
        } else {

          // if the hashing does not yet exist in the index, add it
          this.index.set(hash, [part]);
        }

        kmer += 1;
      }
    }
    analysis.finish();
    return analysis;
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
    return this.compareFiles([file], hashFilter);
  }
}
