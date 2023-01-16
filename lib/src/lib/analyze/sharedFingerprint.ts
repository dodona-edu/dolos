import { Occurrence } from "./index";
import { DefaultMap } from "../util/defaultMap";
import { TokenizedFile } from "../file/tokenizedFile";
import Identifiable from "../util/identifiable";

export class SharedFingerprint extends Identifiable {

  private partMap: DefaultMap<TokenizedFile, Set<Occurrence>>
    = new DefaultMap(() => new Set());

  constructor(
    public readonly hash: number,
    public readonly kgram: Array<string> | null,
  ) { super(); }

  public add(part: Occurrence): void {
    this.partMap.get(part.file).add(part);
  }

  public addAll(parts: Array<Occurrence>): void {
    parts.forEach(p => this.add(p));
  }

  public occurrencesOf(file: TokenizedFile): Set<Occurrence> {
    return this.partMap.get(file);
  }

  public parts(): Array<Occurrence> {
    return Array.from(this.partMap.values())
      .map(set => Array.from(set))
      .flat();
  }

  public files(): Array<TokenizedFile> {
    return Array.from(this.partMap.keys());
  }

  public fileCount(): number {
    return this.partMap.size;
  }
}
