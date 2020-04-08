import { File } from "./file";
import { Selection } from "./selection";
import { Range } from "./range";

export class TokenizedFile extends File {

  public readonly kmers: Array<Range>;

  constructor(
    public file: File,
    public readonly ast: string,
    public readonly mapping: Array<Selection>
  ) {
    super(file.path, file.content);
    this.kmers = [];
  }

}
