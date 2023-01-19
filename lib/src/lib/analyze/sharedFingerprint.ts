import { Occurrence } from "./index";
import { TokenizedFile } from "../file/tokenizedFile";
import Identifiable from "../util/identifiable";

export class SharedFingerprint extends Identifiable {

  public readonly files: Array<TokenizedFile> = [];
  private partMap: Array<Array<Occurrence>> = [];

  constructor(
    public readonly hash: number,
    public readonly kgram: Array<string> | null,
  ) { super(); }

  public add(part: Occurrence): void {
    if (this.partMap[part.file.id] === undefined) {
      this.files.push(part.file);
      this.partMap[part.file.id] = [];
    }
    this.partMap[part.file.id].push(part);
  }

  public addAll(parts: Array<Occurrence>): void {
    parts.forEach(p => this.add(p));
  }

  public occurrencesOf(file: TokenizedFile): Array<Occurrence> {
    return this.partMap[file.id];
  }

  public parts(): Array<Occurrence> {
    return this.partMap.flat();
  }

  public fileCount(): number {
    return this.files.length;
  }
}
