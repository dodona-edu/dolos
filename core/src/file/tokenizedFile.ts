import { File } from "./file.js";
import { Region } from "../util/region.js";

export class TokenizedFile extends File {

  constructor(
    public file: File,
    public readonly tokens: Array<string>,
    public readonly mapping: Array<Region>
  ) {
    super(file.path, file.content, file.extra, file.id);
  }

}
