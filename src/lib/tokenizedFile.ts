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

  public totalKmers(k: number): number {
    return this.ast.length - k + 1;
  }

  public kmer(k: number, i: number): string {
    return this.ast.substring(i, i + k);
  }

}
