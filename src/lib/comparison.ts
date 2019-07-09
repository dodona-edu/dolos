import { HashFilter } from "./hashFilter";
import { Tokenizer } from "./tokenizer";
import { WinnowFilter } from "./winnowFilter";

type Matches = Map<string, Array<[number, number]>>;

export class Comparison {
  private readonly defaultK: number = 50;
  private readonly defaultW: number = 40;
  private readonly index: Map<number, Array<[string, number]>> = new Map();
  private readonly tokenizer: Tokenizer;
  private readonly hashFilter: HashFilter;

  constructor(tokenizer: Tokenizer, hashFilter?: HashFilter) {
    this.tokenizer = tokenizer;
    this.hashFilter = hashFilter ? hashFilter : new WinnowFilter(this.defaultK, this.defaultW);
  }

  public addFiles(files: string[]): Promise<void[]> {
    return Promise.all(files.map(this.addFile));
  }

  public async addFile(file: string): Promise<void> {
    const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);
    for await (const [hash, position] of this.hashFilter.hashesFromString(ast)) {
      // hash and the corresponding line number
      const match: [string, number] = [file, mapping[position]];
      const matches = this.index.get(hash);
      if (matches) {
        matches.push(match);
      } else {
        this.index.set(hash, [match]);
      }
    }
  }

  public async compare(file: string, hashFilter = this.hashFilter): Promise<Matches> {
    // mapping file names to line number pairs (other file, this file)
    const matchingFiles: Matches = new Map();
    const [ast, mapping] = await this.tokenizer.tokenizeFileWithMapping(file);
    for await (const [hash, position] of hashFilter.hashesFromString(ast)) {
      const matches = this.index.get(hash);
      if (matches) {
        for (const [fileName, lineNumber] of matches) {
          const match: [number, number] = [lineNumber, mapping[position]];
          const lines = matchingFiles.get(fileName);
          if (lines) {
            lines.push(match);
          } else {
            matchingFiles.set(fileName, [match]);
          }
        }
      }
    }
    return matchingFiles;
  }
}
