import { Range } from "./range";
import { Clustered, Match } from "./summary";

export interface JSONSummaryFormat {
  results: Clustered<Match>;
  comment?: string;
  options?: Array<[string, string | number]>;
}
export class JSONFormatter {
  public static readonly JSONReplacerFunction: (key: string, value: any) => any = (_, value) => {
    if (value instanceof Range) {
      const range: Range = value as Range;
      return [range.from + 1, range.to + 1];
    } else {
      return value;
    }
  }
  public static readonly JSONReviverFunction: (key: any, value: any) => any = (_, value) => {
    if (value instanceof Array && value.length === 2 && typeof value[0] === "number") {
      return new Range(value[0] - 1, value[1] - 1);
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
    comment?: string,
    options?: Array<[string, string | number]>,
  ): string {
    const toJSONObj: JSONSummaryFormat = { results: clusteredResults };
    if (comment) {
      toJSONObj.comment = comment;
    }
    if (options && options.length > 0) {
      toJSONObj.options = options;
    }
    return JSON.stringify(toJSONObj, JSONFormatter.JSONReplacerFunction);
  }
}
