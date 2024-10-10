import { Identifiable } from "../util/identifiable.js";

export interface ExtraInfo {
  filename: string;
  fullName: string;
  id: string;
  status: string;
  submissionID: string;
  nameEN: string;
  nameNL: string;
  exerciseID: string;
  createdAt: Date;
  labels: string;
  ignored: string;
}

/**
 * Contains the content of a file, does not need to be backed by an actual file
 * (so it can be used to stub files in the tests).
 */
export class File extends Identifiable {

  public readonly charCount: number;
  public readonly lineCount: number;
  public readonly lines: Array<string>;
  public readonly extra?: ExtraInfo;

  public static compare(a: File, b: File): number {
    if (a.path < b.path) {
      return -1;
    } else if (a.path > b.path) {
      return 1;
    } else {
      return 0;
    }
  }

  constructor(
    public readonly path: string,
    content: string,
    extra?: ExtraInfo,
    id?: number
  ) {
    super(id);
    this.charCount = content.length;
    this.lines = content.split("\n");
    this.lineCount = this.lines.length;
    this.extra = extra;
  }

  get content(): string {
    return this.lines.join("\n");
  }

  get extension(): string {
    const idx = this.path.lastIndexOf(".");
    if (idx < 0) {
      return "";
    } else {
      return this.path.substring(idx);
    }
  }
}
