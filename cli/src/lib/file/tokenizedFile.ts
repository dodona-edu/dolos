import { File } from "./file";
import { Selection } from "../util/selection";
import { Range } from "../util/range";

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
