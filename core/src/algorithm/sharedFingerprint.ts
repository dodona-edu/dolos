import { Occurrence } from "./fingerprintIndex.js";
import { TokenizedFile } from "../file/tokenizedFile.js";
import { Identifiable } from "../util/identifiable.js";

export class SharedFingerprint extends Identifiable {

  // Whether this SharedFingerprint occurs in the boilerplate/template code
  public ignored: boolean = false;

  private partMap: Map<TokenizedFile, Array<Occurrence>> = new Map();

  constructor(
    public readonly hash: number,
    public readonly kgram: Array<string> | null,
  ) { super(); }

  public add(part: Occurrence): void {
    const parts = this.partMap.get(part.file) || [];
    if (parts.length === 0) {
      this.partMap.set(part.file, parts);
    }
    parts.push(part);
  }

  public addAll(parts: Array<Occurrence>): void {
    parts.forEach(p => this.add(p));
  }

  public occurrencesOf(file: TokenizedFile): Array<Occurrence> {
    return this.partMap.get(file) || [];
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

  public includesFile(file: TokenizedFile): boolean {
    return this.partMap.has(file);
  }
}
