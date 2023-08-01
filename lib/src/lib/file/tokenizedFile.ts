import { File } from "./file.js";
import { Region } from "../util/region.js";
import { Range } from "../util/range.js";
import { SharedFingerprint } from "../analyze/sharedFingerprint.js";

export class TokenizedFile extends File {

  public readonly kgrams: Array<Range>;
  public readonly shared: Set<SharedFingerprint>;

  constructor(
    public file: File,
    public readonly ast: string[],
    public readonly mapping: Array<Region>
  ) {
    super(file.path, file.content, file.extra, file.id);
    this.kgrams = [];
    this.shared = new Set<SharedFingerprint>();
  }

}
