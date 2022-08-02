import { File } from "./file";
import { Region } from "../util/region";
import { Range } from "../util/range";

export class TokenizedFile extends File {

  public readonly kgrams: Array<Range>;

  constructor(
    public file: File,
    public readonly ast: string[],
    public readonly mapping: Array<Region>
  ) {
    super(file.path, file.content, file.extra, file.id);
    this.kgrams = [];
  }

}
