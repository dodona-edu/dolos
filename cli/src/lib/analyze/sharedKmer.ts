import { Occurrence } from "./report";
import { DefaultMap } from "../util/defaultMap";
import { TokenizedFile } from "../file/tokenizedFile";
import Identifiable from "../util/identifiable";

export class SharedKmer extends Identifiable {

  private partMap: DefaultMap<TokenizedFile, Set<Occurrence>>
    = new DefaultMap(() => new Set());

  constructor(
    public readonly hash: number,
    public readonly kmer: string,
  ) { super(); }

  public add(part: Occurrence): void {
    this.partMap.get(part.file).add(part);
  }

  public addAll(parts: Array<Occurrence>): void {
    parts.forEach(p => this.add(p));
  }

  public parts(): Array<Occurrence> {
    return Array.of(...this.partMap.values())
      .map(set => Array.of(...set))
      .flat();
  }

  public files(): Array<TokenizedFile> {
    return Array.of(...new Set(this.parts().map(p => p.file)));
  }
}
