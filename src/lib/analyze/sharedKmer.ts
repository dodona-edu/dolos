import { FilePart } from "./analysis";
import { DefaultMap } from "../util/defaultMap";
import { TokenizedFile } from "../file/tokenizedFile";

export class SharedKmer {

  private partMap: DefaultMap<TokenizedFile, Set<FilePart>>
    = new DefaultMap(() => new Set());

  constructor(
    public readonly hash: number,
    public readonly kmer: string,
  ) { }

  public add(part: FilePart): void {
    this.partMap.get(part.file).add(part);
  }

  public addAll(parts: Array<FilePart>): void {
    parts.forEach(p => this.add(p));
  }

  public parts(): Array<FilePart> {
    return Array.of(...this.partMap.values())
      .map(set => Array.of(...set))
      .flat();
  }

  public files(): Array<TokenizedFile> {
    return Array.of(...new Set(this.parts().map(p => p.file)));
  }
}
