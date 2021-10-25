import { File } from "./file";
import { Region } from "../util/region";
import { Range } from "../util/range";

export class TokenizedFile extends File {

  public readonly kgrams: Array<Range>;

  constructor(
    public file: File,
    public readonly tokenStream: Array<string>,
    public readonly mapping: Array<Region>
  ) {
    super(file.path, file.content, file.extra);
    this.kgrams = [];
  }

}
