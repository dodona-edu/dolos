import { File } from "./file";
import { Selection } from "./selection";

export class TokenizedFile extends File {

  constructor(
    public file: File,
    public readonly ast: string,
    public readonly mapping: Array<Selection>
  ) {
    super(file.path, file.content);
  }

}
