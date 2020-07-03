import * as d3 from "d3";

export interface FileMap {
 [id: number]: File;
}

export interface File {
  id: number;
  path: string;
  content: string;
  ast: string;
}

export interface Intersection {
  id: number;
  leftFile: File;
  rightFile: File;
  similarity: number;
}

export function check<T>(input: T | undefined): T {
  if (input == null) {
    throw new Error("Unexpected undefined value");
  } else {
    return input;
  }
}

export default class Data {

  private _files: FileMap | undefined;
  private _intersections: Intersection[] | undefined;

  private async fetchFiles(url = "/data/files.csv"): Promise<FileMap> {
    const data = await d3.csv(url);
    return Object.fromEntries(data.map(row => [row.id, row]));
  }

  public async files(): Promise<FileMap> {
    if (!this._files) {
      this._files = await this.fetchFiles();
    }
    return this._files;
  }

  private async fetchIntersections(
    url = "/data/intersections.csv"
  ): Promise<Intersection[]> {
    const files = await this.files();
    const data = await d3.csv(url);
    return data.map((row: d3.DSVRowString): Intersection => {
      const id = parseInt(check(row["id"]));
      const similarity = parseFloat(check(row["similarity"]));
      return {
        id,
        similarity,
        leftFile: files[parseInt(check(row["leftFileId"]))],
        rightFile: files[parseInt(check(row["rightFileId"]))],
      };
    });
  }

  public async intersections(): Promise<Intersection[]> {
    if (!this._intersections) {
      this._intersections = await this.fetchIntersections();
    }
    return this._intersections;
  }
}
