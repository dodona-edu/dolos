import { default as fs } from "fs";
import File from "../files/file";
import FileGroup from "../files/fileGroup";
import { Options } from "../options";
import { Range } from "../range";
import { Clustered, Match } from "../utils";

export interface JSONSummaryFormat {
  results: Clustered<Match>;
  comment?: string;
  options?: Options;
}

export class JSONFormatter {
  // @ts-ignore
  public static JSONReplacerFunction(key: string, value: any): any {
    if (value instanceof Range) {
      const range: Range = value as Range;
      return [range.from + 1, range.to + 1];
    } else if (value instanceof File) {
      return { location: value.location };
    } else {
      return value;
    }
  }

  // @ts-ignore
  public static JSONReviverFunction(key: any, value: any): any {
    if (value instanceof Array && value.length === 2 && typeof value[0] === "number") {
      return new Range(value[0] - 1, value[1] - 1);
    } else if (value.name && value.files instanceof Array) {
      const files = value.files.map((f: any) => [f.location, fs.readFileSync(f.location).toString()]);
      return FileGroup.createDirty(value.name, files);
    } else if (typeof value.location === "string") {
      const content = fs.readFileSync(value.location).toString();
      return FileGroup.createDirty(value.location, [[value.location, content]]).files[0];
    }
    return value;
  }
  /**
   * Generates a JSON representation of this summary.
   * @param comment A string you want to add to the report.
   * @param options The options used to generate the report.
   */
  public static format(
    clusteredResults: Clustered<Match>,
    options?: Options,
  ): string {
    const toJSONObj: JSONSummaryFormat = { results: clusteredResults };
    if (options) {
      if (options.comment) {
        toJSONObj.comment = options.comment;
      }
      toJSONObj.options = options;
    }
    return JSON.stringify(toJSONObj, JSONFormatter.JSONReplacerFunction);
  }
}
